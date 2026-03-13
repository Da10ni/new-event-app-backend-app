import Notification from '../models/Notification.model.js';
import { ApiFeatures } from '../utils/apiFeatures.js';

export const createNotification = async (data) => {
  return Notification.create(data);
};

export const getUserNotifications = async (userId, queryString) => {
  const features = new ApiFeatures(
    Notification.find({ user: userId }),
    queryString
  ).sort().paginate();

  await features.countDocuments();
  const notifications = await features.query;
  return { notifications, meta: features.getMeta() };
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, isRead: false });
};

export const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

export const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

export const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, user: userId });
};
