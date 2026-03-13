import { verifyAccessToken } from '../utils/generateToken.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import User from '../models/User.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(MESSAGES.AUTH.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated.', HTTP_STATUS.FORBIDDEN);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(MESSAGES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(MESSAGES.AUTH.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED));
    }
    next(error);
  }
};
