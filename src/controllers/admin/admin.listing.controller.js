import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { MESSAGES } from '../../constants/index.js';
import * as adminService from '../../services/admin.service.js';

export const getListings = asyncHandler(async (req, res) => {
  const { listings, meta } = await adminService.getAdminListings(req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { listings }, meta });
});

export const approveListing = asyncHandler(async (req, res) => {
  const listing = await adminService.approveListing(req.params.id);
  sendResponse(res, { message: MESSAGES.LISTING.ACTIVATED, data: { listing } });
});

export const rejectListing = asyncHandler(async (req, res) => {
  const listing = await adminService.rejectListing(req.params.id, req.body.reason);
  sendResponse(res, { message: MESSAGES.LISTING.UPDATED, data: { listing } });
});

export const toggleFeatured = asyncHandler(async (req, res) => {
  const listing = await adminService.toggleListingFeatured(req.params.id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { listing } });
});
