import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../common/firebase';

export interface CartMetaRecord {
  userId: string;
  service: 'food' | 'grocery';
  merchantId?: string | null;
  merchantSnapshot?: {
    name?: string;
    image?: string;
  } | null;
  itemCount?: number;
  updatedAt?: any;
}

export interface CartItemRecord {
  catalogItemId: string;
  name: string;
  image?: string;
  unitPriceMinor: number;
  discountUnitPriceMinor?: number;
  quantity: number;
  notes?: string | null;
  updatedAt?: any;
}

/**
 * Repository for Carts collection (carts/{cartId}) and its items subcollection.
 * Handles server-authoritative cart synchronization and state.
 */
export class CartsRepository {
  static getCartRef(cartId: string): FirebaseFirestore.DocumentReference {
    return db.collection('carts').doc(cartId);
  }

  static getItemRef(cartId: string, productId: string): FirebaseFirestore.DocumentReference {
    return db.collection('carts').doc(cartId).collection('items').doc(productId);
  }

  /**
   * Fetch cart root document and all item subcollection documents.
   */
  static async getCartWithItems(cartId: string): Promise<{
    cartDoc: FirebaseFirestore.DocumentSnapshot;
    itemDocs: FirebaseFirestore.QueryDocumentSnapshot[];
  }> {
    const cartRef = this.getCartRef(cartId);
    const [cartDoc, itemsSnap] = await Promise.all([
      cartRef.get(),
      cartRef.collection('items').get(),
    ]);

    return {
      cartDoc,
      itemDocs: itemsSnap.docs,
    };
  }

  /**
   * Save or update cart root metadata.
   */
  static saveCartMeta(
    cartId: string,
    meta: Partial<CartMetaRecord>,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.WriteResult> {
    const cartRef = this.getCartRef(cartId);
    const payload = {
      ...meta,
      updatedAt: meta.updatedAt || FieldValue.serverTimestamp(),
    };

    if (writer) {
      (writer as any).set(cartRef, payload, { merge: true });
      return;
    }
    return cartRef.set(payload, { merge: true });
  }

  /**
   * Save or update an item in cart's items subcollection.
   */
  static saveCartItem(
    cartId: string,
    productId: string,
    item: CartItemRecord,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.WriteResult> {
    const itemRef = this.getItemRef(cartId, productId);
    const payload = {
      ...item,
      updatedAt: item.updatedAt || FieldValue.serverTimestamp(),
    };

    if (writer) {
      (writer as any).set(itemRef, payload, { merge: true });
      return;
    }
    return itemRef.set(payload, { merge: true });
  }

  /**
   * Delete an item from cart subcollection.
   */
  static deleteCartItem(
    cartId: string,
    productId: string,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.WriteResult> {
    const itemRef = this.getItemRef(cartId, productId);
    if (writer) {
      (writer as any).delete(itemRef);
      return;
    }
    return itemRef.delete();
  }

  /**
   * Clear all items in a cart and reset root cart document.
   */
  static async clearCart(cartId: string, userId: string, service: 'food' | 'grocery'): Promise<void> {
    const cartRef = this.getCartRef(cartId);
    const itemsSnap = await cartRef.collection('items').get();

    const batch = db.batch();
    itemsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.set(
      cartRef,
      {
        userId,
        service,
        merchantId: null,
        merchantSnapshot: null,
        itemCount: 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
  }
}
