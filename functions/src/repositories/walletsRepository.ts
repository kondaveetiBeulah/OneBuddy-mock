import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../common/firebase';

export interface WalletRecord {
  userId: string;
  balanceMinor: number;
  currency: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface WalletEntryRecord {
  id: string;
  direction: 'credit' | 'debit';
  type: 'topup' | 'order_payment' | 'refund' | 'adjustment';
  amountMinor: number;
  amount: number;
  currency: string;
  orderId?: string | null;
  paymentId?: string | null;
  idempotencyKey?: string | null;
  title?: string;
  description?: string;
  createdAt?: any;
}

export interface ListWalletEntriesParams {
  userId: string;
  type?: 'topup' | 'order_payment' | 'refund' | 'adjustment';
  direction?: 'credit' | 'debit';
  cursor?: string;
  limit: number;
}

/**
 * Repository for Wallet document and Ledger Entry subcollections (wallets/{userId}/entries).
 * Encapsulates all Firestore queries and writes for the financial ledger.
 */
export class WalletsRepository {
  /**
   * Reference to the canonical wallet document for a user.
   */
  static getWalletRef(userId: string): FirebaseFirestore.DocumentReference {
    return db.collection('wallets').doc(userId);
  }

  /**
   * Reference to a ledger entry document for a user.
   */
  static getEntryRef(userId: string, entryId?: string): FirebaseFirestore.DocumentReference {
    const col = db.collection('wallets').doc(userId).collection('entries');
    return entryId ? col.doc(entryId) : col.doc();
  }

  /**
   * Fetch wallet snapshot, optionally within a transaction.
   */
  static async getWallet(
    userId: string,
    transaction?: FirebaseFirestore.Transaction
  ): Promise<FirebaseFirestore.DocumentSnapshot> {
    const ref = this.getWalletRef(userId);
    return transaction ? transaction.get(ref) : ref.get();
  }

  /**
   * Ensure a wallet document exists. If missing, initializes with balanceMinor = 0.
   */
  static async ensureWallet(
    userId: string,
    transaction?: FirebaseFirestore.Transaction
  ): Promise<{ balanceMinor: number; currency: string; existed: boolean }> {
    const ref = this.getWalletRef(userId);
    const snap = transaction ? await transaction.get(ref) : await ref.get();

    if (snap.exists) {
      const data = snap.data() || {};
      const balanceMinor =
        typeof data.balanceMinor === 'number'
          ? data.balanceMinor
          : Math.round((data.balance || 0) * 100);
      return { balanceMinor, currency: data.currency || 'INR', existed: true };
    }

    const initialData = {
      userId,
      balanceMinor: 0,
      currency: 'INR',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (transaction) {
      transaction.set(ref, initialData);
    } else {
      await ref.set(initialData);
    }

    return { balanceMinor: 0, currency: 'INR', existed: false };
  }

  /**
   * Update wallet balance within a transaction or directly.
   */
  static updateBalance(
    userId: string,
    balanceMinor: number,
    transaction?: FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.WriteResult> {
    const ref = this.getWalletRef(userId);
    const payload = {
      balanceMinor,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (transaction) {
      transaction.update(ref, payload);
      return;
    }
    return ref.update(payload);
  }

  /**
   * Fetch a ledger entry snapshot by entry ID.
   */
  static async getEntry(
    userId: string,
    entryId: string,
    transaction?: FirebaseFirestore.Transaction
  ): Promise<FirebaseFirestore.DocumentSnapshot> {
    const ref = this.getEntryRef(userId, entryId);
    return transaction ? transaction.get(ref) : ref.get();
  }

  /**
   * Reference to user-scoped wallet transaction projection.
   */
  static getUserTransactionRef(userId: string, entryId?: string): FirebaseFirestore.DocumentReference {
    const col = db.collection('users').doc(userId).collection('walletTransactions');
    return entryId ? col.doc(entryId) : col.doc();
  }

  /**
   * Save a ledger entry within a transaction or directly.
   * Atomically mirrors the entry to users/{userId}/walletTransactions/{entryId}
   * satisfying Greenfield Spec Section 4 (User-scoped Wallet Query Projection).
   */
  static saveEntry(
    userId: string,
    entry: WalletEntryRecord,
    transaction?: FirebaseFirestore.Transaction
  ): void | Promise<any> {
    const ref = this.getEntryRef(userId, entry.id);
    const userTxRef = this.getUserTransactionRef(userId, entry.id);
    const payload = {
      ...entry,
      createdAt: entry.createdAt || FieldValue.serverTimestamp(),
    };

    if (transaction) {
      transaction.set(ref, payload);
      transaction.set(userTxRef, payload);
      return;
    }
    return Promise.all([ref.set(payload), userTxRef.set(payload)]);
  }

  /**
   * List wallet ledger entries with filtering and cursor-based pagination.
   */
  static async listEntries(params: ListWalletEntriesParams): Promise<{
    docs: FirebaseFirestore.QueryDocumentSnapshot[];
    nextCursor: string | null;
  }> {
    const walletRef = this.getWalletRef(params.userId);
    let q: FirebaseFirestore.Query = walletRef
      .collection('entries')
      .orderBy('createdAt', 'desc');

    if (params.type) {
      q = q.where('type', '==', params.type);
    }
    if (params.direction) {
      q = q.where('direction', '==', params.direction);
    }

    if (params.cursor) {
      const cursorDoc = await walletRef.collection('entries').doc(params.cursor).get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    q = q.limit(params.limit);
    const snap = await q.get();

    const nextCursor =
      snap.docs.length === params.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      docs: snap.docs,
      nextCursor,
    };
  }
}
