import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable, publicCallable } from '../../common/auth';
import { NotFoundError, PermissionDeniedError, PreconditionFailedError } from '../../common/errors';
import { log } from '../../common/logging';
import { validateAppointmentTransition } from '../../domain/stateMachines';
import { AppointmentStatus } from '../../domain/enums';
import {
  getHospitalsSchema,
  getHospitalSchema,
  getHospitalDepartmentsSchema,
  getHospitalDoctorsSchema,
  getDoctorAvailabilitySchema,
  createHospitalAppointmentSchema,
  confirmHospitalAppointmentSchema,
  cancelHospitalAppointmentSchema,
  completeHospitalAppointmentSchema,
  listDoctorsSchema,
  getMyAppointmentSchema,
  listMyAppointmentsSchema,
  updateAppointmentStatusSchema,
} from './types';

// ============================================================================
// 1. HOSPITAL CATALOG DISCOVERY
// ============================================================================

/**
 * getHospitals: Retrieves active hospital catalog entries with city/search filters.
 */
export const getHospitals = publicCallable(getHospitalsSchema, async (data) => {
  let query: FirebaseFirestore.Query = db.collection('catalogHospitals').where('active', '==', true);

  if (data.cityKey) {
    query = query.where('cityKey', '==', data.cityKey.toLowerCase().trim());
  }

  const snap = await query.limit(data.limit).get();
  let hospitals = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (data.searchQuery && data.searchQuery.trim()) {
    const q = data.searchQuery.toLowerCase().trim();
    hospitals = hospitals.filter(
      (h: any) =>
        (h.name && h.name.toLowerCase().includes(q)) ||
        (h.description && h.description.toLowerCase().includes(q)) ||
        (h.services && Array.isArray(h.services) && h.services.some((s: string) => s.toLowerCase().includes(q))) ||
        (h.departments && Array.isArray(h.departments) && h.departments.some((d: string) => d.toLowerCase().includes(q)))
    );
  }

  return { hospitals };
});

export const searchHospitals = getHospitals;

/**
 * getHospital: Retrieves a single hospital by ID from catalogHospitals/{hospitalId}.
 */
export const getHospital = publicCallable(getHospitalSchema, async (data) => {
  const docRef = db.collection('catalogHospitals').doc(data.hospitalId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Hospital', data.hospitalId);
  }

  const hospital = snap.data()!;
  if (hospital.active === false) {
    throw new PreconditionFailedError('Hospital is currently inactive.');
  }

  return {
    hospital: {
      id: snap.id,
      ...hospital,
    },
  };
});

/**
 * getHospitalDepartments: Retrieves all active departments under catalogHospitals/{hospitalId}/departments.
 */
export const getHospitalDepartments = publicCallable(getHospitalDepartmentsSchema, async (data) => {
  const departmentsRef = db
    .collection('catalogHospitals')
    .doc(data.hospitalId)
    .collection('departments')
    .where('active', '==', true);

  const snap = await departmentsRef.get();
  const departments = snap.docs.map((doc) => ({
    id: doc.id,
    hospitalId: data.hospitalId,
    ...doc.data(),
  }));

  return { departments };
});

/**
 * getHospitalDoctors: Retrieves all active doctors under catalogHospitals/{hospitalId}/doctors.
 * Optionally filtered by departmentId.
 */
export const getHospitalDoctors = publicCallable(getHospitalDoctorsSchema, async (data) => {
  let doctorsRef: FirebaseFirestore.Query = db
    .collection('catalogHospitals')
    .doc(data.hospitalId)
    .collection('doctors')
    .where('active', '==', true);

  if (data.departmentId) {
    doctorsRef = doctorsRef.where('departmentId', '==', data.departmentId);
  }

  const snap = await doctorsRef.limit(data.limit).get();
  let doctors = snap.docs.map((doc) => ({
    id: doc.id,
    hospitalId: data.hospitalId,
    ...doc.data(),
  }));

  if (data.mode) {
    doctors = doctors.filter(
      (doc: any) => Array.isArray(doc.consultationModes) && doc.consultationModes.includes(data.mode)
    );
  }

  return { doctors };
});

