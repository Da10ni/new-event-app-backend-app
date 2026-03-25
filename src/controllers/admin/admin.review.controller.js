import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { MESSAGES } from '../../constants/index.js';
import * as adminService from '../../services/admin.service.js';

export const getReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await adminService.getAdminReviews(req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { reviews }, meta });
});

export const getReviewById = asyncHandler(async (req, res) => {
  const review = await adminService.getAdminReviewById(req.params.id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { review } });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await adminService.deleteAdminReview(req.params.id);
  sendResponse(res, { message: MESSAGES.REVIEW.DELETED });
});

export const toggleVisibility = asyncHandler(async (req, res) => {
  const review = await adminService.toggleReviewVisibility(req.params.id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { review } });
});
