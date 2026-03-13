import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { MESSAGES } from '../constants/index.js';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { notifications, meta } = await notificationService.getUserNotifications(req.user._id, req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { notifications }, meta });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { count } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user._id);
  sendResponse(res, { message: MESSAGES.NOTIFICATION.MARKED_READ });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  sendResponse(res, { message: MESSAGES.NOTIFICATION.ALL_MARKED_READ });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  sendResponse(res, { message: MESSAGES.NOTIFICATION.DELETED });
});