/**
 * listDoctors: Cross-hospital and specialty doctor discovery.
 */
export const listDoctors = publicCallable(listDoctorsSchema, async (data) => {
  let doctors: any[] = [];

  if (data.hospitalId) {
    const doctorsRef = db
      .collection('catalogHospitals')
      .doc(data.hospitalId)
      .collection('doctors')
      .where('active', '==', true);
    const snap = await doctorsRef.limit(data.limit).get();
    doctors = snap.docs.map((doc) => ({
      id: doc.id,
      hospitalId: data.hospitalId,
      ...doc.data(),
    }));
  } else {
    let groupQuery: FirebaseFirestore.Query = db.collectionGroup('doctors').where('active', '==', true);

    if (data.specialtyId) {
      groupQuery = groupQuery.where('specialtyIds', 'array-contains', data.specialtyId);
    }

    const snap = await groupQuery.limit(data.limit).get();
    doctors = snap.docs.map((doc) => {
      const hospitalId = doc.ref.parent.parent?.id || '';
      return {
        id: doc.id,
        hospitalId,
        ...doc.data(),
      };
    });
  }

  if (data.mode) {
    doctors = doctors.filter(
      (doc: any) => Array.isArray(doc.consultationModes) && doc.consultationModes.includes(data.mode)
    );
  }

  return { doctors };
});

/**
 * getDoctorAvailability: Lists bookable consultation time slots for a doctor under
 * catalogHospitals/{hospitalId}/doctors/{doctorId}/availability.
 */
export const getDoctorAvailability = publicCallable(getDoctorAvailabilitySchema, async (data) => {
  let slotsRef: FirebaseFirestore.Query = db
    .collection('catalogHospitals')
    .doc(data.hospitalId)
    .collection('doctors')
    .doc(data.doctorId)
    .collection('availability')
    .where('active', '==', true);

  if (data.dateString) {
    slotsRef = slotsRef.where('dateString', '==', data.dateString);
  }

  const snap = await slotsRef.limit(50).get();
  const slots = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  return { slots };
});

export const listAvailability = getDoctorAvailability;

// ============================================================================
// 2. APPOINTMENT TRANSACTIONAL OPERATIONS (DOUBLE-BOOKING SAFE)
// ============================================================================

/**
 * createHospitalAppointment: Transactional slot verification, pricing resolution,
 * atomic reservation, and creation of canonical hospitalAppointments record with initial event.
 */
