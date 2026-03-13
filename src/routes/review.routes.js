import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReviewValidation, updateReviewValidation, vendorReplyValidation } from '../validations/review.validation.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.post('/', authenticate, authorize(USER_ROLES.CLIENT), validate(createReviewValidation), reviewController.createReview);
router.patch('/:id', authenticate, authorize(USER_ROLES.CLIENT), validate(updateReviewValidation), reviewController.updateReview);
router.delete('/:id', authenticate, authorize(USER_ROLES.CLIENT), reviewController.deleteReview);
router.post('/:id/reply', authenticate, authorize(USER_ROLES.VENDOR), validate(vendorReplyValidation), reviewController.addVendorReply);

export default router;
