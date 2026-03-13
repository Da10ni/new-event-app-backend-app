import User from '../models/User.model.js';
import Vendor from '../models/Vendor.model.js';
import Listing from '../models/Listing.model.js';
import Booking from '../models/Booking.model.js';
import Category from '../models/Category.model.js';
import Review from '../models/Review.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES, VENDOR_STATUSES, LISTING_STATUSES, BOOKING_STATUSES } from '../constants/index.js';
import { ApiFeatures } from '../utils/apiFeatures.js';

export const getDashboardStats = async () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalVendors,
    totalListings,
    totalBookings,
    pendingVendors,
    pendingListings,
    recentBookings,
    pendingVendorsList,
    pendingListingsList,
    revenueByMonth,
    bookingsByCategory,
    usersLastMonth,
    usersThisMonth,
    vendorsLastMonth,
    vendorsThisMonth,
    bookingsLastMonth,
    bookingsThisMonth,
    totalRevenue,
    lastMonthRevenue,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Vendor.countDocuments({ status: VENDOR_STATUSES.APPROVED }),
    Listing.countDocuments({ status: LISTING_STATUSES.ACTIVE }),
    Booking.countDocuments(),
    Vendor.countDocuments({ status: VENDOR_STATUSES.PENDING }),
    Listing.countDocuments({ status: LISTING_STATUSES.DRAFT }),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('client', 'firstName lastName email')
      .populate('listing', 'title slug')
      .populate('vendor', 'businessName'),
    Vendor.find({ status: VENDOR_STATUSES.PENDING })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName email phone'),
    Listing.find({ status: LISTING_STATUSES.DRAFT })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vendor', 'businessName businessSlug')
      .populate('category', 'name slug'),
    Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.COMPLETED] },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$pricingSnapshot.totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
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
        $lookup: {
          from: 'categories',
          localField: 'listingData.category',
          foreignField: '_id',
          as: 'categoryData',
        },
      },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryData.name',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    User.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth }, isActive: true }),
    User.countDocuments({ createdAt: { $gte: thisMonth }, isActive: true }),
    Vendor.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth }, status: VENDOR_STATUSES.APPROVED }),
    Vendor.countDocuments({ createdAt: { $gte: thisMonth }, status: VENDOR_STATUSES.APPROVED }),
    Booking.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
    Booking.countDocuments({ createdAt: { $gte: thisMonth } }),
    Booking.aggregate([
      { $match: { status: { $in: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.COMPLETED] } } },
      { $group: { _id: null, total: { $sum: '$pricingSnapshot.totalAmount' } } },
    ]),
    Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth, $lt: thisMonth },
          status: { $in: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.COMPLETED] },
        },
      },
      { $group: { _id: null, total: { $sum: '$pricingSnapshot.totalAmount' } } },
    ]),
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    const monthData = revenueByMonth.find(
      (r) => r._id.year === date.getFullYear() && r._id.month === date.getMonth() + 1
    );
    revenueData.push({
      month: monthNames[date.getMonth()],
      revenue: monthData?.revenue || 0,
      bookings: monthData?.bookings || 0,
    });
  }

  const categoryData = bookingsByCategory.map((cat) => ({
    category: cat._id || 'Uncategorized',
    count: cat.count,
  }));

  const usersTrend = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1) : 0;
  const vendorsTrend = vendorsLastMonth > 0 ? ((vendorsThisMonth - vendorsLastMonth) / vendorsLastMonth * 100).toFixed(1) : 0;
  const bookingsTrend = bookingsLastMonth > 0 ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth * 100).toFixed(1) : 0;

  const currentRevenue = totalRevenue[0]?.total || 0;
  const prevRevenue = lastMonthRevenue[0]?.total || 0;
  const revenueTrend = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;

  return {
    totalUsers,
    totalVendors,
    totalListings,
    totalBookings,
    pendingVendors,
    pendingListings,
    totalRevenue: currentRevenue,
    recentBookings,
    pendingVendorsList,
    pendingListingsList,
    revenueData,
    bookingsByCategory: categoryData,
    trends: {
      users: parseFloat(usersTrend),
      vendors: parseFloat(vendorsTrend),
      bookings: parseFloat(bookingsTrend),
      revenue: parseFloat(revenueTrend),
    },
  };
};

export const getAdminUsers = async (queryString) => {
  const features = new ApiFeatures(User.find(), queryString).filter().sort().paginate();
  await features.countDocuments();
  const users = await features.query;
  return { users, meta: features.getMeta() };
};

export const toggleUserStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  user.isActive = !user.isActive;
  await user.save();
  return user;
};

export const getAdminVendorById = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId)
    .populate('userId', 'firstName lastName email phone')
    .populate('categories', 'name slug');
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return vendor;
};

export const getAdminVendors = async (queryString) => {
  const features = new ApiFeatures(
    Vendor.find().populate('userId', 'firstName lastName email phone').populate('categories', 'name slug'),
    queryString
  ).filter().sort().paginate();
  await features.countDocuments();
  const vendors = await features.query;
  return { vendors, meta: features.getMeta() };
};

export const approveVendor = async (vendorId, adminId) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    { status: VENDOR_STATUSES.APPROVED, approvedAt: new Date(), approvedBy: adminId },
    { new: true }
  ).populate('userId', 'firstName lastName email phone').populate('categories', 'name slug');
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return vendor;
};

export const rejectVendor = async (vendorId, reason) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    { status: VENDOR_STATUSES.REJECTED, rejectionReason: reason },
    { new: true }
  ).populate('userId', 'firstName lastName email phone').populate('categories', 'name slug');
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return vendor;
};

export const suspendVendor = async (vendorId) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    { status: VENDOR_STATUSES.SUSPENDED },
    { new: true }
  ).populate('userId', 'firstName lastName email phone').populate('categories', 'name slug');
  if (!vendor) throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return vendor;
};

export const getAdminListings = async (queryString) => {
  const features = new ApiFeatures(
    Listing.find().populate('vendor', 'businessName businessSlug').populate('category', 'name slug'),
    queryString
  ).filter().sort().paginate();
  await features.countDocuments();
  const listings = await features.query;
  return { listings, meta: features.getMeta() };
};

export const approveListing = async (listingId) => {
  const listing = await Listing.findByIdAndUpdate(
    listingId,
    { status: LISTING_STATUSES.ACTIVE },
    { new: true }
  );
  if (!listing) throw new AppError(MESSAGES.LISTING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return listing;
};

export const rejectListing = async (listingId, reason) => {
  const listing = await Listing.findByIdAndUpdate(
    listingId,
    { status: LISTING_STATUSES.INACTIVE },
    { new: true }
  );
  if (!listing) throw new AppError(MESSAGES.LISTING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return listing;
};

export const toggleListingFeatured = async (listingId) => {
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(MESSAGES.LISTING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  listing.isFeatured = !listing.isFeatured;
  await listing.save();
  return listing;
};

export const getAdminBookings = async (queryString) => {
  const features = new ApiFeatures(
    Booking.find()
      .populate('client', 'firstName lastName email')
      .populate('listing', 'title slug')
      .populate('vendor', 'businessName'),
    queryString
  ).filter().sort().paginate();
  await features.countDocuments();
  const bookings = await features.query;
  return { bookings, meta: features.getMeta() };
};
