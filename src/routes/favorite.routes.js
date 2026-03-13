import { Router } from 'express';
import * as favoriteController from '../controllers/favorite.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', favoriteController.addFavorite);
router.get('/', favoriteController.getFavorites);
router.get('/:listingId/check', favoriteController.checkFavorite);
router.delete('/:listingId', favoriteController.removeFavorite);

export default router;
