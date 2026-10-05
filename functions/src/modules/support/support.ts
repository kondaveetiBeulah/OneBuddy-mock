import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { NotFoundError, PermissionDeniedError, PreconditionFailedError } from '../../common/errors';
import { log } from '../../common/logging';
import {
  submitOrderFeedbackSchema,
  createSupportRequestSchema,
  listMySupportRequestsSchema,
} from './types';

/**
 * 1. submitOrderFeedback: Submits ratings, quality tags, and review feedback for delivered orders.
 */
export const submitOrderFeedback = secureCallable(
  submitOrderFeedbackSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const { orderId } = data;


    // 1. Locate Order across Commerce, Rides, or Service Bookings
    let orderRef = db.collection('orders').doc(orderId);
    let orderSnap = await orderRef.get();
    let orderType = 'commerce';

    if (!orderSnap.exists) {
      // Check rides collection
      const rideRef = db.collection('rides').doc(orderId);
      const rideSnap = await rideRef.get();
      if (rideSnap.exists) {
        orderRef = rideRef;
        orderSnap = rideSnap;
        orderType = 'rides';
      } else {
        // Check serviceBookings collection
        const bookingRef = db.collection('serviceBookings').doc(orderId);
        const bookingSnap = await bookingRef.get();
        if (bookingSnap.exists) {
          orderRef = bookingRef;
          orderSnap = bookingSnap;
          orderType = 'serviceBookings';
        }
      }
    }

    if (!orderSnap.exists) {
      throw new NotFoundError('Order / Booking', orderId);
    }

    const orderData = orderSnap.data()!;

    // 2. Caller Ownership Verification
    if (orderData.userId !== uid && context.auth.token?.admin !== true) {
      throw new PermissionDeniedError('You can only submit feedback for your own orders.');
    }

    // 3. Precondition: Status must be delivered or completed
    const allowedStatuses = ['delivered', 'completed'];
    if (!allowedStatuses.includes(orderData.status)) {
      throw new PreconditionFailedError(
        `Cannot submit feedback for order in status "${orderData.status}". Must be delivered or completed.`
      );
    }

    const overallRating = data.overallRating ?? data.rating ?? 5;
    const resolvedService = data.service || data.category || orderData.category || orderType;
    const categoryRatings = data.categoryRatings || {
      ...(data.driverRating ? { driver: data.driverRating } : {}),
      ...(data.merchantRating ? { merchant: data.merchantRating } : {}),
    };
    const restaurantId = data.restaurantId || orderData.merchantId || orderData.restaurantId || null;
    const driverId = data.driverId || orderData.driverId || null;
    const providerId = data.providerId || orderData.providerId || null;

    // 4. Save feedback in canonical feedback/{feedbackId} matching Greenfield Section 4 & firestore.rules
    const feedbackRef = db.collection('feedback').doc();
    const feedbackRecord = {
      id: feedbackRef.id,
      feedbackId: feedbackRef.id,
      userId: uid,
      orderId,
      service: resolvedService,
      restaurantId,
      driverId,
      providerId,
      overallRating,
      categoryRatings,
      comment: data.comment || null,
      photoPaths: data.photoPaths || [],
      createdAt: FieldValue.serverTimestamp(),

      // Backward compatibility mirrors
      rating: overallRating,
      aspects: data.aspects || [],
      driverRating: data.driverRating || null,
      merchantRating: data.merchantRating || null,
    };

    await feedbackRef.set(feedbackRecord);

    // 5. Update parent order document with feedback snapshot
    await orderRef.update({
      feedback: {
        feedbackId: feedbackRef.id,
        overallRating,
        rating: overallRating,
        comment: data.comment || null,
        photoPaths: data.photoPaths || [],
        submittedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    log.audit('order_feedback_submitted', {
      actorUid: uid,
      orderId,
      overallRating,
      aspectsCount: (data.aspects || []).length,
      photosCount: (data.photoPaths || []).length,
    });

    return {
      success: true,
      feedbackId: feedbackRef.id,
      orderId,
      overallRating,
      rating: overallRating,
    };
  }
);


/**
 * 2. createSupportRequest: Raises a customer service ticket with priority, category, and audit logging.
 */
export const createSupportRequest = secureCallable(
  createSupportRequestSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const ticketRef = db.collection('supportRequests').doc();
    const ticketNumber = `OB-TICK-${Date.now().toString().slice(-6)}`;

    const supportTicket = {
      id: ticketRef.id,
      ticketNumber,
      userId: uid,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      relatedEntityId: data.relatedEntityId || null,
      attachments: data.attachments,
      status: 'open',
      assignedAgent: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await ticketRef.set(supportTicket);

    // Append initial conversation message
    const msgRef = ticketRef.collection('messages').doc();
    await msgRef.set({
      id: msgRef.id,
      sender: 'user',
      senderId: uid,
      text: data.description,
      attachments: data.attachments,
      createdAt: FieldValue.serverTimestamp(),
    });

    log.audit('support_ticket_created', {
      actorUid: uid,
      ticketId: ticketRef.id,
      ticketNumber,
      category: data.category,
      priority: data.priority,
    });

    return {
      success: true,
      ticketId: ticketRef.id,
      ticketNumber,
      status: 'open',
    };
  }
);

/**
 * 3. listMySupportRequests: Lists support tickets created by the authenticated user.
 */
export const listMySupportRequests = secureCallable(
  listMySupportRequestsSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    let query: FirebaseFirestore.Query = db
      .collection('supportRequests')
      .where('userId', '==', uid);

    if (data.status) {
      query = query.where('status', '==', data.status);
    }

    query = query.orderBy('createdAt', 'desc');

    if (data.cursor) {
      const cursorDoc = await db.collection('supportRequests').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.limit(data.limit).get();
    const supportRequests = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const nextCursor =
      snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      supportRequests,
      nextCursor,
      hasMore: snap.docs.length === data.limit,
    };
  }
);


