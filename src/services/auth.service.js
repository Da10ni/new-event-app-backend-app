import crypto from 'crypto';
import User from '../models/User.model.js';
import Vendor from '../models/Vendor.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import OTP from '../models/OTP.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES, USER_ROLES } from '../constants/index.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { generateOTP, getOTPExpiry } from '../utils/generateOTP.js';
import { createSlug } from '../utils/slugify.js';
import { config } from '../config/index.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const registerClient = async (userData) => {
  const existingUser = await User.findOne({
    $or: [{ email: userData.email }, { phone: userData.phone }],
  });
  if (existingUser) throw new AppError(MESSAGES.USER.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);

  const hashedPw = await hashPassword(userData.password);
  const user = await User.create({ ...userData, password: hashedPw, role: USER_ROLES.CLIENT });

  const otp = generateOTP();
  const hashedOtp = await hashPassword(otp);
  await OTP.create({
    userId: user._id,
    purpose: 'email_verification',
    code: hashedOtp,
    expiresAt: getOTPExpiry(config.otp.expiresInMinutes),
  });

  const tokens = await generateTokenPair(user);
  const safeUser = user.toObject();
  delete safeUser.password;
  return { user: safeUser, ...tokens, otp };
};

export const registerVendor = async (vendorData) => {
  const { businessName, description, categories, businessPhone, businessEmail, address, ...userData } = vendorData;
  const existingUser = await User.findOne({
    $or: [{ email: userData.email }, { phone: userData.phone }],
  });
  if (existingUser) throw new AppError(MESSAGES.USER.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);

  const hashedPw = await hashPassword(userData.password);
  const user = await User.create({ ...userData, password: hashedPw, role: USER_ROLES.VENDOR });

  const vendor = await Vendor.create({
    userId: user._id,
    businessName,
    businessSlug: createSlug(businessName),
    description,
    categories,
    businessPhone,
    businessEmail,
    address,
  });

  const tokens = await generateTokenPair(user);
  const safeUser = user.toObject();
  delete safeUser.password;
  return { user: safeUser, vendor, ...tokens };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError(MESSAGES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new AppError(MESSAGES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

  if (!user.isActive) throw new AppError('Your account has been deactivated.', HTTP_STATUS.FORBIDDEN);

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await generateTokenPair(user);
  const safeUser = user.toObject();
  delete safeUser.password;

  let vendor = null;
  if (user.role === USER_ROLES.VENDOR) {
    vendor = await Vendor.findOne({ userId: user._id }).populate('categories', 'name slug');
  }

  return { user: safeUser, vendor, ...tokens };
};

export const refreshAccessToken = async (refreshTokenStr) => {
  const tokenHash = hashToken(refreshTokenStr);
  const storedToken = await RefreshToken.findOne({ tokenHash, isRevoked: false });
  if (!storedToken) throw new AppError(MESSAGES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(MESSAGES.AUTH.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await User.findById(storedToken.userId);
  if (!user || !user.isActive) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);

  // Rotate refresh token
  storedToken.isRevoked = true;
  await storedToken.save();

  const tokens = await generateTokenPair(user);
  return tokens;
};

export const logout = async (refreshTokenStr) => {
  if (refreshTokenStr) {
    const tokenHash = hashToken(refreshTokenStr);
    await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
  }
};

export const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  await OTP.deleteMany({ userId: user._id, purpose: 'password_reset' });

  const otp = generateOTP();
  const hashedOtp = await hashPassword(otp);
  await OTP.create({
    userId: user._id,
    purpose: 'password_reset',
    code: hashedOtp,
    expiresAt: getOTPExpiry(config.otp.expiresInMinutes),
  });

  return { otp, user };
};

export const resetPasswordService = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  // Dev bypass: accept 000000 in development mode
  if (config.env === 'development' && otp === '000000') {
    user.password = await hashPassword(newPassword);
    await user.save();
    await OTP.deleteMany({ userId: user._id, purpose: 'password_reset' });
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
    return;
  }

  const otpRecord = await OTP.findOne({ userId: user._id, purpose: 'password_reset' }).sort({ createdAt: -1 });
  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    throw new AppError(MESSAGES.AUTH.OTP_INVALID, HTTP_STATUS.BAD_REQUEST);
  }
  if (otpRecord.attempts >= config.otp.maxAttempts) {
    throw new AppError('Too many OTP attempts. Please request a new one.', HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  const isValid = await comparePassword(otp, otpRecord.code);
  if (!isValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError(MESSAGES.AUTH.OTP_INVALID, HTTP_STATUS.BAD_REQUEST);
  }

  user.password = await hashPassword(newPassword);
  await user.save();
  await OTP.deleteMany({ userId: user._id, purpose: 'password_reset' });
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
};

export const verifyEmailService = async ({ email, otp }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  // Dev bypass: accept 000000 in development mode
  if (config.env === 'development' && otp === '000000') {
    user.isEmailVerified = true;
    await user.save();
    await OTP.deleteMany({ userId: user._id, purpose: 'email_verification' });
  } else {
    const otpRecord = await OTP.findOne({ userId: user._id, purpose: 'email_verification' }).sort({ createdAt: -1 });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new AppError(MESSAGES.AUTH.OTP_INVALID, HTTP_STATUS.BAD_REQUEST);
    }

    const isValid = await comparePassword(otp, otpRecord.code);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new AppError(MESSAGES.AUTH.OTP_INVALID, HTTP_STATUS.BAD_REQUEST);
    }

    user.isEmailVerified = true;
    await user.save();
    await OTP.deleteMany({ userId: user._id, purpose: 'email_verification' });
  }

  const tokens = await generateTokenPair(user);
  const safeUser = user.toObject();
  delete safeUser.password;

  let vendor = null;
  if (user.role === USER_ROLES.VENDOR) {
    vendor = await Vendor.findOne({ userId: user._id }).populate('categories', 'name slug');
  }

  return { user: safeUser, vendor, ...tokens };
};

export const changePasswordService = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect.', HTTP_STATUS.BAD_REQUEST);

  user.password = await hashPassword(newPassword);
  await user.save();
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
};

async function generateTokenPair(user) {
  const payload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({ userId: user._id, tokenHash, expiresAt });

  return { accessToken, refreshToken };
}