export const createHospitalAppointment = secureCallable(
  createHospitalAppointmentSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const appointmentId = data.idempotencyKey || db.collection('hospitalAppointments').doc().id;
    const appointmentRef = db.collection('hospitalAppointments').doc(appointmentId);

    log.info(`[createHospitalAppointment] Initiating appointment for user ${uid}, doctor ${data.doctorId}`, {
      appointmentId,
      hospitalId: data.hospitalId,
    });

    const result = await db.runTransaction(async (t) => {
      // 1. Idempotency Check
      const existing = await t.get(appointmentRef);
      if (existing.exists) {
        log.warn(`[createHospitalAppointment] Idempotent replay for appointment ${appointmentId}`);
        const existingData = existing.data()!;
        return {
          success: true,
          appointmentId,
          status: existingData.status,
          replayed: true,
        };
      }

      // 2. Validate Hospital Exists & Active
      const hospRef = db.collection('catalogHospitals').doc(data.hospitalId);
      const hospSnap = await t.get(hospRef);
      if (!hospSnap.exists) {
        throw new NotFoundError('Hospital', data.hospitalId);
      }
      const hospData = hospSnap.data()!;
      if (hospData.active === false) {
        throw new PreconditionFailedError('Hospital is not currently active for bookings.');
      }
      const hospitalName = hospData.name || 'Hospital';

      // 3. Validate Doctor Exists & Active
      const doctorRef = hospRef.collection('doctors').doc(data.doctorId);
      const doctorSnap = await t.get(doctorRef);
      if (!doctorSnap.exists) {
        throw new NotFoundError('Doctor', data.doctorId);
      }
      const docData = doctorSnap.data()!;
      if (docData.active === false) {
        throw new PreconditionFailedError('Doctor is not currently active for appointments.');
      }
      const doctorName = docData.name || docData.displayName || 'Specialist Doctor';
      const doctorSpecialty = docData.specialization || docData.specialty || 'General Medicine';
      const feeMinor = docData.consultationFeeMinor || 50000; // Integer currency in minor units
      const currency = docData.currency || 'INR';

      // 4. Validate Department Exists
      const deptRef = hospRef.collection('departments').doc(data.departmentId);
      const deptSnap = await t.get(deptRef);
      const deptName = deptSnap.exists ? deptSnap.data()?.name || data.departmentId : data.departmentId;

      // 5. Atomic Slot Verification & Double-Booking Prevention
      const slotRef = doctorRef.collection('availability').doc(data.slotId);
      const slotSnap = await t.get(slotRef);

      let slotStartAt = Timestamp.now();
      let slotEndAt = Timestamp.fromMillis(slotStartAt.toMillis() + 30 * 60 * 1000);

      if (slotSnap.exists) {
        const slotData = slotSnap.data()!;
        if (slotData.status !== 'available' && slotData.bookable === false) {
          throw new PreconditionFailedError('This time slot is no longer available. Please select another slot.');
        }

        slotStartAt = slotData.startAt || slotData.startsAt || slotStartAt;
        slotEndAt = slotData.endAt || slotData.endsAt || slotEndAt;

        // Atomically lock the slot
        t.update(slotRef, {
          status: 'booked',
          bookable: false,
          appointmentId,
          reservedBy: uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Generate token number & video telehealth room link
      const tokenNumber = `#${Math.floor(1 + Math.random() * 40)}`;
      const meetingLink =
        data.mode === 'video'
          ? `https://meet.onebuddy.health/room-ob-${appointmentId.toLowerCase().slice(0, 10)}`
          : null;

      // 6. Create Canonical Hospital Appointment Document
      const appointmentRecord = {
        id: appointmentId,
        userId: uid,
        hospitalId: data.hospitalId,
        hospitalName,
        departmentId: data.departmentId,
        departmentName: deptName,
        doctorId: data.doctorId,
        doctorName,
        doctorSpecialty,
        slotId: data.slotId,
        appointmentDate: slotStartAt,
        scheduledAt: slotStartAt,
        startsAt: slotStartAt,
        endsAt: slotEndAt,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        addressSnapshot: data.addressSnapshot || null,
        reason: data.reason || 'General Consultation',
        status: 'confirmed' as AppointmentStatus,
        consultationFeeMinor: feeMinor,
        finalPriceMinor: feeMinor,
        currency,
        notes: data.notes || null,
        mode: data.mode,
        tokenNumber,
        meetingLink,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      t.set(appointmentRef, appointmentRecord);

      // 7. Append Initial Lifecycle Event to Subcollection events/{eventId} (Immutable History)
      const eventRef = appointmentRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: null,
        toStatus: 'confirmed',
        actorId: uid,
        actorType: 'user',
        note: `Appointment created and confirmed (${data.mode === 'video' ? 'Video Consultation' : 'In-Person OPD'})`,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 8. Project into User Orders Feed: users/{uid}/orders/{appointmentId}
      const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(appointmentId);
      const dateDisplay = slotStartAt.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      t.set(userOrderRef, {
        id: appointmentId,
        category: 'healthcare',
        icon: data.mode === 'video' ? 'video' : 'stethoscope',
        title: `${doctorName} â€¢ ${doctorSpecialty}`,
        subtitle: `${hospitalName} â€¢ Token ${tokenNumber}`,
        meta: `Scheduled: ${dateDisplay} (${data.mode === 'video' ? 'Tele-Consultation' : 'OPD'})`,
        status: 'Confirmed',
        statusKind: 'upcoming',
        group: 'Upcoming',
        price: `â‚¹${(feeMinor / 100).toFixed(0)}`,
        actions: data.mode === 'video' ? ['Join Video Call', 'Cancel'] : ['View E-Token', 'Cancel'],
        appointmentId,
        doctorName,
        hospitalName,
        mode: data.mode,
        meetingLink,
        tokenNumber,
        startsAt: slotStartAt,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        appointmentId,
        tokenNumber,
        meetingLink,
        consultationFeeMinor: feeMinor,
        status: 'confirmed',
      };
    });

    log.audit('hospital_appointment_created', {
      actorUid: uid,
      appointmentId: result.appointmentId,
      hospitalId: data.hospitalId,
      doctorId: data.doctorId,
    });

    return result;
  }
);

export const bookAppointment = createHospitalAppointment;

/**
 * confirmHospitalAppointment: Confirms a requested appointment and registers the lifecycle event.
 */
export const confirmHospitalAppointment = secureCallable(
  confirmHospitalAppointmentSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const appointmentRef = db.collection('hospitalAppointments').doc(data.appointmentId);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(appointmentRef);
      if (!snap.exists) {
        throw new NotFoundError('Hospital Appointment', data.appointmentId);
      }

      const appt = snap.data()!;
      validateAppointmentTransition(appt.status as AppointmentStatus, 'confirmed');

      t.update(appointmentRef, {
        status: 'confirmed',
        updatedAt: FieldValue.serverTimestamp(),
      });

      const eventRef = appointmentRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: appt.status,
        toStatus: 'confirmed',
        actorId: callerUid,
        actorType: context.auth.token?.admin === true ? 'admin' : 'staff',
        note: data.notes || 'Appointment confirmed',
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        appointmentId: data.appointmentId,
        status: 'confirmed',
      };
    });
  }
);

