import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { MESSAGES } from '../constants/index.js';
import * as userService from '../services/user.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const { user, vendor } = await userService.getUserProfile(req.user._id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { user, vendor } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user._id, req.body);
  sendResponse(res, { message: MESSAGES.USER.PROFILE_UPDATED, data: { user } });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteUserAccount(req.user._id);
  sendResponse(res, { message: 'Account deleted successfully' });
});
