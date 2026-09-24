import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

// ── Google Pay Logo ──
export function GPayLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#FFFFFF" />
      <Path
        d="M38.5 24.5c0-1.1-.1-2.2-.3-3.2H24v6.1h8.2c-.4 2-1.5 3.7-3.1 4.8v4h5c2.9-2.7 4.4-6.6 4.4-11.7z"
        fill="#4285F4"
      />
      <Path
        d="M24 39c4.2 0 7.7-1.4 10.3-3.8l-5-4c-1.4 1-3.2 1.6-5.3 1.6-4.1 0-7.5-2.7-8.7-6.5h-5.2v4.1C12.7 35.4 17.9 39 24 39z"
        fill="#34A853"
      />
      <Path
        d="M15.3 26.3c-.3-.9-.5-1.9-.5-2.9 0-1 .2-2 .5-2.9v-4.1h-5.2c-1.1 2.2-1.7 4.6-1.7 7s.6 4.8 1.7 7l5.2-4.1z"
        fill="#FBBC05"
      />
      <Path
        d="M24 15.2c2.3 0 4.3.8 5.9 2.3l4.4-4.4C31.6 10.6 28.1 9 24 9c-6.1 0-11.3 3.6-13.9 8.6l5.2 4.1c1.2-3.8 4.6-6.5 8.7-6.5z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// ── PhonePe Logo ──
export function PhonePeLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#5F259F" />
      <Path
        d="M32 17c0-2.2-1.8-4-4-4H18v22h5v-7h5c4.4 0 8-3.6 8-8v-3zm-5 4h-4v-4h4c1.1 0 2 .9 2 2s-.9 2-2 2z"
        fill="#FFFFFF"
      />
      <Path
        d="M28 26l7 9h-6l-5-7 4-2z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// ── Paytm Logo ──
export function PaytmLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#002E6E" />
      <Path
        d="M13 16h6v4h-6v-4zm0 6h6v12h-6V22z"
        fill="#00BAF2"
      />
      <Path
        d="M23 16h6v16h-6v-16zm8 4h5v4h-5v-4zm0 6h5v6h-5v-6z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// ── BHIM / UPI Logo ──
export function BhimUpiLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#FFFFFF" />
      <Path d="M12 14l12 10-12 10V14z" fill="#097939" />
      <Path d="M24 14l12 10-12 10V14z" fill="#ED7524" />
      <Path d="M18 20h12v4H18v-4z" fill="#FFFFFF" />
    </Svg>
  );
}

// ── Visa Logo ──
export function VisaLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <Path
        d="M19.8 17.5l-3.2 13h-2.9l-1.9-9.5c-.1-.4-.3-.8-.7-1-1-.5-2.6-1.1-4-1.4l.1-.6h6.6c.9 0 1.6.6 1.8 1.5l1.6 8.3 4-9.3h2.6l-4 8.9z"
        fill="#1A1F71"
      />
      <Path
        d="M26.8 17.5l-2.1 13h-2.8l2.1-13h2.8zm8.7 8.5c0-3.3-4.6-3.5-4.6-5 0-.5.5-1.1 1.7-1.2 1.3 0 2.6.4 3.4.8l.5-2.2c-.8-.3-2-.6-3.3-.6-3.2 0-5.3 1.7-5.3 4.1 0 3.7 5.1 3.5 5.1 5.3 0 .7-.8 1.2-1.9 1.2-1.6 0-3-.5-3.8-1l-.5 2.3c.9.4 2.5.7 4.1.7 3.5 0 5.7-1.8 5.7-4.4z"
        fill="#1A1F71"
      />
      <Path
        d="M38.2 17.5h-2.2c-.7 0-1.2.2-1.5.9l-4.3 10.2h2.9l.6-1.6h3.5l.3 1.6h2.6l-1.9-11.1zm-3.8 7.4l1.5-4.1.8 4.1h-2.3z"
        fill="#1A1F71"
      />
    </Svg>
  );
}

// ── Mastercard Logo ──
export function MastercardLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#1E293B" />
      <Circle cx="19" cy="24" r="9" fill="#EB001B" />
      <Circle cx="29" cy="24" r="9" fill="#F79E1B" opacity={0.9} />
      <Path
        d="M24 17.2a8.9 8.9 0 013.8 6.8 8.9 8.9 0 01-3.8 6.8 8.9 8.9 0 01-3.8-6.8c0-2.6 1.4-5 3.8-6.8z"
        fill="#FF5F00"
      />
    </Svg>
  );
}

// ── RuPay Logo ──
export function RuPayLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <Path d="M12 28V15h6.5c3.5 0 5.5 1.8 5.5 4.5 0 2-1.2 3.6-3 4.2l3.8 4.3h-3.8l-3.2-3.8H15V28h-3zm3-7.2h3.2c1.6 0 2.6-.8 2.6-2s-1-2-2.6-2H15v4z" fill="#0A3A82" />
      <Path d="M27 18l5 6-5 6h4l5-6-5-6h-4z" fill="#F47920" />
      <Path d="M33 18l5 6-5 6h4l5-6-5-6h-4z" fill="#0A9B48" />
    </Svg>
  );
}

// ── HDFC Bank Logo ──
export function HdfcBankLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#004C8F" />
      <Rect x="14" y="14" width="20" height="20" fill="#ED232A" />
      <Rect x="18" y="18" width="12" height="12" fill="#004C8F" />
      <Rect x="21" y="21" width="6" height="6" fill="#FFFFFF" />
    </Svg>
  );
}

// ── State Bank of India (SBI) Logo ──
export function SbiBankLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#0091D5" />
      <Circle cx="24" cy="24" r="12" fill="#FFFFFF" />
      <Circle cx="24" cy="22" r="6" fill="#0091D5" />
      <Rect x="22" y="22" width="4" height="14" fill="#0091D5" />
    </Svg>
  );
}

// ── ICICI Bank Logo ──
export function IciciBankLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#9C1D26" />
      <Circle cx="24" cy="24" r="11" stroke="#F58220" strokeWidth="3" fill="none" />
      <Path d="M21 16h6v16h-6V16z" fill="#F58220" />
      <Circle cx="24" cy="24" r="3" fill="#FFFFFF" />
    </Svg>
  );
}

// ── Axis Bank Logo ──
export function AxisBankLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#97144D" />
      <Path d="M24 14l11 18h-7.5l-3.5-6.5-3.5 6.5H13l11-18z" fill="#FFFFFF" />
    </Svg>
  );
}

// ── Kotak Bank Logo ──
export function KotakBankLogo({ size = 32 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="10" fill="#ED1C24" />
      <Circle cx="20" cy="24" r="6" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
      <Circle cx="28" cy="24" r="6" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
      <Path d="M24 20v8" stroke="#FFFFFF" strokeWidth="2.5" />
    </Svg>
  );
}
