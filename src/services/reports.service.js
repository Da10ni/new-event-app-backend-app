import User from '../models/User.model.js';
import Vendor from '../models/Vendor.model.js';
import Booking from '../models/Booking.model.js';
import Category from '../models/Category.model.js';
import { BOOKING_STATUSES, USER_ROLES, VENDOR_STATUSES } from '../constants/index.js';

const COMMISSION_RATE = 0.10; // 10% commission

const getPeriodDates = (period) => {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  let startDate;
  let months;

  switch (period) {
    case '7d':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      months = 1;
      break;
    case '30d':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      months = 1;
      break;
    case '90d':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      months = 3;
      break;
    case '6m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      months = 6;
      break;
    case '1y':
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      months = 12;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      months = 6;
  }

  return { startDate, endDate, months };
};

const getMonthLabels = (startDate, months) => {
  const labels = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < months; i++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    labels.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      monthNum: date.getMonth() + 1,
    });
  }

  return labels;
};

export const getRevenueStats = async (period) => {
  const { startDate, endDate, months } = getPeriodDates(period);
  const monthLabels = getMonthLabels(startDate, months);

  const revenueByMonth = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.COMPLETED] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalRevenue: { $sum: '$pricingSnapshot.totalAmount' },
        bookingCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const revenueMap = new Map(
    revenueByMonth.map((r) => [`${r._id.year}-${r._id.month}`, r])
  );

  const revenueData = monthLabels.map((label) => {
    const key = `${label.year}-${label.monthNum}`;
    const data = revenueMap.get(key) || { totalRevenue: 0, bookingCount: 0 };
    const revenue = data.totalRevenue;
    const commission = Math.round(revenue * COMMISSION_RATE);

    return {
      month: label.month,
      revenue,
      commission,
    };
  });

  const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0);
  const totalCommission = revenueData.reduce((sum, r) => sum + r.commission, 0);
  const totalBookings = revenueByMonth.reduce((sum, r) => sum + r.bookingCount, 0);
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  const previousPeriodStart = new Date(startDate);
  previousPeriodStart.setMonth(previousPeriodStart.getMonth() - months);
  const previousRevenue = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: previousPeriodStart, $lt: startDate },
        status: { $in: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.COMPLETED] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricingSnapshot.totalAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const prevTotal = previousRevenue[0]?.total || 0;
  const prevCount = previousRevenue[0]?.count || 0;
  const prevAvg = prevCount > 0 ? Math.round(prevTotal / prevCount) : 0;

  const revenueChange = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal * 100).toFixed(1) : 0;
  const avgChange = prevAvg > 0 ? ((avgBookingValue - prevAvg) / prevAvg * 100).toFixed(1) : 0;

  return {
    revenueData,
    summary: {
      totalRevenue,
      totalCommission,
      avgBookingValue,
      revenueChange: parseFloat(revenueChange),
      avgChange: parseFloat(avgChange),
    },
  };
};

export const getBookingStats = async (period) => {
  const { startDate, endDate, months } = getPeriodDates(period);

  const bookingsByStatus = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statusColors = {
    [BOOKING_STATUSES.CONFIRMED]: '#10B981',
    [BOOKING_STATUSES.PENDING]: '#FFB400',
    [BOOKING_STATUSES.COMPLETED]: '#8B5CF6',
    [BOOKING_STATUSES.CANCELLED]: '#B0B0B0',
    [BOOKING_STATUSES.REJECTED]: '#C13515',
    [BOOKING_STATUSES.INQUIRY]: '#3B82F6',
  };

  const statusLabels = {
    [BOOKING_STATUSES.CONFIRMED]: 'Confirmed',
    [BOOKING_STATUSES.PENDING]: 'Pending',
    [BOOKING_STATUSES.COMPLETED]: 'Completed',
    [BOOKING_STATUSES.CANCELLED]: 'Cancelled',
    [BOOKING_STATUSES.REJECTED]: 'Rejected',
    [BOOKING_STATUSES.INQUIRY]: 'Inquiry',
  };

  const byStatus = bookingsByStatus.map((b) => ({
    name: statusLabels[b._id] || b._id,
    value: b.count,
    color: statusColors[b._id] || '#B0B0B0',
  }));

  const totalBookings = byStatus.reduce((sum, b) => sum + b.value, 0);

  const bookingsByCategory = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
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
        _id: {
          categoryId: '$categoryData._id',
          categoryName: '$categoryData.name',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const categoryMap = new Map();
  bookingsByCategory.forEach((b) => {
    const categoryName = b._id.categoryName || 'Uncategorized';
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, { confirmed: 0, pending: 0, other: 0 });
    }
    const cat = categoryMap.get(categoryName);
    if (b._id.status === BOOKING_STATUSES.CONFIRMED || b._id.status === BOOKING_STATUSES.COMPLETED) {
      cat.confirmed += b.count;
    } else if (b._id.status === BOOKING_STATUSES.PENDING) {
      cat.pending += b.count;
    } else {
      cat.other += b.count;
    }
  });

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    confirmed: data.confirmed,
    pending: data.pending,
  })).sort((a, b) => (b.confirmed + b.pending) - (a.confirmed + a.pending)).slice(0, 6);

  return {
    byStatus,
    byCategory,
    totalBookings,
  };
};

export const getUserGrowthStats = async (period) => {
  const { startDate, endDate, months } = getPeriodDates(period);
  const monthLabels = getMonthLabels(startDate, months);

  const usersByMonth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        role: USER_ROLES.CLIENT,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const vendorsByMonth = await Vendor.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: VENDOR_STATUSES.APPROVED,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const usersMap = new Map(usersByMonth.map((u) => [`${u._id.year}-${u._id.month}`, u.count]));
  const vendorsMap = new Map(vendorsByMonth.map((v) => [`${v._id.year}-${v._id.month}`, v.count]));

  let cumulativeUsers = await User.countDocuments({
    createdAt: { $lt: startDate },
    role: USER_ROLES.CLIENT,
  });
  let cumulativeVendors = await Vendor.countDocuments({
    createdAt: { $lt: startDate },
    status: VENDOR_STATUSES.APPROVED,
  });

  const growthData = monthLabels.map((label) => {
    const key = `${label.year}-${label.monthNum}`;
    cumulativeUsers += usersMap.get(key) || 0;
    cumulativeVendors += vendorsMap.get(key) || 0;

    return {
      month: label.month,
      users: cumulativeUsers,
      vendors: cumulativeVendors,
    };
  });

  return { growthData };
};

export const getTopVendors = async (period, limit = 10) => {
  const { startDate, endDate } = getPeriodDates(period);

  const topVendors = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.COMPLETED] },
      },
    },
    {
      $group: {
        _id: '$vendor',
        bookings: { $sum: 1 },
        revenue: { $sum: '$pricingSnapshot.totalAmount' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'vendors',
        localField: '_id',
        foreignField: '_id',
        as: 'vendorData',
      },
    },
    { $unwind: '$vendorData' },
    {
      $project: {
        _id: 1,
        name: '$vendorData.businessName',
        bookings: 1,
        revenue: 1,
        rating: '$vendorData.averageRating',
      },
    },
  ]);

  return { vendors: topVendors };
};
