import Joi from 'joi';

export const createBookingValidation = {
  body: Joi.object({
    listing: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    eventDate: Joi.date().iso().min('now').required(),
    eventEndDate: Joi.date().iso().min(Joi.ref('eventDate')),
    eventType: Joi.string().trim().max(100),
    guestCount: Joi.number().integer().min(1),
    timeSlot: Joi.object({
      startTime: Joi.string(),
      endTime: Joi.string(),
    }),
    packageName: Joi.string(),
    clientMessage: Joi.string().max(2000),
    specialRequests: Joi.string().max(2000),
  }),
};

export const updateBookingStatusValidation = {
  body: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'rejected').required(),
    vendorResponse: Joi.string().max(2000),
  }),
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
};

export const cancelBookingValidation = {
  body: Joi.object({
    cancellationReason: Joi.string().max(1000).required(),
  }),
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
};
