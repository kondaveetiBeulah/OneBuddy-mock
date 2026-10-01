import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../core/firebase';
import { secureCallable } from '../common/auth';
import { NotFoundError, PermissionDeniedError } from '../common/errors';
import { log } from '../common/logging';
import {
  createMedicalDocumentSchema,
  getMedicalDocumentsSchema,
  deleteMedicalDocumentSchema,
} from './types';

/**
 * createMedicalDocument: Stores document metadata referencing Cloud Storage in medicalDocuments/{documentId}.
 */
export const createMedicalDocument = secureCallable(
  createMedicalDocumentSchema,
  async (data, context) => {
    const userId = context.auth.uid;
    const docRef = db.collection('medicalDocuments').doc();

    const docType =
      data.type ||
      (data.documentType === 'prescription' ||
      data.documentType === 'lab_report' ||
      data.documentType === 'discharge_summary'
        ? data.documentType
        : 'other');
    const contentType = data.contentType || data.mimeType || 'application/pdf';
    const sizeBytes = data.sizeBytes ?? data.fileSize ?? 0;
    const now = FieldValue.serverTimestamp();

    // Canonical medicalDocuments schema matching Greenfield Section 4
    const record = {
      id: docRef.id,
      userId,
      appointmentId: data.appointmentId || null,
      type: docType,
      title: data.title,
      description: data.description || null,
      storagePath: data.storagePath,
      contentType,
      sizeBytes,
      uploadedAt: now,
      uploadedBy: userId,
      retentionUntil: data.retentionUntil || null,
      active: true,

      // Backward compatibility mirrors
      documentType: docType,
      mimeType: contentType,
      fileSize: sizeBytes,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(record);

    log.audit('medical_document_created', {
      actorUid: userId,
      documentId: docRef.id,
      type: docType,
      title: data.title,
    });

    return {
      success: true,
      documentId: docRef.id,
      document: record,
    };
  }
);

export const createMedicalDocumentMetadata = createMedicalDocument;

/**
 * getMedicalDocuments: Retrieves medical documents owned by the authenticated patient.
 */
export const getMedicalDocuments = secureCallable(
  getMedicalDocumentsSchema,
  async (data, context) => {
    const userId = context.auth.uid;
    let query: FirebaseFirestore.Query = db
      .collection('medicalDocuments')
      .where('userId', '==', userId)
      .where('active', '==', true);

    const filterType = data.type || data.documentType;
    if (filterType) {
      query = query.where('type', '==', filterType);
    }

    const snap = await query.orderBy('uploadedAt', 'desc').limit(data.limit).get();
    const documents = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { documents };
  }
);


export const listMedicalDocuments = getMedicalDocuments;

/**
 * deleteMedicalDocument: Soft-deletes a medical document record.
 */
export const deleteMedicalDocument = secureCallable(
  deleteMedicalDocumentSchema,
  async (data, context) => {
    const userId = context.auth.uid;
    const docRef = db.collection('medicalDocuments').doc(data.documentId);
    const snap = await docRef.get();

    if (!snap.exists) {
      throw new NotFoundError('Medical Document', data.documentId);
    }

    const doc = snap.data()!;
    if (doc.userId !== userId && context.auth.token?.admin !== true) {
      throw new PermissionDeniedError('You do not own this medical document.');
    }

    await docRef.update({
      active: false,
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    log.audit('medical_document_deleted', {
      actorUid: userId,
      documentId: data.documentId,
    });

    return {
      success: true,
      documentId: data.documentId,
    };
  }
);
