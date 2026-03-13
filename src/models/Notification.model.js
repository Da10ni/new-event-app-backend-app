import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/notificationTypes.js';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
    deliveryStatus: {
      email: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'skipped' },
      push: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'skipped' },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
