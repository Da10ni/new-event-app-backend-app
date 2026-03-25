import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPaymentIntentValidation } from '../validations/payment.validation.js';

const router = Router();

// Authenticated routes
router.post('/create-intent', authenticate, validate(createPaymentIntentValidation), paymentController.createPaymentIntent);
router.post('/confirm', authenticate, paymentController.confirmPayment);

// Stripe webhook (no auth — Stripe signs the request)
router.post('/webhook', paymentController.handleWebhook);

export default router;