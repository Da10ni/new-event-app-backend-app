import { Router } from 'express';
import * as userController from '../../controllers/admin/admin.user.controller.js';

const router = Router();
router.get('/', userController.getUsers);
router.patch('/:id/status', userController.toggleUserStatus);
export default router;
