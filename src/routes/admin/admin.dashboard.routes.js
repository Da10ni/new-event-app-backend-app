import { Router } from 'express';
import * as dashboardController from '../../controllers/admin/admin.dashboard.controller.js';

const router = Router();
router.get('/stats', dashboardController.getDashboardStats);
export default router;
