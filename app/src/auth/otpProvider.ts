/**
 * OTP transport via Backend Cloud Functions.
 *
 * Fast2SMS API key, OTP generation, verification, and Firebase Auth registration
 * remain 100% on the backend (Firebase Cloud Functions).
 * Never call Fast2SMS directly from the frontend.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/config';

export interface VerifyOtpParams {
  phone: string;
  otp: string;
  isSignUp: boolean;
  fullName?: string;
  email?: string;
  dob?: string;
}

export interface OtpProvider {
  /** Ask backend Cloud Function to generate OTP and dispatch SMS via Fast2SMS */
  sendOtp(phone: string, type?: 'signup' | 'login'): Promise<{ success: boolean; message: string }>;
  /** Ask backend Cloud Function to verify OTP and issue Firebase Custom Token */
  verifyOtp(
    params: VerifyOtpParams | string,
    code?: string,
    options?: { type?: 'signup' | 'login'; fullName?: string; email?: string; dob?: string }
  ): Promise<{ token: string; customToken: string; uid: string; isSignUp: boolean }>;
}

export class OtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpError';
  }
}

export const OTP_LENGTH = 6;
/** Seconds before "Resend OTP" becomes tappable again. */
export const OTP_RESEND_SECONDS = 30;

/** Validates 10-digit mobile number format */
export function looksValidIdentifier(value: string): boolean {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
}

/**
 * Backend OTP Provider:
 * Talks directly to secure Firebase Cloud Functions (`sendMobileOtp` & `verifyMobileOtp`).
 * Fast2SMS API key, OTP generation, validation, and user creation are securely handled in the backend.
 */
export class BackendOtpProvider implements OtpProvider {
  async sendOtp(phone: string, _type?: 'signup' | 'login'): Promise<{ success: boolean; message: string }> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new OtpError('Please enter a valid 10-digit mobile number.');
    }

    if (!functions) {
      throw new OtpError('Firebase Functions is not initialized. Please check network and config.');
    }

    try {
      const sendCallable = httpsCallable<{ phone: string }, { success: boolean; message: string }>(
        functions,
        'sendMobileOtp'
      );
      const res = await sendCallable({ phone: cleanPhone });
      return res.data;
    } catch (err: any) {
      const code = err?.code || '';
      let msg = err?.message || 'Failed to send verification code. Please try again.';
      if (code === 'functions/resource-exhausted' || code === 'resource-exhausted') {
        msg = 'Please wait 30 seconds before requesting a new OTP.';
      }
      throw new OtpError(msg);
    }
  }

  async verifyOtp(
    params: VerifyOtpParams | string,
    code?: string,
    options?: { type?: 'signup' | 'login'; fullName?: string; email?: string; dob?: string }
  ): Promise<{ token: string; customToken: string; uid: string; isSignUp: boolean }> {
    let payload: VerifyOtpParams;

    if (typeof params === 'string') {
      payload = {
        phone: params,
        otp: code || '',
        isSignUp: options?.type === 'signup',
        fullName: options?.fullName,
        email: options?.email,
        dob: options?.dob,
      };
    } else {
      payload = params;
    }

    const cleanPhone = payload.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new OtpError('Please enter a valid 10-digit mobile number.');
    }

    if (!payload.otp || payload.otp.length !== OTP_LENGTH) {
      throw new OtpError(`Please enter all ${OTP_LENGTH} digits of the verification code.`);
    }

    if (!functions) {
      throw new OtpError('Firebase Functions is not initialized.');
    }

    try {
      const verifyCallable = httpsCallable<
        VerifyOtpParams,
        { success: boolean; customToken: string; uid: string; isSignUp: boolean }
      >(functions, 'verifyMobileOtp');

      const res = await verifyCallable({
        phone: cleanPhone,
        otp: payload.otp,
        isSignUp: Boolean(payload.isSignUp),
        fullName: payload.fullName,
        email: payload.email,
        dob: payload.dob,
      });

      const { customToken, uid, isSignUp } = res.data;
      if (!customToken) {
        throw new OtpError('Verification succeeded but custom auth token was not received.');
      }

      return {
        token: customToken,
        customToken,
        uid,
        isSignUp,
      };
    } catch (err: any) {
      const code = err?.code || '';
      let msg = err?.message || 'Verification failed. Please try again.';
      throw new OtpError(msg);
    }
  }
}

/** The active OTP provider used across the app */
export const provider: OtpProvider = new BackendOtpProvider();
