import { db } from '../core/firebase';
import { log } from './logging';

export interface IdempotencyResult<T> {
  success: boolean;
  replayed: boolean;
  data?: T;
}

/**
 * Checks if a command with the given idempotencyKey has already been executed.
 * If found, returns existing document data to prevent duplicate side effects.
 */
export async function checkIdempotency<T>(
  collectionName: string,
  idempotencyKey: string,
  transaction?: FirebaseFirestore.Transaction
): Promise<T | null> {
  const docRef = db.collection(collectionName).doc(idempotencyKey);
  const snap = transaction ? await transaction.get(docRef) : await docRef.get();

  if (snap.exists) {
    log.info(`[idempotency] Replay detected for ${collectionName}/${idempotencyKey}`);
    return snap.data() as T;
  }
  return null;
}

/**
 * Executes a state-changing operation idempotently within a transaction.
 */
export async function executeIdempotent<T>(options: {
  collection: string;
  key?: string;
  operation: (transaction: FirebaseFirestore.Transaction, docId: string) => Promise<T>;
}): Promise<T & { replayed?: boolean }> {
  const docId = options.key || db.collection(options.collection).doc().id;
  const docRef = db.collection(options.collection).doc(docId);

  return await db.runTransaction(async (t) => {
    // 1. Idempotency Check
    const existing = await t.get(docRef);
    if (existing.exists) {
      log.warn(`[executeIdempotent] Idempotent replay for ${options.collection}/${docId}`);
      const data = existing.data() as any;
      return { ...data, replayed: true };
    }

    // 2. Execute Operation
    try {
      const result = await options.operation(t, docId);
      return { ...result, replayed: false };
    } catch (err: any) {
      log.error(`[executeIdempotent] Transaction error for ${options.collection}/${docId}`, err);
      throw err;
    }
  });
}
