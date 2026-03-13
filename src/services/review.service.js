import Review from '../models/Review.model.js';
import Booking from '../models/Booking.model.js';
import Listing from '../models/Listing.model.js';
import Vendor from '../models/Vendor.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES, BOOKING_STATUSES } from '../constants/index.js';
import { ApiFeatures } from '../utils/apiFeatures.js';

export const createReview = async (clientId, data) => {
  const booking = await Booking.findOne({ _id: data.booking, client: clientId });
  if (!booking) throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (booking.status !== BOOKING_STATUSES.COMPLETED) {
    throw new AppError(MESSAGES.REVIEW.BOOKING_NOT_COMPLETE, HTTP_STATUS.BAD_REQUEST);
  }
  if (booking.isReviewed) {
    throw new AppError(MESSAGES.BOOKING.ALREADY_REVIEWED, HTTP_STATUS.CONFLICT);
  }

  const review = await Review.create({
    ...data,
    listing: booking.listing,
    vendor: booking.vendor,
    client: clientId,
  });

  booking.isReviewed = true;
  await booking.save();

  await updateRatingAggregates(booking.listing, booking.vendor);
  return review;
};

export const getListingReviews = async (listingId, queryString) => {
  const features = new ApiFeatures(
    Review.find({ listing: listingId, isVisible: true })
      .populate('client', 'firstName lastName avatar'),
    queryString
  ).sort().paginate();

  await features.countDocuments();
  const reviews = await features.query;
  return { reviews, meta: features.getMeta() };
};

export const updateReview = async (reviewId, clientId, data) => {
  const review = await Review.findOne({ _id: reviewId, client: clientId });
  if (!review) throw new AppError(MESSAGES.REVIEW.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  Object.assign(review, data);
  await review.save();
  await updateRatingAggregates(review.listing, review.vendor);
  return review;
};

export const deleteReview = async (reviewId, clientId) => {
  const review = await Review.findOneAndDelete({ _id: reviewId, client: clientId });
  if (!review) throw new AppError(MESSAGES.REVIEW.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  await Booking.findByIdAndUpdate(review.booking, { isReviewed: false });
  await updateRatingAggregates(review.listing, review.vendor);
  return review;
};

export const addVendorReply = async (reviewId, vendorUserId, comment) => {
  const vendor = await Vendor.findOne({ userId: vendorUserId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const review = await Review.findOne({ _id: reviewId, vendor: vendor._id });
  if (!review) throw new AppError(MESSAGES.REVIEW.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  review.vendorReply = { comment, repliedAt: new Date() };
  await review.save();
  return review;
};

async function updateRatingAggregates(listingId, vendorId) {
  const listingStats = await Review.aggregate([
    { $match: { listing: listingId, isVisible: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const listing = await Listing.findById(listingId);
  if (listing) {
    listing.averageRating = listingStats[0]?.avg ? Math.round(listingStats[0].avg * 100) / 100 : 0;
    listing.totalReviews = listingStats[0]?.count || 0;
    await listing.save();
  }

  const vendorStats = await Review.aggregate([
    { $match: { vendor: vendorId, isVisible: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const vendor = await Vendor.findById(vendorId);
  if (vendor) {
    vendor.averageRating = vendorStats[0]?.avg ? Math.round(vendorStats[0].avg * 100) / 100 : 0;
    vendor.totalReviews = vendorStats[0]?.count || 0;
    await vendor.save();
  }
}
