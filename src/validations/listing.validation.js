import Joi from 'joi';

export const createListingValidation = {
  body: Joi.object({
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    title: Joi.string().trim().min(5).max(150).required(),
    description: Joi.string().trim().min(20).max(5000).required(),
    pricing: Joi.object({
      basePrice: Joi.number().min(0).required(),
      currency: Joi.string().default('PKR'),
      priceUnit: Joi.string().valid('per_event', 'per_day', 'per_night', 'per_hour', 'per_person', 'per_plate', 'package').default('per_event'),
      maxPrice: Joi.number().min(0),
      packages: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          description: Joi.string(),
          price: Joi.number().min(0).required(),
          includes: Joi.array().items(Joi.string()),
        })
      ),
    }).required(),
    capacity: Joi.object({
      min: Joi.number().min(0).default(0),
      max: Joi.number().min(0).default(0),
    }),
    address: Joi.object({
      street: Joi.string().trim(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim(),
      country: Joi.string().trim().default('Pakistan'),
      zipCode: Joi.string().trim(),
      area: Joi.string().trim(),
    }).required(),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().required(),
        caption: Joi.string().max(200).allow(''),
        isPrimary: Joi.boolean().default(false),
      })
    ),
    amenities: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    attributes: Joi.object(),
  }),
};

export const updateListingValidation = {
  body: Joi.object({
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    title: Joi.string().trim().min(5).max(150),
    description: Joi.string().trim().min(20).max(5000),
    pricing: Joi.object({
      basePrice: Joi.number().min(0),
      currency: Joi.string(),
      priceUnit: Joi.string().valid('per_event', 'per_day', 'per_night', 'per_hour', 'per_person', 'per_plate', 'package'),
      maxPrice: Joi.number().min(0),
      packages: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          description: Joi.string().allow(''),
          price: Joi.number().min(0).required(),
          includes: Joi.array().items(Joi.string()),
        })
      ),
    }),
    capacity: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().min(0),
    }),
    address: Joi.object({
      street: Joi.string().trim().allow(''),
      city: Joi.string().trim(),
      state: Joi.string().trim().allow(''),
      country: Joi.string().trim(),
      zipCode: Joi.string().trim().allow(''),
      area: Joi.string().trim().allow(''),
    }),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().required(),
        caption: Joi.string().max(200).allow(''),
        isPrimary: Joi.boolean().default(false),
      })
    ),
    amenities: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    attributes: Joi.object(),
  }),
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
};

export const listingQueryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string(),
    select: Joi.string(),
    search: Joi.string().max(200),
    category: Joi.string(),
    city: Joi.string(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    minCapacity: Joi.number().min(0),
    maxCapacity: Joi.number().min(0),
    rating: Joi.number().min(1).max(5),
    status: Joi.string(),
    near: Joi.string(),
    maxDistance: Joi.number().min(0),
  }),
};
