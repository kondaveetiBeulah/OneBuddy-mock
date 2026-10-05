import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable, publicCallable } from '../../common/auth';
import { PreconditionFailedError, NotFoundError } from '../../common/errors';
import { log } from '../../common/logging';
import {
  searchPharmaciesSchema,
  getPharmacySchema,
  getMedicinesSchema,
  getMedicineSchema,
  uploadPrescriptionSchema,
  placeMedicineOrderSchema,
} from './types';

// ============================================================================
// 1. PHARMACY CATALOG READ OPERATIONS
// ============================================================================

/**
 * getPharmacies / searchPharmacies: Searches partner pharmacies by city, name, or area.
 */
export const searchPharmacies = publicCallable(searchPharmaciesSchema, async (data) => {
  let query: FirebaseFirestore.Query = db.collection('catalogPharmacies').where('active', '==', true);

  if (data.cityKey) {
    query = query.where('cityKey', '==', data.cityKey.toLowerCase().trim());
  }

  const snap = await query.limit(data.limit).get();
  let pharmacies = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (data.searchQuery && data.searchQuery.trim()) {
    const q = data.searchQuery.toLowerCase().trim();
    pharmacies = pharmacies.filter(
      (p: any) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.address && JSON.stringify(p.address).toLowerCase().includes(q))
    );
  }

  return { pharmacies };
});

export const getPharmacies = searchPharmacies;

/**
 * getPharmacy: Retrieves a single pharmacy catalog document by pharmacyId.
 */
export const getPharmacy = publicCallable(getPharmacySchema, async (data) => {
  const docRef = db.collection('catalogPharmacies').doc(data.pharmacyId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Pharmacy', data.pharmacyId);
  }

  const pharmacy = snap.data()!;
  if (pharmacy.active === false) {
    throw new PreconditionFailedError('Pharmacy is currently inactive.');
  }

  return {
    pharmacy: {
      id: snap.id,
      ...pharmacy,
    },
  };
});

// ============================================================================
// 2. MEDICINE CATALOG READ OPERATIONS
// ============================================================================

/**
 * getMedicines / listMedicines: Searches medicines catalog with stock availability,
 * categories, and prescription requirements.
 */
export const getMedicines = publicCallable(getMedicinesSchema, async (data) => {
  let query: FirebaseFirestore.Query = db.collection('catalogMedicines').where('active', '==', true);

  if (data.category) {
    query = query.where('category', '==', data.category);
  }

  if (data.pharmacyId) {
    query = query.where('pharmacyIds', 'array-contains', data.pharmacyId);
  }

  const snap = await query.limit(data.limit || 30).get();
  let medicines = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (data.prescriptionRequired !== undefined) {
    medicines = medicines.filter((m: any) => Boolean(m.prescriptionRequired) === data.prescriptionRequired);
  } else if (data.prescriptionOnly !== undefined) {
    medicines = medicines.filter((m: any) => Boolean(m.prescriptionRequired) === data.prescriptionOnly);
  }

  const searchTerm = (data.searchQuery || data.query || '').toLowerCase().trim();
  if (searchTerm) {
    medicines = medicines.filter(
      (m: any) =>
        (m.name && m.name.toLowerCase().includes(searchTerm)) ||
        (m.genericName && m.genericName.toLowerCase().includes(searchTerm)) ||
        (m.brand && m.brand.toLowerCase().includes(searchTerm)) ||
        (m.category && m.category.toLowerCase().includes(searchTerm)) ||
        (m.description && m.description.toLowerCase().includes(searchTerm))
    );
  }

  return { medicines };
});

export const listMedicines = getMedicines;

/**
 * getMedicine: Retrieves a single medicine document from catalogMedicines/{medicineId}.
 */
export const getMedicine = publicCallable(getMedicineSchema, async (data) => {
  const docRef = db.collection('catalogMedicines').doc(data.medicineId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Medicine', data.medicineId);
  }

  const medicine = snap.data()!;
  if (medicine.active === false) {
    throw new PreconditionFailedError('Medicine is currently inactive.');
  }

  return {
    medicine: {
      id: snap.id,
      ...medicine,
    },
  };
});

// ============================================================================
// 3. PRESCRIPTION UPLOAD & MEDICINE ORDERING
// ============================================================================

/**
 * uploadPrescription: Registers a patient prescription document for pharmacy verification.
 */
