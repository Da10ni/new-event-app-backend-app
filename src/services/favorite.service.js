import Favorite from '../models/Favorite.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import { ApiFeatures } from '../utils/apiFeatures.js';

export const addFavorite = async (userId, listingId) => {
  const existing = await Favorite.findOne({ user: userId, listing: listingId });
  if (existing) return existing;
  return Favorite.create({ user: userId, listing: listingId });
};

export const removeFavorite = async (userId, listingId) => {
  const result = await Favorite.findOneAndDelete({ user: userId, listing: listingId });
  if (!result) throw new AppError('Not found in favorites.', HTTP_STATUS.NOT_FOUND);
  return result;
};

export const getUserFavorites = async (userId, queryString) => {
  const features = new ApiFeatures(
    Favorite.find({ user: userId }).populate({
      path: 'listing',
      select: 'title slug images pricing averageRating totalReviews address category',
      populate: { path: 'category', select: 'name slug' },
    }),
    queryString
  ).sort().paginate();

  await features.countDocuments();
  const favorites = await features.query;
  return { favorites, meta: features.getMeta() };
};

export const checkFavorite = async (userId, listingId) => {
  const favorite = await Favorite.findOne({ user: userId, listing: listingId });
  return { isFavorite: !!favorite };
};
