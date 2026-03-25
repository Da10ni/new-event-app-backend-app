import Listing from '../models/Listing.model.js';
import Vendor from '../models/Vendor.model.js';
import Category from '../models/Category.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES, LISTING_STATUSES, VENDOR_STATUSES } from '../constants/index.js';
import { ApiFeatures } from '../utils/apiFeatures.js';
import { createSlug } from '../utils/slugify.js';

export const getListings = async (queryString) => {
  // If category is a slug (not an ObjectId), resolve it
  if (queryString.category && !/^[0-9a-fA-F]{24}$/.test(queryString.category)) {
    const cat = await Category.findOne({ slug: queryString.category });
    queryString = { ...queryString, category: cat ? cat._id.toString() : undefined };
  }

  const baseFilter = { status: LISTING_STATUSES.ACTIVE };
  const features = new ApiFeatures(
    Listing.find(baseFilter)
      .populate('vendor', 'businessName businessSlug averageRating')
      .populate('category', 'name slug'),
    queryString
  ).filter().search().sort().select().paginate().near();

  await features.countDocuments();
  const listings = await features.query;
  return { listings, meta: features.getMeta() };
};

export const getListingBySlug = async (slug) => {
  // Support lookup by ObjectId or slug
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
  const filter = isObjectId ? { _id: slug } : { slug };
  const listing = await Listing.findOne(filter)
    .populate('vendor', 'businessName businessSlug averageRating totalReviews userId description')
    .populate('category', 'name slug');
  if (!listing) throw new AppError(MESSAGES.LISTING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  listing.viewCount += 1;
  await listing.save();
  return listing;
};

export const getFeaturedListings = async () => {
  const featured = await Listing.find({ status: LISTING_STATUSES.ACTIVE, isFeatured: true })
    .populate('vendor', 'businessName businessSlug averageRating')
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(20);

  if (featured.length > 0) return featured;

  // Fallback: return any available active listings when no featured ones exist
  const anyApproved = await Listing.find({
    status: LISTING_STATUSES.ACTIVE,
  })
    .populate('vendor', 'businessName businessSlug averageRating')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(20);
  return anyApproved;
};

export const getPopularCities = async (limit = 6) => {
  const cities = await Listing.aggregate([
    { $match: { status: LISTING_STATUSES.ACTIVE } },
    {
      $group: {
        _id: '$address.city',
        count: { $sum: 1 },
        image: { $first: { $arrayElemAt: ['$images.url', 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        name: '$_id',
        listings: '$count',
        image: { $ifNull: ['$image', ''] },
      },
    },
  ]);
  return cities;
};

export const createListing = async (userId, data) => {
  if (!data || !data.title) throw new AppError('Listing title is required', HTTP_STATUS.BAD_REQUEST);

  const vendor = await Vendor.findOne({ userId, status: VENDOR_STATUSES.APPROVED });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_APPROVED, HTTP_STATUS.FORBIDDEN);

  const slug = createSlug(data.title);
  const listing = await Listing.create({ ...data, vendor: vendor._id, slug });

  vendor.totalListings += 1;
  await vendor.save();

  return listing;
};

export const updateListing = async (listingId, userId, data) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const listing = await Listing.findOne({ _id: listingId, vendor: vendor._id });
  if (!listing) throw new AppError(MESSAGES.LISTING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  Object.assign(listing, data);
  await listing.save();
  return listing;
};

export const deleteListing = async (listingId, userId) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const listing = await Listing.findOneAndUpdate(
    { _id: listingId, vendor: vendor._id },
    { status: LISTING_STATUSES.INACTIVE },
    { new: true }
  );
  if (!listing) throw new AppError(MESSAGES.LISTING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  vendor.totalListings = Math.max(0, vendor.totalListings - 1);
  await vendor.save();
  return listing;
};

export const getVendorListings = async (userId, queryString) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const features = new ApiFeatures(
    Listing.find({ vendor: vendor._id }).populate('category', 'name slug'),
    queryString
  ).filter().sort().paginate();

  await features.countDocuments();
  const listings = await features.query;
  return { listings, meta: features.getMeta() };
};
