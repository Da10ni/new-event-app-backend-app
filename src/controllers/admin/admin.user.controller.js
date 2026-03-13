import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { MESSAGES } from '../../constants/index.js';
import * as adminService from '../../services/admin.service.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await adminService.getAdminUsers(req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { users }, meta });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.toggleUserStatus(req.params.id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { user } });
});
