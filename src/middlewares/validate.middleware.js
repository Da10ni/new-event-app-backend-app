import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';
import { logger } from '../utils/logger.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    ['body', 'query', 'params'].forEach((key) => {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          const errors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, ''),
          }));
          validationErrors.push(...errors);
        } else if (key === 'query') {
          // Express 5: req.query is read-only, mutate in-place
          for (const k of Object.keys(req.query)) {
            if (!(k in value)) delete req.query[k];
          }
          Object.assign(req.query, value);
        } else {
          req[key] = value;
        }
      }
    });

    if (validationErrors.length > 0) {
      logger.warn('Validation errors', { url: req.originalUrl, errors: validationErrors });
      const error = new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST);
      error.errors = validationErrors;
      return next(error);
    }

    next();
  };
};
