import Category from '../models/Category.model.js';
import Listing from '../models/Listing.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import { createBaseSlug } from '../utils/slugify.js';

export const getCategories = async () => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder').lean();

    // Try to get listing counts, but don't fail if it errors
    let countMap = {};
    try {
      const listingCounts = await Listing.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);

      for (const item of listingCounts) {
        if (item._id) {
          countMap[item._id.toString()] = item.count;
        }
      }
    } catch (aggError) {
      console.error('Listing aggregation error:', aggError.message);
    }

    return categories.map((cat) => ({
      ...cat,
      listingCount: countMap[cat._id.toString()] ?? 0,
    }));
  } catch (error) {
    console.error('getCategories error:', error.message);
    throw error;
  }
};

export const getCategoryBySlug = async (slug) => {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw new AppError(MESSAGES.CATEGORY.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return category;
};

export const createCategory = async (data) => {
  const slug = createBaseSlug(data.name);
  return Category.create({ ...data, slug });
};

export const updateCategory = async (id, data) => {
  if (data.name) data.slug = createBaseSlug(data.name);
  const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!category) throw new AppError(MESSAGES.CATEGORY.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return category;
};

export const deleteCategory = async (id) => {
  const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!category) throw new AppError(MESSAGES.CATEGORY.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return category;
};
