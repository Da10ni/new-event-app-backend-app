import Joi from 'joi';

export const createPaymentIntentValidation = Joi.object({
  bookingId: Joi.string().required().messages({
    'string.empty': 'Booking ID is required.',
    'any.required': 'Booking ID is required.',
  }),
});