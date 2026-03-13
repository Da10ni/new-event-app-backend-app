import Joi from 'joi';

export const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const paginationQuery = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string(),
    select: Joi.string(),
    search: Joi.string().max(200),
  }),
};

export const paramId = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

export const paramSlug = {
  params: Joi.object({
    slug: Joi.string().required(),
  }),
};
