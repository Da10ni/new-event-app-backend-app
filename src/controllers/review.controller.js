import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as reviewService from '../services/review.service.js';

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.body);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.REVIEW.CREATED, data: { review } });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.params.id, req.user._id, req.body);
  sendResponse(res, { message: MESSAGES.REVIEW.UPDATED, data: { review } });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user._id);
  sendResponse(res, { message: MESSAGES.REVIEW.DELETED });
});

export const addVendorReply = asyncHandler(async (req, res) => {
  const review = await reviewService.addVendorReply(req.params.id, req.user._id, req.body.comment);
  sendResponse(res, { message: MESSAGES.REVIEW.REPLY_ADDED, data: { review } });
});
