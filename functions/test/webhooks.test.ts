import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import { verifyRazorpaySignature } from '../src/providers/razorpay';

describe('Payment Webhook Signature Verification', () => {
  const secret = 'webhook_secret_key_12345';
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_ABC123xyz',
          amount: 50000,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });

  it('validates authentic webhook payloads with correct signature', () => {
    const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const isValid = verifyRazorpaySignature(payload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it('rejects tampered webhook payloads', () => {
    const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const tamperedPayload = payload.replace('50000', '99999');
    const isValid = verifyRazorpaySignature(tamperedPayload, validSignature, secret);
    expect(isValid).toBe(false);
  });

  it('rejects payloads signed with wrong secret', () => {
    const wrongSignature = crypto.createHmac('sha256', 'wrong_secret').update(payload).digest('hex');
    const isValid = verifyRazorpaySignature(payload, wrongSignature, secret);
    expect(isValid).toBe(false);
  });

  it('safely handles malformed or mismatched signature lengths without crashing', () => {
    expect(verifyRazorpaySignature(payload, '', secret)).toBe(false);
    expect(verifyRazorpaySignature(payload, 'too_short', secret)).toBe(false);
    expect(verifyRazorpaySignature(payload, 'a'.repeat(128), secret)).toBe(false);
  });

  it('works with Buffer inputs for raw request bodies', () => {
    const bufferPayload = Buffer.from(payload, 'utf8');
    const signature = crypto.createHmac('sha256', secret).update(bufferPayload).digest('hex');
    const isValid = verifyRazorpaySignature(bufferPayload, signature, secret);
    expect(isValid).toBe(true);
  });
});
