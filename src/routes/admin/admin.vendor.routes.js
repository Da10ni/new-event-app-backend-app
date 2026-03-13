import { Router } from 'express';
import * as vendorController from '../../controllers/admin/admin.vendor.controller.js';

const router = Router();
router.get('/', vendorController.getVendors);
router.get('/:id', vendorController.getVendorById);
router.patch('/:id/approve', vendorController.approveVendor);
router.patch('/:id/reject', vendorController.rejectVendor);
router.patch('/:id/suspend', vendorController.suspendVendor);
export default router;
