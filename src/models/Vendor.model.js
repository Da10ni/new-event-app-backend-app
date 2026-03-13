import mongoose from 'mongoose';
import { VENDOR_STATUSES } from '../constants/vendorStatuses.js';

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true, maxlength: 100 },
    businessSlug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 2000 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    businessPhone: { type: String, trim: true },
    businessEmail: { type: String, lowercase: true, trim: true },
    website: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      country: { type: String, required: true, trim: true, default: 'Pakistan' },
      zipCode: { type: String, trim: true },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    status: { type: String, enum: Object.values(VENDOR_STATUSES), default: VENDOR_STATUSES.PENDING },
    verificationDocs: [
      {
        docType: { type: String },
        url: { type: String },
        publicId: { type: String },
      },
    ],
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalListings: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    responseTime: {
      type: String,
      enum: ['within_1_hour', 'within_24_hours', 'within_48_hours'],
      default: 'within_24_hours',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

vendorSchema.index({ status: 1, isAvailable: 1 });
vendorSchema.index({ categories: 1, status: 1 });
vendorSchema.index({ 'address.city': 1, status: 1 });
vendorSchema.index({ averageRating: -1 });
vendorSchema.index({ location: '2dsphere' });

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
