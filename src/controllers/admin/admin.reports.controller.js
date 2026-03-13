import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { MESSAGES } from '../../constants/index.js';
import * as reportsService from '../../services/reports.service.js';

export const getRevenueStats = asyncHandler(async (req, res) => {
  const { period = '6m' } = req.query;
  const stats = await reportsService.getRevenueStats(period);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: stats });
});

export const getBookingStats = asyncHandler(async (req, res) => {
  const { period = '6m' } = req.query;
  const stats = await reportsService.getBookingStats(period);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: stats });
});

export const getUserGrowthStats = asyncHandler(async (req, res) => {
  const { period = '6m' } = req.query;
  const stats = await reportsService.getUserGrowthStats(period);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: stats });
});

export const getTopVendors = asyncHandler(async (req, res) => {
  const { period = '6m', limit = 10 } = req.query;
  const vendors = await reportsService.getTopVendors(period, parseInt(limit));
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: vendors });
});

export const getAllReportsData = asyncHandler(async (req, res) => {
  const { period = '6m' } = req.query;
  const [revenue, bookings, userGrowth, topVendors] = await Promise.all([
    reportsService.getRevenueStats(period),
    reportsService.getBookingStats(period),
    reportsService.getUserGrowthStats(period),
    reportsService.getTopVendors(period, 10),
  ]);
  sendResponse(res, {
    message: MESSAGES.GENERAL.SUCCESS,
    data: { revenue, bookings, userGrowth, topVendors },
  });
});
