import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { MESSAGES } from '../constants/index.js';
import * as categoryService from '../services/category.service.js';
import * as listingService from '../services/listing.service.js';

export const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await categoryService.getCategories();
    sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { categories } });
  } catch (error) {
    console.error('Categories Controller Error:', error);
    throw error;
  }
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { category } });
});

export const getCategoryListings = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  const { listings, meta } = await listingService.getListings({ ...req.query, category: category._id.toString() });
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { listings }, meta });
});
