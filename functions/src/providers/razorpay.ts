import * as crypto from 'crypto';
import { log, throwError } from '../core/logger';

export interface ProviderResult {
  providerOrderId: string;
  clientSecret: string;
}

export async function createRazorpayOrder(
  amountMinor: number,
  receipt: string,
  notes: Record<string, any>
): Promise<ProviderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    log.warn(`[payments] Razorpay credentials not configured in environment. Using dev mock order.`);
    return {
      providerOrderId: `order_mock_${receipt}`,
      clientSecret: 'rzp_test_mock',
    };
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountMinor,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Razorpay order creation failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to create Razorpay payment order: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string };
  return {
    providerOrderId: data.id,
    clientSecret: keyId,
  };
}

export function verifyRazorpaySignature(
  rawBody: Buffer | string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    log.error('[paymentWebhook] Error verifying Razorpay signature', err);
    return false;
  }
}

export async function executeRazorpayRefund(
  gatewayPaymentId: string,
  amountMinor: number,
  notes: Record<string, any>
): Promise<string> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    log.warn(`[payments] Razorpay credentials not configured. Generating dev mock refund ID.`);
    return `rfnd_mock_${Date.now()}`;
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  const response = await fetch(`https://api.razorpay.com/v1/payments/${gatewayPaymentId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountMinor,
      notes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Razorpay refund API failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to execute Razorpay refund: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}
