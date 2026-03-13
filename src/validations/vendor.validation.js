import Joi from 'joi';

export const createVendorValidation = {
  body: Joi.object({
    businessName: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().max(2000),
    categories: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
    businessPhone: Joi.string().trim(),
    businessEmail: Joi.string().email().trim(),
    address: Joi.object({
      street: Joi.string().trim(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim(),
      country: Joi.string().trim().default('Pakistan'),
      zipCode: Joi.string().trim(),
    }).required(),
  }),
};

export const updateVendorProfileValidation = {
  body: Joi.object({
    businessName: Joi.string().trim().min(2).max(100),
    description: Joi.string().max(2000),
    categories: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    businessPhone: Joi.string().trim(),
    businessEmail: Joi.string().email().trim(),
    website: Joi.string().trim(),
    address: Joi.object({
      street: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      country: Joi.string().trim(),
      zipCode: Joi.string().trim(),
    }),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }),
    responseTime: Joi.string().valid('within_1_hour', 'within_24_hours', 'within_48_hours'),
  }),
};
