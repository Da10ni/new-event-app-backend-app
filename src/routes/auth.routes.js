import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerValidation,
  vendorRegisterValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  changePasswordValidation,
} from '../validations/auth.validation.js';

const router = Router();

// Public routes
router.post('/register', validate(registerValidation), authController.register);
router.post('/register/vendor', validate(vendorRegisterValidation), authController.registerVendor);
router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);
router.post('/logout', validate(refreshTokenValidation), authController.logout);
router.post('/forgot-password', validate(forgotPasswordValidation), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), authController.resetPassword);
router.post('/verify-email', validate(verifyEmailValidation), authController.verifyEmail);

// Protected routes
router.post('/change-password', authenticate, validate(changePasswordValidation), authController.changePassword);

export default router;
