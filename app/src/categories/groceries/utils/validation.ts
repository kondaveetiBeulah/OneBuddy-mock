export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidOTP = (otp: string): boolean => {
  return otp.trim().length === 6 && /^\d+$/.test(otp.trim());
};

export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const isValidPincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode.trim());
};
