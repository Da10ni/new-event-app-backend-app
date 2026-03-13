import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileValidation } from '../validations/user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getProfile);
router.patch('/me', validate(updateProfileValidation), userController.updateProfile);
router.delete('/me', userController.deleteAccount);

export default router;
