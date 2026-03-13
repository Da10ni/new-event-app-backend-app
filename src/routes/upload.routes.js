import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware.js';
import { uploadLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/image', uploadLimiter, uploadSingle('image'), uploadController.uploadImage);
router.post('/images', uploadLimiter, uploadMultiple('images', 10), uploadController.uploadImages);
router.delete('/image', uploadController.deleteImage);

export default router;
