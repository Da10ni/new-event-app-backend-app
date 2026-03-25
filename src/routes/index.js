import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import vendorRoutes from './vendor.routes.js';
import listingRoutes from './listing.routes.js';
import categoryRoutes from './category.routes.js';
import bookingRoutes from './booking.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import uploadRoutes from './upload.routes.js';
import favoriteRoutes from './favorite.routes.js';
import paymentRoutes from './payment.routes.js';
import messageRoutes from './message.routes.js';
import adminRoutes from './admin/index.js';

const router = Router();

router.use('/payments', paymentRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/listings', listingRoutes);
router.use('/categories', categoryRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);

export default router;
