import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { USER_ROLES } from '../../constants/index.js';
import adminDashboardRoutes from './admin.dashboard.routes.js';
import adminUserRoutes from './admin.user.routes.js';
import adminVendorRoutes from './admin.vendor.routes.js';
import adminListingRoutes from './admin.listing.routes.js';
import adminBookingRoutes from './admin.booking.routes.js';
import adminCategoryRoutes from './admin.category.routes.js';
import adminReportsRoutes from './admin.reports.routes.js';
import adminReviewRoutes from './admin.review.routes.js';

const router = Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN));

router.use('/dashboard', adminDashboardRoutes);
router.use('/users', adminUserRoutes);
router.use('/vendors', adminVendorRoutes);
router.use('/listings', adminListingRoutes);
router.use('/bookings', adminBookingRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/reports', adminReportsRoutes);
router.use('/reviews', adminReviewRoutes);

export default router;
