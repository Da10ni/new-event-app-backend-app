import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND));
};
