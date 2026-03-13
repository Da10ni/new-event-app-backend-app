import Joi from 'joi';

export const createReviewValidation = {
  body: Joi.object({
    booking: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().trim().max(100),
    comment: Joi.string().trim().min(10).max(2000).required(),
    detailedRatings: Joi.object({
      quality: Joi.number().min(1).max(5),
      communication: Joi.number().min(1).max(5),
      valueForMoney: Joi.number().min(1).max(5),
      punctuality: Joi.number().min(1).max(5),
    }),
  }),
};

export const updateReviewValidation = {
  body: Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    title: Joi.string().trim().max(100),
    comment: Joi.string().trim().min(10).max(2000),
    detailedRatings: Joi.object({
      quality: Joi.number().min(1).max(5),
      communication: Joi.number().min(1).max(5),
      valueForMoney: Joi.number().min(1).max(5),
      punctuality: Joi.number().min(1).max(5),
    }),
  }),
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
};

export const vendorReplyValidation = {
  body: Joi.object({
    comment: Joi.string().trim().min(2).max(1000).required(),
  }),
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
};
