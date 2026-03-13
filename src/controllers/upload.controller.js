import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES, UPLOAD_CONSTANTS } from '../constants/index.js';
import * as uploadService from '../services/upload.service.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error(MESSAGES.UPLOAD.FAILED);
  const folder = req.body.folder || UPLOAD_CONSTANTS.CLOUDINARY_FOLDERS.LISTINGS;
  const result = await uploadService.uploadImage(req.file, folder);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.UPLOAD.SUCCESS, data: result });
});

export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new Error(MESSAGES.UPLOAD.FAILED);
  const folder = req.body.folder || UPLOAD_CONSTANTS.CLOUDINARY_FOLDERS.LISTINGS;
  const results = await uploadService.uploadMultipleImages(req.files, folder);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.UPLOAD.SUCCESS, data: { images: results } });
});

export const deleteImage = asyncHandler(async (req, res) => {
  await uploadService.deleteImage(req.body.publicId);
  sendResponse(res, { message: 'Image deleted successfully.' });
});
