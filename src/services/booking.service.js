import Booking from '../models/Booking.model.js';
import Listing from '../models/Listing.model.js';
import Vendor from '../models/Vendor.model.js';
import Availability from '../models/Availability.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES, BOOKING_STATUSES, LISTING_STATUSES, NOTIFICATION_TYPES } from '../constants/index.js';
import { generateBookingNumber } from '../utils/dateHelpers.js';
import { ApiFeatures } from '../utils/apiFeatures.js';
import * as notificationService from './notification.service.js';
import * as paymentService from './payment.service.js';

export const createBooking = async (clientId, data) => {
  const listing = await Listing.findOne({ _id: data.listing, status: LISTING_STATUSES.ACTIVE });
  if (!listing) throw new AppError(MESSAGES.LISTING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const availability = await Availability.findOne({
    listing: listing._id,
    date: data.eventDate,
    isAvailable: false,
  });
  if (availability) throw new AppError(MESSAGES.BOOKING.DATE_UNAVAILABLE, HTTP_STATUS.BAD_REQUEST);

  const totalAmount = data.packageName
    ? listing.pricing.packages?.find((p) => p.name === data.packageName)?.price || listing.pricing.basePrice
    : listing.pricing.basePrice;

  const booking = await Booking.create({
    bookingNumber: generateBookingNumber(),
    client: clientId,
    vendor: listing.vendor,
    listing: listing._id,
    eventDate: data.eventDate,
    eventEndDate: data.eventEndDate,
    eventType: data.eventType,
    guestCount: data.guestCount,
    timeSlot: data.timeSlot,
    pricingSnapshot: {
      basePrice: listing.pricing.basePrice,
      packageName: data.packageName,
      packagePrice: totalAmount,
      totalAmount,
      currency: listing.pricing.currency,
    },
    clientMessage: data.clientMessage,
    specialRequests: data.specialRequests,
    statusHistory: [{ status: BOOKING_STATUSES.PENDING, changedBy: clientId }],
  });

  // Notify vendor of new booking
  const vendorDoc = await Vendor.findById(listing.vendor);
  if (vendorDoc) {
    await notificationService.createNotification({
      user: vendorDoc.userId,
      type: NOTIFICATION_TYPES.BOOKING_NEW_INQUIRY,
      title: 'New Booking Request',
      message: `You have a new booking request for "${listing.title}".`,
      data: { bookingId: booking._id, listingId: listing._id },
    });
  }

  // Return populated booking
  const populatedBooking = await Booking.findById(booking._id)
    .populate('client', 'firstName lastName email phone avatar')
    .populate('vendor', 'businessName businessSlug userId')
    .populate('listing', 'title slug images pricing address');

  return populatedBooking;
};

export const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate('client', 'firstName lastName email phone avatar')
    .populate('listing', 'title slug images pricing address')
    .populate('vendor', 'businessName businessSlug userId');

  if (!booking) throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const isClient = booking.client._id.toString() === userId.toString();
  const isVendor = booking.vendor.userId?.toString() === userId.toString();
  if (!isClient && !isVendor) throw new AppError(MESSAGES.AUTH.FORBIDDEN, HTTP_STATUS.FORBIDDEN);

  return booking;
};

