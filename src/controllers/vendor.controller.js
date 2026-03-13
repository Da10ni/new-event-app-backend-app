import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as vendorService from '../services/vendor.service.js';
import * as listingService from '../services/listing.service.js';
import * as bookingService from '../services/booking.service.js';

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendorProfile(req.user._id, req.body);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.VENDOR.CREATED, data: { vendor } });
});

export const getVendors = asyncHandler(async (req, res) => {
  const { vendors, meta } = await vendorService.getVendors(req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { vendors }, meta });
});

export const getVendorBySlug = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorBySlug(req.params.slug);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { vendor } });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorProfile(req.user._id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { vendor } });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendorProfile(req.user._id, req.body);
  sendResponse(res, { message: MESSAGES.VENDOR.UPDATED, data: { vendor } });
});

export const toggleAvailability = asyncHandler(async (req, res) => {
  const vendor = await vendorService.toggleVendorAvailability(req.user._id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { vendor } });
});

export const getMyListings = asyncHandler(async (req, res) => {
  const { listings, meta } = await listingService.getVendorListings(req.user._id, req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { listings }, meta });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const { bookings, meta } = await bookingService.getVendorBookings(req.user._id, req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { bookings }, meta });
});

export const getMyDashboard = asyncHandler(async (req, res) => {
  const { stats, recentBookings } = await vendorService.getVendorDashboard(req.user._id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { stats, recentBookings } });
});
