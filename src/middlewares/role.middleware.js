import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(MESSAGES.AUTH.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(MESSAGES.AUTH.FORBIDDEN, HTTP_STATUS.FORBIDDEN));
    }

    next();
  };
};
