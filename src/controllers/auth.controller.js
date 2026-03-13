import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as authService from '../services/auth.service.js';
import { sendOTPEmail } from '../services/mail.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerClient(req.body);
  await sendOTPEmail(result.user.email, result.otp, 'email_verification');
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.AUTH.REGISTER_SUCCESS, data: { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken } });
});

export const registerVendor = asyncHandler(async (req, res) => {
  const result = await authService.registerVendor(req.body);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.VENDOR.CREATED, data: { user: result.user, vendor: result.vendor, accessToken: result.accessToken, refreshToken: result.refreshToken } });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendResponse(res, { message: MESSAGES.AUTH.LOGIN_SUCCESS, data: result });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshAccessToken(req.body.refreshToken);
  sendResponse(res, { message: 'Token refreshed.', data: tokens });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  sendResponse(res, { message: MESSAGES.AUTH.LOGOUT_SUCCESS });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { otp, user } = await authService.forgotPasswordService(req.body.email);
  await sendOTPEmail(user.email, otp, 'password_reset');
  sendResponse(res, { message: MESSAGES.AUTH.OTP_SENT });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPasswordService(req.body);
  sendResponse(res, { message: MESSAGES.AUTH.PASSWORD_RESET });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmailService(req.body);
  sendResponse(res, { message: MESSAGES.AUTH.EMAIL_VERIFIED, data: result });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePasswordService(req.user._id, req.body);
  sendResponse(res, { message: MESSAGES.AUTH.PASSWORD_CHANGED });
});
