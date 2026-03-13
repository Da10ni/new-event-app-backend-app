import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { MESSAGES } from '../../constants/index.js';
import * as adminService from '../../services/admin.service.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { stats } });
});
