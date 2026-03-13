import User from '../models/User.model.js';
import Vendor from '../models/Vendor.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  // Also fetch vendor profile if user has one
  const vendor = await Vendor.findOne({ userId }).populate('categories', 'name slug icon');

  return { user, vendor };
};

export const updateUserProfile = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return user;
};

export const deleteUserAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return user;
};
