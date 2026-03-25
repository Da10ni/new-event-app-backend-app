import { Router } from 'express';
import * as reviewController from '../../controllers/admin/admin.review.controller.js';

const router = Router();
router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReviewById);
router.delete('/:id', reviewController.deleteReview);
router.patch('/:id/visibility', reviewController.toggleVisibility);
export default router;
