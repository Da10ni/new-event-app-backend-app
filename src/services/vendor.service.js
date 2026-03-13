import Vendor from '../models/Vendor.model.js';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import Listing from '../models/Listing.model.js';
import Booking from '../models/Booking.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES, VENDOR_STATUSES, USER_ROLES } from '../constants/index.js';
import { ApiFeatures } from '../utils/apiFeatures.js';
import { createSlug } from '../utils/slugify.js';

export const createVendorProfile = async (userId, data) => {
  const existingVendor = await Vendor.findOne({ userId });
  if (existingVendor) {
    throw new AppError(MESSAGES.VENDOR.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
  }

  if (data.categories && data.categories.length > 0) {
    const categoryCount = await Category.countDocuments({
      _id: { $in: data.categories },
      isActive: true,
    });
    if (categoryCount !== data.categories.length) {
      throw new AppError('One or more categories are invalid.', HTTP_STATUS.BAD_REQUEST);
    }
  }

  const vendor = await Vendor.create({
    userId,
    businessName: data.businessName,
    businessSlug: createSlug(data.businessName),
    description: data.description,
    categories: data.categories,
    businessPhone: data.businessPhone,
    businessEmail: data.businessEmail,
    address: data.address,
  });

  await User.findByIdAndUpdate(userId, { role: USER_ROLES.VENDOR });

  return Vendor.findById(vendor._id).populate('categories', 'name slug');
};

export const getVendors = async (queryString) => {
  const filter = { status: VENDOR_STATUSES.APPROVED, isAvailable: true };
  const features = new ApiFeatures(Vendor.find(filter).populate('categories', 'name slug icon').populate('userId', 'firstName lastName avatar'), queryString)
    .filter()
    .sort()
    .select()
    .paginate();

  await features.countDocuments();
  const vendors = await features.query;
  return { vendors, meta: features.getMeta() };
};

export const getVendorBySlug = async (slug) => {
  const vendor = await Vendor.findOne({ businessSlug: slug, status: VENDOR_STATUSES.APPROVED })
    .populate('categories', 'name slug icon')
    .populate('userId', 'firstName lastName avatar email phone');
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return vendor;
};

export const getVendorProfile = async (userId) => {
  const vendor = await Vendor.findOne({ userId }).populate('categories', 'name slug');
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return vendor;
};

export const updateVendorProfile = async (userId, updateData) => {
  const vendor = await Vendor.findOneAndUpdate({ userId }, updateData, { new: true, runValidators: true }).populate('categories', 'name slug');
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return vendor;
};

export const toggleVendorAvailability = async (userId) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  vendor.isAvailable = !vendor.isAvailable;
  await vendor.save();
  return vendor;
};

export const getVendorDashboard = async (userId) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const vendorId = vendor._id;

  // Get listing stats
  const listingStats = await Listing.aggregate([
    { $match: { vendor: vendorId } },
    {
      $group: {
        _id: null,
        totalListings: { $sum: 1 },
        activeListings: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      },
    },
  ]);

  // Get booking stats
  const bookingStats = await Booking.aggregate([
    {
      $lookup: {
        from: 'listings',
        localField: 'listing',
        foreignField: '_id',
        as: 'listingData',
      },
    },
    { $unwind: '$listingData' },
    { $match: { 'listingData.vendor': vendorId } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] },
        },
      },
    },
  ]);

  // Get monthly revenue
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyRevenueResult = await Booking.aggregate([
    {
      $lookup: {
        from: 'listings',
        localField: 'listing',
        foreignField: '_id',
        as: 'listingData',
      },
    },
    { $unwind: '$listingData' },
    {
      $match: {
        'listingData.vendor': vendorId,
        status: 'completed',
        createdAt: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        monthlyRevenue: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Get recent bookings
  const recentBookings = await Booking.find()
    .populate({
      path: 'listing',
      match: { vendor: vendorId },
      select: 'title category',
    })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Filter out bookings where listing didn't match
  const filteredBookings = recentBookings.filter((b) => b.listing);

  const stats = {
    totalListings: listingStats[0]?.totalListings || 0,
    activeListings: listingStats[0]?.activeListings || 0,
    totalBookings: bookingStats[0]?.totalBookings || 0,
    pendingBookings: bookingStats[0]?.pendingBookings || 0,
    confirmedBookings: bookingStats[0]?.confirmedBookings || 0,
    completedBookings: bookingStats[0]?.completedBookings || 0,
    cancelledBookings: bookingStats[0]?.cancelledBookings || 0,
    totalRevenue: bookingStats[0]?.totalRevenue || 0,
    monthlyRevenue: monthlyRevenueResult[0]?.monthlyRevenue || 0,
  };

  return { stats, recentBookings: filteredBookings };
};
