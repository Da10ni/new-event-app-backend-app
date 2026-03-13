import Joi from 'joi';

export const updateProfileValidation = {
  body: Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
    phone: Joi.string().trim().min(10).max(15),
    address: Joi.object({
      street: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      country: Joi.string().trim(),
      zipCode: Joi.string().trim(),
    }),
    fcmTokens: Joi.array().items(Joi.string()),
  }),
};
