import * as crypto from 'crypto';
import { log, throwError } from '../core/logger';
import { ProviderResult } from './razorpay';

export async function createStripePaymentIntent(
  amountMinor: number,
  paymentId: string,
  metadata: Record<string, string>
): Promise<ProviderResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    log.warn(`[payments] Stripe secret key not configured in environment. Using dev mock secret.`);
    return {
      providerOrderId: `pi_mock_${paymentId}`,
      clientSecret: `pi_mock_${paymentId}_secret_mock`,
    };
  }

  const params = new URLSearchParams();
  params.append('amount', amountMinor.toString());
  params.append('currency', 'inr');
  for (const [key, val] of Object.entries(metadata)) {
    params.append(`metadata[${key}]`, String(val));
  }

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Stripe PaymentIntent creation failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to create Stripe PaymentIntent: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string; client_secret: string };
  return {
    providerOrderId: data.id,
    clientSecret: data.client_secret,
  };
}

export function verifyStripeSignature(
  rawBody: Buffer | string,
  header: string,
  secret: string
): boolean {
  try {
    const parts = header.split(',').reduce((acc, part) => {
      const [key, val] = part.split('=');
      if (key && val) acc[key.trim()] = val.trim();
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    // Tolerance window: 5 minutes (300 seconds) to prevent replay attacks
    const nowSec = Math.floor(Date.now() / 1000);
    const eventSec = parseInt(timestamp, 10);
    if (isNaN(eventSec) || Math.abs(nowSec - eventSec) > 300) {
      return false;
    }

    const payload = `${timestamp}.${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    log.error('[paymentWebhook] Error verifying Stripe signature', err);
    return false;
  }
}

export async function executeStripeRefund(
  gatewayPaymentId: string,
  amountMinor: number,
  metadata: Record<string, string>
): Promise<string> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    log.warn(`[payments] Stripe secret key not configured. Generating dev mock refund ID.`);
    return `re_mock_${Date.now()}`;
  }

  const params = new URLSearchParams();
  params.append('payment_intent', gatewayPaymentId);
  params.append('amount', amountMinor.toString());
  for (const [key, val] of Object.entries(metadata)) {
    params.append(`metadata[${key}]`, String(val));
  }

  const response = await fetch('https://api.stripe.com/v1/refunds', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Stripe refund API failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to execute Stripe refund: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}
