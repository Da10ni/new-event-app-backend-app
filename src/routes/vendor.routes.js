import { Router } from 'express';
import * as vendorController from '../controllers/vendor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createVendorValidation, updateVendorProfileValidation } from '../validations/vendor.validation.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.get('/', vendorController.getVendors);
router.post('/', authenticate, authorize(USER_ROLES.CLIENT, USER_ROLES.VENDOR, USER_ROLES.ADMIN), validate(createVendorValidation), vendorController.createVendor);
router.get('/me/profile', authenticate, authorize(USER_ROLES.VENDOR), vendorController.getMyProfile);
router.patch('/me/profile', authenticate, authorize(USER_ROLES.VENDOR), validate(updateVendorProfileValidation), vendorController.updateMyProfile);
router.patch('/me/availability', authenticate, authorize(USER_ROLES.VENDOR), vendorController.toggleAvailability);
router.get('/me/listings', authenticate, authorize(USER_ROLES.VENDOR), vendorController.getMyListings);
router.get('/me/bookings', authenticate, authorize(USER_ROLES.VENDOR), vendorController.getMyBookings);
router.get('/me/dashboard', authenticate, authorize(USER_ROLES.VENDOR), vendorController.getMyDashboard);
router.get('/:slug', vendorController.getVendorBySlug);

export default router;
