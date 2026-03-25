import { Router } from 'express';
import * as listingController from '../../controllers/admin/admin.listing.controller.js';

const router = Router();
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);
router.patch('/:id/approve', listingController.approveListing);
router.patch('/:id/reject', listingController.rejectListing);
router.patch('/:id/feature', listingController.toggleFeatured);
export default router;
