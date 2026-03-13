import { Router } from 'express';
import * as listingController from '../controllers/listing.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createListingValidation, updateListingValidation, listingQueryValidation } from '../validations/listing.validation.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.get('/', validate(listingQueryValidation), listingController.getListings);
router.get('/featured', listingController.getFeaturedListings);
router.get('/:slug', listingController.getListingBySlug);
router.get('/:id/reviews', listingController.getListingReviews);
router.post('/', authenticate, authorize(USER_ROLES.VENDOR), validate(createListingValidation), listingController.createListing);
router.patch('/:id', authenticate, authorize(USER_ROLES.VENDOR), validate(updateListingValidation), listingController.updateListing);
router.delete('/:id', authenticate, authorize(USER_ROLES.VENDOR), listingController.deleteListing);

export default router;
