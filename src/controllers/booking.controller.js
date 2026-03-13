import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as bookingService from '../services/booking.service.js';

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.BOOKING.CREATED, data: { booking } });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user._id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { booking } });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(req.params.id, req.user._id, req.body);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { booking } });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user._id, req.body.cancellationReason);
  sendResponse(res, { message: MESSAGES.BOOKING.CANCELLED, data: { booking } });
});

export const completeBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeBooking(req.params.id, req.user._id);
  sendResponse(res, { message: MESSAGES.BOOKING.COMPLETED, data: { booking } });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const { bookings, meta } = await bookingService.getClientBookings(req.user._id, req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { bookings }, meta });
});
