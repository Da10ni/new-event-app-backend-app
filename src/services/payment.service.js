import Stripe from 'stripe';
import { config } from '../config/index.js';
import Booking from '../models/Booking.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as notificationService from './notification.service.js';
import { NOTIFICATION_TYPES } from '../constants/index.js';
import Listing from '../models/Listing.model.js';

const stripe = new Stripe(config.stripe.secretKey);

/**
 * Create a Stripe PaymentIntent for a booking
 */
export const createPaymentIntent = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate('listing', 'title')
    .populate('client', 'firstName lastName email');

  if (!booking) {
    throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Verify the requesting user is the booking client
  if (booking.client._id.toString() !== userId.toString()) {
    throw new AppError(MESSAGES.AUTH.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  // Check if already paid
  if (booking.paymentStatus === 'succeeded') {
    throw new AppError(MESSAGES.PAYMENT.ALREADY_PAID, HTTP_STATUS.BAD_REQUEST);
  }

  // If a payment intent already exists, check its status on Stripe
  if (booking.paymentIntentId) {
    try {
      const existingIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);

      // If already succeeded on Stripe, update our DB and return
      if (existingIntent.status === 'succeeded') {
        booking.paymentStatus = 'succeeded';
        booking.transactionId = existingIntent.id;
        booking.paidAt = new Date();
        await booking.save();
        throw new AppError(MESSAGES.PAYMENT.ALREADY_PAID, HTTP_STATUS.BAD_REQUEST);
      }

      // If still active (requires_payment_method, requires_confirmation, etc.), reuse it
      if (existingIntent.status !== 'canceled') {
        return {
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
          amount: existingIntent.amount,
          currency: existingIntent.currency,
        };
      }
      // If canceled, fall through to create a new one
    } catch (err) {
      // If it's our own AppError (ALREADY_PAID), rethrow
      if (err instanceof AppError) throw err;
      // Otherwise Stripe retrieval failed, create a new intent
    }
  }

  // Convert PKR amount to paisa (smallest currency unit) for Stripe
  const amountInPaisa = Math.round(booking.pricingSnapshot.totalAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPaisa,
    currency: booking.pricingSnapshot.currency.toLowerCase(),
    metadata: {
      bookingId: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      clientId: userId.toString(),
    },
    description: `Booking #${booking.bookingNumber} - ${booking.listing.title}`,
  });

  // Update booking with payment intent ID
  booking.paymentIntentId = paymentIntent.id;
  booking.paymentStatus = 'processing';
  await booking.save();

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  };
};

/**
 * Confirm payment status by checking Stripe directly
 */
export const confirmPayment = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate('listing', 'title');

  if (!booking) {
    throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (booking.client.toString() !== userId.toString()) {
    throw new AppError(MESSAGES.AUTH.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  if (booking.paymentStatus === 'succeeded') {
    return { status: 'succeeded', message: 'Payment already confirmed' };
  }

  if (!booking.paymentIntentId) {
    throw new AppError('No payment intent found for this booking', HTTP_STATUS.BAD_REQUEST);
  }

  // Retrieve the payment intent from Stripe to check actual status
  const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    booking.paymentStatus = 'succeeded';
    booking.transactionId = paymentIntent.id;
    booking.paidAt = new Date();
    await booking.save();

    // Notify client
    await notificationService.createNotification({
      user: booking.client,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      title: 'Payment Successful',
      message: `Your payment for "${booking.listing?.title}" (Booking #${booking.bookingNumber}) has been processed successfully.`,
      data: { bookingId: booking._id, listingId: booking.listing?._id || booking.listing },
    });

    return { status: 'succeeded', message: 'Payment confirmed successfully' };
  } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
    booking.paymentStatus = 'failed';
    await booking.save();
    return { status: 'failed', message: 'Payment failed' };
  }

  return { status: paymentIntent.status, message: `Payment status: ${paymentIntent.status}` };
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhookEvent = async (event) => {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      await handlePaymentFailure(paymentIntent);
      break;
    }
    default:
      // Unhandled event type — ignore
      break;
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (paymentIntent) => {
  const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
  if (!booking) return;

  booking.paymentStatus = 'succeeded';
  booking.transactionId = paymentIntent.id;
  booking.paidAt = new Date();
  await booking.save();

  // Notify client
  const listing = await Listing.findById(booking.listing);
  await notificationService.createNotification({
    user: booking.client,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    title: 'Payment Successful',
    message: `Your payment for "${listing?.title}" (Booking #${booking.bookingNumber}) has been processed successfully.`,
    data: { bookingId: booking._id, listingId: booking.listing },
  });
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (paymentIntent) => {
  const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
  if (!booking) return;

  booking.paymentStatus = 'failed';
  await booking.save();
};

/**
 * Refund a payment for a booking
 */
export const refundPayment = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate('listing', 'title');
  if (!booking) {
    throw new AppError(MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (booking.paymentStatus !== 'succeeded' || !booking.paymentIntentId) {
    throw new AppError(MESSAGES.PAYMENT.NO_PAYMENT_TO_REFUND, HTTP_STATUS.BAD_REQUEST);
  }

  const refund = await stripe.refunds.create({
    payment_intent: booking.paymentIntentId,
  });

  booking.paymentStatus = 'refunded';
  booking.refundId = refund.id;
  booking.refundedAt = new Date();
  await booking.save();

  // Notify client about refund
  await notificationService.createNotification({
    user: booking.client,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    title: 'Payment Refunded',
    message: `Your payment for "${booking.listing?.title}" (Booking #${booking.bookingNumber}) has been refunded.`,
    data: { bookingId: booking._id, listingId: booking.listing?._id || booking.listing },
  });

  return refund;
};