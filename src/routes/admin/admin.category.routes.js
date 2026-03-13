import { Router } from 'express';
import * as categoryController from '../../controllers/admin/admin.category.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCategoryValidation, updateCategoryValidation } from '../../validations/category.validation.js';

const router = Router();
router.post('/', validate(createCategoryValidation), categoryController.createCategory);
router.patch('/:id', validate(updateCategoryValidation), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
export default router;