/**
 * cancelHospitalAppointment: Transactional release of the reserved slot and status transition to 'cancelled'.
 */
export const cancelHospitalAppointment = secureCallable(
  cancelHospitalAppointmentSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const appointmentRef = db.collection('hospitalAppointments').doc(data.appointmentId);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(appointmentRef);
      if (!snap.exists) {
        throw new NotFoundError('Hospital Appointment', data.appointmentId);
      }

      const appointment = snap.data()!;
      if (appointment.userId !== uid && context.auth.token?.admin !== true) {
        throw new PermissionDeniedError('You do not own this appointment.');
      }

      if (appointment.status === 'cancelled') {
        return { success: true, appointmentId: data.appointmentId, message: 'Already cancelled.' };
      }

      validateAppointmentTransition(appointment.status as AppointmentStatus, 'cancelled');

      // 1. Transactionally release slot
      if (appointment.slotId && appointment.hospitalId && appointment.doctorId) {
        const slotRef = db
          .collection('catalogHospitals')
          .doc(appointment.hospitalId)
          .collection('doctors')
          .doc(appointment.doctorId)
          .collection('availability')
          .doc(appointment.slotId);

        const slotSnap = await t.get(slotRef);
        if (slotSnap.exists) {
          t.update(slotRef, {
            status: 'available',
            bookable: true,
            appointmentId: null,
            reservedBy: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // 2. Update Appointment Document
      t.update(appointmentRef, {
        status: 'cancelled',
        cancellationReason: data.reason || 'Cancelled by patient',
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 3. Append Immutable Event
      const eventRef = appointmentRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: appointment.status,
        toStatus: 'cancelled',
        actorId: uid,
        actorType: 'user',
        note: data.reason || 'Cancelled by patient',
        createdAt: FieldValue.serverTimestamp(),
      });

      // 4. Update user order projection
      const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(data.appointmentId);
      t.set(
        userOrderRef,
        {
          status: 'Cancelled',
          statusKind: 'done',
          group: 'Completed',
          actions: ['Rebook'],
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        appointmentId: data.appointmentId,
        status: 'cancelled',
      };
    });
  }
);

export const cancelAppointment = cancelHospitalAppointment;

/**
 * completeHospitalAppointment: Transitions appointment to 'completed' and records completion event.
 */
export const completeHospitalAppointment = secureCallable(
  completeHospitalAppointmentSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const appointmentRef = db.collection('hospitalAppointments').doc(data.appointmentId);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(appointmentRef);
      if (!snap.exists) {
        throw new NotFoundError('Hospital Appointment', data.appointmentId);
      }

      const appt = snap.data()!;
      validateAppointmentTransition(appt.status as AppointmentStatus, 'completed');

      t.update(appointmentRef, {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const eventRef = appointmentRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: appt.status,
        toStatus: 'completed',
        actorId: callerUid,
        actorType: context.auth.token?.admin === true ? 'admin' : 'doctor',
        note: data.notes || 'Consultation successfully completed',
        createdAt: FieldValue.serverTimestamp(),
      });

      const userOrderRef = db.collection('users').doc(appt.userId).collection('orders').doc(data.appointmentId);
      t.set(
        userOrderRef,
        {
          status: 'Completed',
          statusKind: 'done',
          group: 'Completed',
          actions: ['View Prescription', 'Book Again'],
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        appointmentId: data.appointmentId,
        status: 'completed',
      };
    });
  }
);

