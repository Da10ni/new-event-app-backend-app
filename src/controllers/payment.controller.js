import Stripe from 'stripe';
import { config } from '../config/index.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as paymentService from '../services/payment.service.js';

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /payments/create-intent
 * Create a Stripe PaymentIntent for a booking
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const result = await paymentService.createPaymentIntent(bookingId, req.user._id);
  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: MESSAGES.PAYMENT.INTENT_CREATED,
    data: result,
  });
});

/**
 * POST /payments/confirm
 * Confirm payment status by checking Stripe directly
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const result = await paymentService.confirmPayment(bookingId, req.user._id);
  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: result.message,
    data: result,
  });
});

/**
 * POST /payments/webhook
 * Handle Stripe webhook events
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: MESSAGES.PAYMENT.INVALID_SIGNATURE });
  }

  await paymentService.handleWebhookEvent(event);

  res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.PAYMENT.WEBHOOK_RECEIVED });
};