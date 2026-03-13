import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    detailedRatings: {
      quality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    vendorReply: {
      comment: { type: String, maxlength: 1000 },
      repliedAt: { type: Date },
    },
    isVisible: { type: Boolean, default: true },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String },
  },
  { timestamps: true }
);

reviewSchema.index({ listing: 1, createdAt: -1 });
reviewSchema.index({ vendor: 1, createdAt: -1 });
reviewSchema.index({ client: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isVisible: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
