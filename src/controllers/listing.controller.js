import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as listingService from '../services/listing.service.js';
import * as reviewService from '../services/review.service.js';

export const getListings = asyncHandler(async (req, res) => {
  const { listings, meta } = await listingService.getListings(req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { listings }, meta });
});

export const getListingBySlug = asyncHandler(async (req, res) => {
  const listing = await listingService.getListingBySlug(req.params.slug);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { listing } });
});

export const getFeaturedListings = asyncHandler(async (req, res) => {
  const listings = await listingService.getFeaturedListings();
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { listings } });
});

export const createListing = asyncHandler(async (req, res) => {
  const listing = await listingService.createListing(req.user._id, req.body);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.LISTING.CREATED, data: { listing } });
});

export const updateListing = asyncHandler(async (req, res) => {
  const listing = await listingService.updateListing(req.params.id, req.user._id, req.body);
  sendResponse(res, { message: MESSAGES.LISTING.UPDATED, data: { listing } });
});

export const deleteListing = asyncHandler(async (req, res) => {
  await listingService.deleteListing(req.params.id, req.user._id);
  sendResponse(res, { message: MESSAGES.LISTING.DELETED });
});

export const getListingReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.getListingReviews(req.params.id, req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { reviews }, meta });
});
