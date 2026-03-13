import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createBookingValidation, updateBookingStatusValidation, cancelBookingValidation } from '../validations/booking.validation.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(USER_ROLES.CLIENT, USER_ROLES.VENDOR), validate(createBookingValidation), bookingController.createBooking);
router.get('/my', authorize(USER_ROLES.CLIENT, USER_ROLES.VENDOR), bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/status', authorize(USER_ROLES.VENDOR), validate(updateBookingStatusValidation), bookingController.updateBookingStatus);
router.patch('/:id/cancel', validate(cancelBookingValidation), bookingController.cancelBooking);
router.patch('/:id/complete', authorize(USER_ROLES.VENDOR), bookingController.completeBooking);

export default router;
