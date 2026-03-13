import crypto from 'crypto';

export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(digits.length)];
  }
  return otp;
};

export const getOTPExpiry = (minutes) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
