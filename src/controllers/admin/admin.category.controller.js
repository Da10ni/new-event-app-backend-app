import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../../constants/index.js';
import * as categoryService from '../../services/category.service.js';

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.CATEGORY.CREATED, data: { category } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendResponse(res, { message: MESSAGES.CATEGORY.UPDATED, data: { category } });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  sendResponse(res, { message: MESSAGES.CATEGORY.DELETED });
});
