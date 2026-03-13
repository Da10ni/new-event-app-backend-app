import rateLimit from 'express-rate-limit';
import { MESSAGES } from '../constants/index.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: MESSAGES.GENERAL.RATE_LIMIT },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: MESSAGES.GENERAL.RATE_LIMIT },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: MESSAGES.GENERAL.RATE_LIMIT },
  standardHeaders: true,
  legacyHeaders: false,
});
