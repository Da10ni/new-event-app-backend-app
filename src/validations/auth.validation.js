import Joi from 'joi';

export const registerValidation = {
  body: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().trim().min(10).max(15).required(),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('client', 'vendor'),
  }),
};

export const vendorRegisterValidation = {
  body: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().trim().min(10).max(15).required(),
    password: Joi.string().min(8).max(128).required(),
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

export const loginValidation = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),
};

export const refreshTokenValidation = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

export const forgotPasswordValidation = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
  }),
};

export const resetPasswordValidation = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
};

export const verifyEmailValidation = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().length(6).required(),
  }),
};

export const changePasswordValidation = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
};
