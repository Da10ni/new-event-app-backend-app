import { Router } from 'express';
import * as reportsController from '../../controllers/admin/admin.reports.controller.js';

const router = Router();

router.get('/', reportsController.getAllReportsData);
router.get('/revenue', reportsController.getRevenueStats);
router.get('/bookings', reportsController.getBookingStats);
router.get('/user-growth', reportsController.getUserGrowthStats);
router.get('/top-vendors', reportsController.getTopVendors);

export default router;
