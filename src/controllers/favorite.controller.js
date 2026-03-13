import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import * as favoriteService from '../services/favorite.service.js';

export const addFavorite = asyncHandler(async (req, res) => {
  const favorite = await favoriteService.addFavorite(req.user._id, req.body.listing);
  sendResponse(res, { statusCode: HTTP_STATUS.CREATED, message: MESSAGES.FAVORITE.ADDED, data: { favorite } });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await favoriteService.removeFavorite(req.user._id, req.params.listingId);
  sendResponse(res, { message: MESSAGES.FAVORITE.REMOVED });
});

export const getFavorites = asyncHandler(async (req, res) => {
  const { favorites, meta } = await favoriteService.getUserFavorites(req.user._id, req.query);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: { favorites }, meta });
});

export const checkFavorite = asyncHandler(async (req, res) => {
  const result = await favoriteService.checkFavorite(req.user._id, req.params.listingId);
  sendResponse(res, { message: MESSAGES.GENERAL.SUCCESS, data: result });
});
