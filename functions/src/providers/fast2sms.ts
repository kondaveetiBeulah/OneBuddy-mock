import { defineSecret } from 'firebase-functions/params';
import { log } from '../core/logger';

export const fast2smsApiKey = defineSecret('FAST2SMS_API_KEY');

/**
 * Dispatch SMS directly from the backend via Fast2SMS gateway.
 * Kept secure on backend/Cloud Functions only.
 */
export async function sendSmsViaFast2Sms(phone: string, message: string): Promise<void> {
  const apiKey = fast2smsApiKey.value() || process.env.FAST2SMS_API_KEY || '';
  if (!apiKey) {
    log.warn('[Fast2SMS] Missing FAST2SMS_API_KEY secret.');
  }

  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
    apiKey
  )}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${encodeURIComponent(
    phone
  )}&_t=${Date.now()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'cache-control': 'no-cache',
    },
  });

  const data = (await response.json().catch(() => ({}))) as {
    return?: boolean;
    message?: string | string[];
    status_code?: number;
  };

  log.info(`[Fast2SMS] API response for ${phone}:`, data);

  if (response.status === 401 || (data.status_code && data.status_code === 401)) {
    throw new Error('Invalid Fast2SMS API key or authorization failed.');
  }

  if (data.return === false) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'SMS dispatch rejected by gateway.';
    throw new Error(`Fast2SMS error: ${errorMsg}`);
  }
}