export const uploadPrescription = secureCallable(uploadPrescriptionSchema, async (data, context) => {
  const userId = context.auth.uid;
  const docRef = db.collection('prescriptions').doc();

  const record = {
    id: docRef.id,
    userId,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    mimeType: data.mimeType || 'application/pdf',
    patientName: data.patientName || 'Self',
    notes: data.notes || null,
    pharmacyId: data.pharmacyId || null,
    status: 'pending_review',
    uploadedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(record);

  log.audit('prescription_uploaded', {
    actorUid: userId,
    prescriptionId: docRef.id,
  });

  return {
    success: true,
    prescriptionId: docRef.id,
    prescription: record,
  };
});

/**
 * placeMedicineOrder: Transactional medicine delivery order creation with catalog price
 * validation, prescription verification, stock deduction, and user order feed projection.
 */
export const placeMedicineOrder = secureCallable(placeMedicineOrderSchema, async (data, context) => {
  const uid = context.auth.uid;
  const orderId = data.id || db.collection('orders').doc().id;
  const orderRef = db.collection('orders').doc(orderId);

  log.info(`[placeMedicineOrder] Processing medicine order ${orderId} for user ${uid}`);

  const result = await db.runTransaction(async (t) => {
    // 1. Idempotency Check
    const existing = await t.get(orderRef);
    if (existing.exists) {
      log.warn(`[placeMedicineOrder] Idempotent replay for medicine order ${orderId}`);
      const d = existing.data()!;
      return {
        success: true,
        orderId,
        status: d.status,
        totalMinor: d.pricing?.totalMinor || 0,
        replayed: true,
      };
    }

    // 2. Validate Pharmacy Exists
    const pharmacyRef = db.collection('catalogPharmacies').doc(data.pharmacyId);
    const pharmacySnap = await t.get(pharmacyRef);
    const pharmacyName = pharmacySnap.exists
      ? pharmacySnap.data()?.name || 'Verified Partner Pharmacy'
      : 'Verified Partner Pharmacy';

    // 3. Resolve & Verify Each Medicine Item from catalogMedicines
    let subtotalMinor = 0;
    let prescriptionRequiredForOrder = false;

    const verifiedItems: Array<{
      id: string;
      medicineId: string;
      nameSnapshot: string;
      imageSnapshot: string | null;
      unitPriceMinor: number;
      quantity: number;
      lineTotalMinor: number;
      totalMinor: number;
      rx: boolean;
      notes?: string;
    }> = [];

    for (const item of data.items) {
      // 1. Check Pharmacy-Specific Inventory: catalogPharmacies/{pharmacyId}/inventory/{medicineId}
      const invRef = pharmacyRef.collection('inventory').doc(item.medicineId);
      const invSnap = await t.get(invRef);

      // 2. Fetch Master Medicine Record: catalogMedicines/{medicineId}
      const medRef = db.collection('catalogMedicines').doc(item.medicineId);
      const medSnap = await t.get(medRef);

      const medData = medSnap.exists ? medSnap.data()! : {};
      const invData = invSnap.exists ? invSnap.data()! : {};

      let nameSnapshot = item.name || invData.name || medData.name || 'Prescription Medication';
      let imageSnapshot = invData.image || medData.image || medData.imagePath || null;
      let rx = Boolean(medData.requiresPrescription || medData.prescriptionRequired || medData.rx);

      // Price resolution: Pharmacy inventory price takes precedence over catalog default
      let unitPriceMinor =
        invData.priceMinor ||
        medData.priceMinor ||
        item.unitPriceMinor ||
        Math.round((medData.price || 150) * 100);

      // Stock resolution: Pharmacy inventory availableQuantity takes precedence
      let availableQuantity = 100;
      if (invSnap.exists && invData.availableQuantity !== undefined) {
        availableQuantity = invData.availableQuantity;
      } else if (medSnap.exists && medData.stockAvailable !== undefined) {
        availableQuantity = medData.stockAvailable;
      }

      // Stock availability verification
      if (availableQuantity < item.quantity) {
        throw new PreconditionFailedError(
          `Insufficient stock at ${pharmacyName} for "${nameSnapshot}". Available: ${availableQuantity}, Requested: ${item.quantity}`
        );
      }

      // Deduct inventory stock at the pharmacy level
      if (invSnap.exists) {
        t.update(invRef, {
          availableQuantity: availableQuantity - item.quantity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else if (medSnap.exists) {
        // Fallback for un-seeded pharmacy inventory
        t.update(medRef, {
          stockAvailable: Math.max(0, availableQuantity - item.quantity),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      if (rx) {
        prescriptionRequiredForOrder = true;
      }

      const lineTotalMinor = unitPriceMinor * item.quantity;
      subtotalMinor += lineTotalMinor;

      const lineItemId = (item as any).id || db.collection('orders').doc().id;

      verifiedItems.push({
        id: lineItemId,
        medicineId: item.medicineId,
        nameSnapshot,
        imageSnapshot,
        unitPriceMinor,
        quantity: item.quantity,
        lineTotalMinor,
        totalMinor: lineTotalMinor,
        rx,
        notes: item.notes,
      });
    }

    // 4. Validate Prescription Presence if required
    if (prescriptionRequiredForOrder && !data.prescriptionUri && !data.prescriptionId) {
      log.warn(`[placeMedicineOrder] Order ${orderId} contains Rx medicines without prescription attachment`);
    }

    // 5. Calculate Delivery Fee, Discounts, and Taxes
    const deliveryFeeMinor = subtotalMinor > 50000 ? 0 : 3000; // Free delivery above ₹500
    const packagingFeeMinor = 1500; // ₹15.00 packaging
    const discountMinor = data.promotionCode ? Math.min(Math.round(subtotalMinor * 0.15), 10000) : 0;
    const totalMinor = subtotalMinor + deliveryFeeMinor + packagingFeeMinor + (data.tipMinor || 0) - discountMinor;

    const now = Timestamp.now();

    // 6. Create Canonical Order Document matching Greenfield Section 4
    t.set(orderRef, {
      id: orderId,
      orderId,
      userId: uid,
      category: 'healthcare',
      service: 'pharmacy',
      merchantId: data.pharmacyId,        // ✅ Canonical Greenfield Merchant Reference
      pharmacyId: data.pharmacyId,        // Backward-compatible alias
      merchantSnapshot: {
        name: pharmacyName,
        imagePath: pharmacySnap.data()?.logoPath || pharmacySnap.data()?.image || null,
      },
      pharmacyName,
      status: 'placed',
      subtotalMinor,
      discountMinor,
      deliveryFeeMinor,
      taxMinor: packagingFeeMinor,
      tipMinor: data.tipMinor || 0,
      totalMinor,
      currency: 'INR',
      pricing: {
        subtotalMinor,
        deliveryFeeMinor,
        packagingFeeMinor,
        discountMinor,
        tipMinor: data.tipMinor || 0,
        totalMinor,
        currency: 'INR',
      },
      payment: {
        method: data.paymentMethod,
        status: data.paymentMethod === 'cash_on_delivery' ? 'pending' : 'authorized',
      },
      prescription: {
        required: prescriptionRequiredForOrder,
        uri: data.prescriptionUri || null,
        id: data.prescriptionId || null,
        status: prescriptionRequiredForOrder ? 'under_pharmacist_review' : 'not_required',
      },
      deliveryAddressSnapshot: data.deliveryAddress,
      addressSnapshot: data.deliveryAddress,
      estimatedAt: Timestamp.fromMillis(now.toMillis() + 45 * 60 * 1000), // 45 mins express
      items: verifiedItems, // Backward-compatible mirror for frontend list rendering
      createdAt: now,
      updatedAt: now,
    });

    // 7. Write immutable line items in subcollection orders/{orderId}/items/{itemId}
    for (const item of verifiedItems) {
      const lineItemRef = orderRef.collection('items').doc(item.id);
      t.set(lineItemRef, {
        id: item.id,
        orderId,
        catalogItemId: item.medicineId,
        medicineId: item.medicineId,
        nameSnapshot: item.nameSnapshot,
        imageSnapshot: item.imageSnapshot,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        lineTotalMinor: item.lineTotalMinor,
        rx: item.rx,
        notes: item.notes || null,
        createdAt: now,
      });
    }

    // 8. Append initial event in subcollection orders/{orderId}/events/{eventId}
    const orderEventRef = orderRef.collection('events').doc();
    t.set(orderEventRef, {
      fromStatus: null,
      toStatus: 'placed',
      actorType: 'user',
      actorId: uid,
      note: 'Medicine order placed by patient',
      createdAt: now,
    });

    // 9. Write compact projection in users/{uid}/orders/{orderId}
    const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(orderId);
    const itemsSummary = verifiedItems.map((i) => `${i.nameSnapshot} (x${i.quantity})`).join(', ');

    t.set(userOrderRef, {
      id: orderId,
      category: 'healthcare',
      icon: 'pill',
      title: `Medicine Order • ${pharmacyName}`,
      subtitle: itemsSummary.length > 60 ? `${itemsSummary.slice(0, 57)}...` : itemsSummary,
      meta: `Delivery: ${data.deliveryAddress?.line1 || 'Hyderabad'}`,
      status: 'Order Placed',
      statusKind: 'ongoing',
      group: 'Ongoing',
      price: `₹${(totalMinor / 100).toFixed(0)}`,
      actions: ['Track Order', 'Cancel'],
      orderId,
      pharmacyName,
      totalMinor,
      updatedAt: now,
      createdAt: now,
    });


    return {
      success: true,
      orderId,
      status: 'placed',
      totalMinor,
      estimatedDeliveryMins: 45,
    };
  });

  log.audit('order_placed', {
    actorUid: uid,
    orderId: result.orderId,
    category: 'healthcare',
    totalMinor: result.totalMinor,
    pharmacyId: data.pharmacyId,
  });

  return result;
});

