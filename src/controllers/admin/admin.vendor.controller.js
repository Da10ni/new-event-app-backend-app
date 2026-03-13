import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { MESSAGES } from '../../constants/index.js';
import * as adminService from '../../services/admin.service.js';
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '../../services/mail.service.js';

export const getVendors = asyncHandler(async (req, res) => {
  const { vendors, meta } = await adminService.getAdminVendors(req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { vendors }, meta });
});

export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await adminService.getAdminVendorById(req.params.id);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { vendor } });
});

export const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.approveVendor(req.params.id, req.user._id);

  // Send approval email to vendor
  if (vendor.userId?.email) {
    sendVendorApprovalEmail(vendor.userId.email, vendor.businessName);
  }

  sendResponse(res, { message: MESSAGES.VENDOR.APPROVED, data: { vendor } });
});

export const rejectVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.rejectVendor(req.params.id, req.body.reason);

  // Send rejection email to vendor
  if (vendor.userId?.email) {
    sendVendorRejectionEmail(vendor.userId.email, vendor.businessName, req.body.reason);
  }

  sendResponse(res, { message: MESSAGES.VENDOR.REJECTED, data: { vendor } });
});

export const suspendVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.suspendVendor(req.params.id);
  sendResponse(res, { message: MESSAGES.VENDOR.SUSPENDED, data: { vendor } });
});
