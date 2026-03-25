import mongoose from 'mongoose';
import { BOOKING_STATUSES } from '../constants/bookingStatuses.js';

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    eventDate: { type: Date, required: true },
    eventEndDate: { type: Date },
    eventType: { type: String, trim: true },
    guestCount: { type: Number, min: 1 },
    timeSlot: {
      startTime: { type: String },
      endTime: { type: String },
    },
    pricingSnapshot: {
      basePrice: { type: Number, required: true },
      packageName: { type: String },
      packagePrice: { type: Number },
      customPrice: { type: Number },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: 'PKR' },
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUSES),
      default: BOOKING_STATUSES.PENDING,
    },
    clientMessage: { type: String, maxlength: 2000 },
    vendorResponse: { type: String, maxlength: 2000 },
    statusHistory: [
      {
        status: { type: String, enum: Object.values(BOOKING_STATUSES) },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    specialRequests: { type: String, maxlength: 2000 },
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
    isReviewed: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentIntentId: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date },
    refundId: { type: String },
    refundedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ client: 1, status: 1, createdAt: -1 });
bookingSchema.index({ vendor: 1, status: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, eventDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ eventDate: 1 });
bookingSchema.index({ vendor: 1, eventDate: 1, status: 1 });
bookingSchema.index({ paymentIntentId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;