export const updateBookingStatus = async (bookingId, vendorUserId, { status, vendorResponse }) => {
  const vendor = await Vendor.findOne({ userId: vendorUserId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const booking = await Booking.findOne({ _id: bookingId, vendor: vendor._id });
  if (!booking) throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  booking.status = status;
  if (vendorResponse) booking.vendorResponse = vendorResponse;
  booking.statusHistory.push({ status, changedBy: vendorUserId });

  if (status === BOOKING_STATUSES.CONFIRMED) {
    await Availability.findOneAndUpdate(
      { listing: booking.listing, date: booking.eventDate },
      { listing: booking.listing, vendor: vendor._id, date: booking.eventDate, isAvailable: false },
      { upsert: true }
    );
  }

  await booking.save();

  // Auto-refund if provider rejects or cancels a paid booking
  let wasRefunded = false;
  const shouldRefund = [BOOKING_STATUSES.REJECTED, BOOKING_STATUSES.CANCELLED].includes(status) && booking.paymentStatus === 'succeeded' && booking.paymentIntentId;

  if (shouldRefund) {
    try {
      console.log('Attempting refund for booking', bookingId, 'paymentIntentId:', booking.paymentIntentId, 'paymentStatus:', booking.paymentStatus);
      await paymentService.refundPayment(booking._id);
      wasRefunded = true;
      console.log('Refund successful for booking', bookingId);
    } catch (refundErr) {
      console.error('Auto-refund failed for booking', bookingId, 'Error:', refundErr.message, refundErr.stack);
    }
  } else if ([BOOKING_STATUSES.REJECTED, BOOKING_STATUSES.CANCELLED].includes(status)) {
    console.log('Skipping refund for booking', bookingId, '- paymentStatus:', booking.paymentStatus, 'paymentIntentId:', booking.paymentIntentId);
  }

  // Notify client of status change
  const listingDoc = await Listing.findById(booking.listing);
  const notifMap = {
    [BOOKING_STATUSES.ACCEPTED]: { type: NOTIFICATION_TYPES.BOOKING_ACCEPTED, title: 'Booking Accepted' },
    [BOOKING_STATUSES.CONFIRMED]: { type: NOTIFICATION_TYPES.BOOKING_CONFIRMED, title: 'Booking Confirmed' },
    [BOOKING_STATUSES.REJECTED]: { type: NOTIFICATION_TYPES.BOOKING_REJECTED, title: 'Booking Rejected' },
    [BOOKING_STATUSES.CANCELLED]: { type: NOTIFICATION_TYPES.BOOKING_CANCELLED, title: 'Booking Cancelled' },
  };
  const notif = notifMap[status] || { type: NOTIFICATION_TYPES.BOOKING_CONFIRMED, title: `Booking ${status}` };

  const refundNote = wasRefunded ? ' Your payment has been refunded.' : '';

  await notificationService.createNotification({
    user: booking.client,
    type: notif.type,
    title: notif.title,
    message: `Your booking for "${listingDoc?.title}" has been ${status}.${refundNote}`,
    data: { bookingId: booking._id, listingId: booking.listing },
  });

  // Reload from DB to include refund status updates
  const updatedBooking = await Booking.findById(bookingId)
    .populate('client', 'firstName lastName email phone avatar')
    .populate('listing', 'title slug images pricing address')
    .populate('vendor', 'businessName businessSlug userId');

  return updatedBooking;
};

export const cancelBooking = async (bookingId, userId, cancellationReason) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if ([BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.CANCELLED].includes(booking.status)) {
    throw new AppError('Booking cannot be cancelled.', HTTP_STATUS.BAD_REQUEST);
  }

  const wasConfirmed = booking.status === BOOKING_STATUSES.CONFIRMED;

  booking.status = BOOKING_STATUSES.CANCELLED;
  booking.cancellationReason = cancellationReason;
  booking.cancelledBy = userId;
  booking.cancelledAt = new Date();
  booking.statusHistory.push({ status: BOOKING_STATUSES.CANCELLED, changedBy: userId, reason: cancellationReason });

  if (wasConfirmed) {
    await Availability.findOneAndUpdate(
      { listing: booking.listing, date: booking.eventDate },
      { isAvailable: true }
    );
  }

  await booking.save();

  // Auto-refund if payment was already made
  let wasRefunded = false;
  if (booking.paymentStatus === 'succeeded' && booking.paymentIntentId) {
    try {
      await paymentService.refundPayment(booking._id);
      wasRefunded = true;
    } catch (refundErr) {
      console.error('Auto-refund failed for booking', bookingId, refundErr.message);
    }
  }

  // Notify the other party
  const listingDoc = await Listing.findById(booking.listing);
  const isClient = booking.client.toString() === userId.toString();
  if (isClient) {
    const vendorDoc = await Vendor.findById(booking.vendor);
    if (vendorDoc) {
      const refundNote = wasRefunded ? ' Your payment has been refunded.' : '';
      await notificationService.createNotification({
        user: vendorDoc.userId,
        type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
        title: 'Booking Cancelled',
        message: `A booking for "${listingDoc?.title}" has been cancelled by the client.${refundNote}`,
        data: { bookingId: booking._id, listingId: booking.listing },
      });
    }
  } else {
    const refundNote = wasRefunded ? ' Your payment has been refunded.' : '';
    await notificationService.createNotification({
      user: booking.client,
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      message: `Your booking for "${listingDoc?.title}" has been cancelled by the provider.${refundNote}`,
      data: { bookingId: booking._id, listingId: booking.listing },
    });
  }

  // Reload from DB to include refund status updates
  const updatedBooking = await Booking.findById(bookingId)
    .populate('client', 'firstName lastName email phone avatar')
    .populate('listing', 'title slug images pricing address')
    .populate('vendor', 'businessName businessSlug userId');

  return updatedBooking;
};

export const completeBooking = async (bookingId, vendorUserId) => {
  const vendor = await Vendor.findOne({ userId: vendorUserId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const booking = await Booking.findOne({ _id: bookingId, vendor: vendor._id });
  if (!booking) throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (booking.status !== BOOKING_STATUSES.CONFIRMED) {
    throw new AppError('Only confirmed bookings can be completed.', HTTP_STATUS.BAD_REQUEST);
  }

  booking.status = BOOKING_STATUSES.COMPLETED;
  booking.completedAt = new Date();
  booking.statusHistory.push({ status: BOOKING_STATUSES.COMPLETED, changedBy: vendorUserId });

  vendor.totalBookings += 1;
  await vendor.save();

  const listing = await Listing.findById(booking.listing);
  if (listing) {
    listing.totalBookings += 1;
    await listing.save();
  }

  await booking.save();

  // Notify client of completion
  await notificationService.createNotification({
    user: booking.client,
    type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
    title: 'Booking Completed',
    message: `Your booking for "${listing?.title}" has been completed. Please leave a review!`,
    data: { bookingId: booking._id, listingId: booking.listing },
  });

  return booking;
};

export const getClientBookings = async (clientId, queryString) => {
  const features = new ApiFeatures(
    Booking.find({ client: clientId })
      .populate('listing', 'title slug images pricing address')
      .populate('vendor', 'businessName businessSlug'),
    queryString
  ).filter().sort().paginate();

  await features.countDocuments();
  const bookings = await features.query;
  return { bookings, meta: features.getMeta() };
};

export const getVendorBookings = async (userId, queryString) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const features = new ApiFeatures(
    Booking.find({ vendor: vendor._id })
      .populate('client', 'firstName lastName email phone avatar')
      .populate('listing', 'title slug images pricing address'),
    queryString
  ).filter().sort().paginate();

  await features.countDocuments();
  const bookings = await features.query;
  return { bookings, meta: features.getMeta() };
};
