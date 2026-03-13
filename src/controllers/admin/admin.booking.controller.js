import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { MESSAGES } from '../../constants/index.js';
import * as adminService from '../../services/admin.service.js';

export const getBookings = asyncHandler(async (req, res) => {
  const { bookings, meta } = await adminService.getAdminBookings(req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { bookings }, meta });
});
