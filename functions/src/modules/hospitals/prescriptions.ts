import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { NotFoundError, PermissionDeniedError } from '../../common/errors';
import { log } from '../../common/logging';
import {
  createPrescriptionSchema,
  getUserPrescriptionsSchema,
  getPrescriptionSchema,
  getPrescriptionsSchema,
} from './types';

/**
 * createPrescription: Creates a canonical prescription record under prescriptions/{prescriptionId}
 * and populates prescription line items in prescriptions/{prescriptionId}/items/{itemId}.
 * Validates each medicine against catalogMedicines and snapshots the medicineName.
 */
export const createPrescription = secureCallable(
  createPrescriptionSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const { appointmentId, notes, items } = data;

    // 1. Verify Appointment Exists
    const appointmentRef = db.collection('hospitalAppointments').doc(appointmentId);
    const apptSnap = await appointmentRef.get();

    if (!apptSnap.exists) {
      throw new NotFoundError('Hospital Appointment', appointmentId);
    }

    const appt = apptSnap.data()!;
    const isDoctor = appt.doctorId === callerUid;
    const isAdmin = context.auth.token?.admin === true;

    if (!isDoctor && !isAdmin) {
      throw new PermissionDeniedError('Only the consulting doctor or an administrator can issue prescriptions.');
    }

    // 2. Validate all medicines in catalogMedicines and prepare item snapshots
    const validatedItems: Array<{
      id: string;
      medicineId: string;
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
      instructions: string;
    }> = [];

    for (const item of items) {
      const medRef = db.collection('catalogMedicines').doc(item.medicineId);
      const medSnap = await medRef.get();
      let medicineName = item.medicineId;

      if (medSnap.exists) {
        medicineName = medSnap.data()?.name || medicineName;
      }

      validatedItems.push({
        id: db.collection('prescriptions').doc().id,
        medicineId: item.medicineId,
        medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions || 'After food',
      });
    }

    // 3. Create Canonical Prescription Document
    const prescriptionRef = db.collection('prescriptions').doc();
    const prescriptionId = prescriptionRef.id;

    const prescriptionRecord = {
      id: prescriptionId,
      userId: appt.userId,
      appointmentId,
      doctorId: appt.doctorId,
      hospitalId: appt.hospitalId,
      status: 'active',
      prescriptionDate: FieldValue.serverTimestamp(),
      notes: notes || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(prescriptionRef, prescriptionRecord);

    // 4. Create Subcollection Items in prescriptions/{prescriptionId}/items/{itemId}
    for (const item of validatedItems) {
      const itemRef = prescriptionRef.collection('items').doc(item.id);
      batch.set(itemRef, {
        id: item.id,
        prescriptionId,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 5. Update Appointment flag
    batch.update(appointmentRef, {
      hasPrescription: true,
      prescriptionId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    log.audit('prescription_created', {
      actorUid: callerUid,
      prescriptionId,
      appointmentId,
      patientId: appt.userId,
      itemCount: validatedItems.length,
    });

    return {
      success: true,
      prescriptionId,
      items: validatedItems,
    };
  }
);

/**
 * getUserPrescriptions: Retrieves all prescriptions belonging to the signed-in patient.
 */
export const getUserPrescriptions = secureCallable(
  getUserPrescriptionsSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const targetUserId = (data?.userId && context.auth.token?.admin === true) ? data.userId : callerUid;

    const snap = await db
      .collection('prescriptions')
      .where('userId', '==', targetUserId)
      .orderBy('prescriptionDate', 'desc')
      .limit(data?.limit || 20)
      .get();

    const prescriptions = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { prescriptions };
  }
);

/**
 * getPrescription: Retrieves a specific prescription along with its subcollection items.
 */
export const getPrescription = secureCallable(
  getPrescriptionSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const prescriptionRef = db.collection('prescriptions').doc(data.prescriptionId);
    const snap = await prescriptionRef.get();

    if (!snap.exists) {
      throw new NotFoundError('Prescription', data.prescriptionId);
    }

    const pres = snap.data()!;
    const isOwner = pres.userId === callerUid;
    const isDoctor = pres.doctorId === callerUid;
    const isAdmin = context.auth.token?.admin === true;

    if (!isOwner && !isDoctor && !isAdmin) {
      throw new PermissionDeniedError('Access denied to this prescription.');
    }

    // Fetch subcollection items
    const itemsSnap = await prescriptionRef.collection('items').get();
    const items = itemsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      prescription: {
        id: snap.id,
        ...pres,
        items,
      },
    };
  }
);

// ============================================================================
// LEGACY COMPATIBILITY ALIASES
// ============================================================================

export const getPrescriptions = secureCallable(
  getPrescriptionsSchema,
  async (data) => {
    const { appointmentId } = data;

    const snap = await db
      .collection('prescriptions')
      .where('appointmentId', '==', appointmentId)
      .limit(10)
      .get();

    const prescriptions = await Promise.all(
      snap.docs.map(async (doc) => {
        const presData = doc.data();
        const itemsSnap = await doc.ref.collection('items').get();
        return {
          id: doc.id,
          ...presData,
          items: itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() })),
        };
      })
    );

    return { prescriptions };
  }
);

export const issuePrescription = createPrescription;

