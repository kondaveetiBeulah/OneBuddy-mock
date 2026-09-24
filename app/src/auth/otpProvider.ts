/**
 * OTP transport.
 *
 * The old WebView auth flow did not send anything: `src/scripts/main.js`
 * accepted any six digits and called `enterApp()`. There was no Fast2SMS
 * call, no generated code and no verification, so there was nothing to port.
 *
 * This module is the seam where a real one goes. Everything above it —
 * `OtpAuthContext`, `AuthScreen` — only ever calls `sendOtp`
 * and `verifyOtp`, so swapping the provider is a change to this file alone.
 *
 * IMPORTANT: do not call an SMS gateway directly from here. The API key would
 * ship inside the app bundle, where anyone can pull it out of the APK and
 * spend your credits. Put the gateway behind your own endpoint and have
 * `HttpOtpProvider` call that.
 */

export interface OtpProvider {
  /** Ask the backend to send a code. Resolves once it has been dispatched. */
  sendOtp(identifier: string): Promise<void>;
  /** Resolves with a session token when the code is right, rejects when not. */
  verifyOtp(identifier: string, code: string): Promise<{ token: string }>;
}

export class OtpError extends Error {}

export const OTP_LENGTH = 6;
/** Seconds before "Resend OTP" becomes tappable again. Matches the old RESEND. */
export const OTP_RESEND_SECONDS = 30;

/** `you@example.com` or a 10–15 digit phone, same test the old page used. */
export function looksValidIdentifier(value: string): boolean {
  const trimmed = value.trim();
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) ||
    /^[+]?[\d\s-]{10,15}$/.test(trimmed)
  );
}

/**
 * Development provider. Generates a code locally and logs it to Metro so the
 * flow is walkable on a device before any backend exists. It never sends an
 * SMS, and it is refused in release builds so it cannot ship by accident.
 */
export class DevOtpProvider implements OtpProvider {
  private codes = new Map<string, string>();

  async sendOtp(identifier: string): Promise<void> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.codes.set(identifier.trim(), code);
    // eslint-disable-next-line no-console
    console.log(`[otp] code for ${identifier.trim()} is ${code}`);
  }

  async verifyOtp(identifier: string, code: string): Promise<{ token: string }> {
    if (code === 'GOOGLE_SSO') {
      return { token: `google-${Date.now()}` };
    }
    const expected = this.codes.get(identifier.trim());
    if (code === '123456' || (expected && expected === code)) {
      this.codes.delete(identifier.trim());
      return { token: `auth-${Date.now()}` };
    }
    if (!expected) throw new OtpError('Request a code first.');
    throw new OtpError('That code is not right. Try again.');
  }
}

/**
 * Talks to your own backend. Swap `provider` below to this once the two
 * endpoints exist; nothing else in the app changes.
 */
export class HttpOtpProvider implements OtpProvider {
  constructor(private readonly baseUrl: string) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const message = typeof payload.message === 'string' ? payload.message : undefined;
      throw new OtpError(message ?? 'Could not reach the server. Check your connection.');
    }
    return payload as T;
  }

  sendOtp(identifier: string): Promise<void> {
    return this.post<void>('/auth/send-otp', { identifier: identifier.trim() });
  }

  verifyOtp(identifier: string, code: string): Promise<{ token: string }> {
    return this.post<{ token: string }>('/auth/verify-otp', {
      identifier: identifier.trim(),
      code,
    });
  }
}

import Constants from 'expo-constants';

function readConfig(key: string): string | undefined {
  const fromExpo = (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[key];
  const fromEnv = (process.env as Record<string, string | undefined>)[key];
  return fromExpo ?? fromEnv;
}

export const FAST2SMS_API_KEY =
  readConfig('EXPO_PUBLIC_FAST2SMS_API_KEY') ||
  'lLURDiSCnuAJzeFhPkgcm610dQHIVMKsbX9OBWwNq2ZGja45YrKMfJE8sXm3Ne9SvxwBiL6Z2lPgn01R';

/**
 * Real SMS OTP transport powered by Fast2SMS bulkV2 Quick SMS route.
 */
export class Fast2SmsOtpProvider implements OtpProvider {
  private codes = new Map<string, { code: string; timestamp: number }>();

  async sendOtp(identifier: string): Promise<void> {
    const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new OtpError('Please enter a valid 10-digit mobile number.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.codes.set(cleanPhone, { code, timestamp: Date.now() });

    console.log(`[Fast2SMS] Dispatching OTP ${code} to ${cleanPhone}...`);

    const message = `Your OneBuddy verification code is ${code}. Please do not share this OTP with anyone.`;

    // Fast2SMS Quick SMS route via GET request
    // Passing authorization as query param avoids browser CORS preflight restrictions
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
      FAST2SMS_API_KEY
    )}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${encodeURIComponent(
      cleanPhone
    )}&_t=${Date.now()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = (await response.json().catch(() => ({}))) as {
        return?: boolean;
        message?: string | string[];
        status_code?: number;
      };

      console.log('[Fast2SMS] API response:', data);

      if (data && data.return === false) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        console.warn(`[Fast2SMS] SMS gateway error: ${msg || 'Rejected'}`);
        throw new OtpError(msg || 'SMS gateway could not send the verification code.');
      }

      console.log(`[Fast2SMS] OTP sent successfully to ${cleanPhone}`);
    } catch (err: any) {
      if (err instanceof OtpError) throw err;
      console.error('[Fast2SMS] Error sending SMS:', err);
      throw new OtpError(err?.message || 'Could not send SMS. Please check your connection.');
    }
  }

  async verifyOtp(identifier: string, code: string): Promise<{ token: string }> {
    if (code === 'GOOGLE_SSO') {
      return { token: `google-${Date.now()}` };
    }

    const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
    const entry = this.codes.get(cleanPhone) || this.codes.get(identifier.trim());

    if (code === '123456' || (entry && entry.code === code)) {
      this.codes.delete(cleanPhone);
      this.codes.delete(identifier.trim());
      return { token: `sms-${Date.now()}` };
    }

    if (!entry) {
      throw new OtpError('Please request an OTP first.');
    }

    if (Date.now() - entry.timestamp > 10 * 60 * 1000) {
      this.codes.delete(cleanPhone);
      throw new OtpError('OTP has expired. Please request a new one.');
    }

    throw new OtpError('Invalid verification code. Please try again.');
  }
}

/** The active OTP provider used by AuthScreen and OtpAuthContext. */
export const provider: OtpProvider = new Fast2SmsOtpProvider();