/**
 * getMyAppointment: Retrieves full details of a specific appointment with lifecycle history.
 */
export const getMyAppointment = secureCallable(getMyAppointmentSchema, async (data, context) => {
  const uid = context.auth.uid;
  const appointmentRef = db.collection('hospitalAppointments').doc(data.appointmentId);
  const snap = await appointmentRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Hospital Appointment', data.appointmentId);
  }

  const appt = snap.data()!;
  const isOwner = appt.userId === uid;
  const isDoctor = appt.doctorId === uid;
  const isAdmin = context.auth.token?.admin === true;

  if (!isOwner && !isDoctor && !isAdmin) {
    throw new PermissionDeniedError('Access denied.');
  }

  const eventsSnap = await appointmentRef.collection('events').orderBy('createdAt', 'asc').limit(30).get();
  const events = eventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    appointment: {
      id: snap.id,
      ...appt,
      events,
    },
  };
});

/**
 * listMyAppointments: Lists all appointments for the authenticated patient.
 */
export const listMyAppointments = secureCallable(listMyAppointmentsSchema, async (data, context) => {
  const uid = context.auth.uid;
  const snap = await db
    .collection('hospitalAppointments')
    .where('userId', '==', uid)
    .orderBy('scheduledAt', 'desc')
    .limit(data.limit)
    .get();

  const appointments = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { appointments };
});

/**
 * updateAppointmentStatus: Transitions an appointment's lifecycle state (Staff / Doctor / Admin).
 */
export const updateAppointmentStatus = secureCallable(
  updateAppointmentStatusSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const appointmentRef = db.collection('hospitalAppointments').doc(data.appointmentId);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(appointmentRef);
      if (!snap.exists) {
        throw new NotFoundError('Hospital Appointment', data.appointmentId);
      }

      const appt = snap.data()!;
      validateAppointmentTransition(appt.status as AppointmentStatus, data.status);

      t.update(appointmentRef, {
        status: data.status,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const eventRef = appointmentRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: appt.status,
        toStatus: data.status,
        actorType: context.auth.token?.admin === true ? 'admin' : 'staff',
        actorId: callerUid,
        note: data.note || `Status updated to ${data.status}`,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        appointmentId: data.appointmentId,
        previousStatus: appt.status,
        currentStatus: data.status,
      };
    });
  }
);

