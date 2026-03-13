import mongoose from 'mongoose';
import { LISTING_STATUSES } from '../constants/listingStatuses.js';

const listingSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 5000 },
    pricing: {
      basePrice: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'PKR' },
      priceUnit: {
        type: String,
        enum: ['per_event', 'per_day', 'per_night', 'per_hour', 'per_person', 'per_plate', 'package'],
        default: 'per_event',
      },
      maxPrice: { type: Number, min: 0 },
      packages: [
        {
          name: { type: String, required: true },
          description: { type: String },
          price: { type: Number, required: true, min: 0 },
          includes: [{ type: String }],
        },
      ],
    },
    capacity: {
      min: { type: Number, min: 0, default: 0 },
      max: { type: Number, min: 0, default: 0 },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      country: { type: String, default: 'Pakistan', trim: true },
      zipCode: { type: String, trim: true },
      area: { type: String, trim: true },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        caption: { type: String, maxlength: 200 },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    videos: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    amenities: [{ type: String }],
    tags: [{ type: String }],
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: Object.values(LISTING_STATUSES), default: LISTING_STATUSES.ACTIVE },
    isFeatured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

listingSchema.index({ vendor: 1, status: 1 });
listingSchema.index({ category: 1, status: 1, 'address.city': 1 });
listingSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
listingSchema.index({ 'pricing.basePrice': 1 });
listingSchema.index({ 'capacity.max': 1 });
listingSchema.index({ averageRating: -1 });
listingSchema.index({ tags: 1, status: 1 });
listingSchema.index({ location: '2dsphere' });
listingSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
