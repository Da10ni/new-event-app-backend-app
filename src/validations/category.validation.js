import Joi from 'joi';

export const createCategoryValidation = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().max(500),
    parentCategory: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    sortOrder: Joi.number().integer().min(0),
  }),
};

export const updateCategoryValidation = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().max(500),
    parentCategory: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }),
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
};
