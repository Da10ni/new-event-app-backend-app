import { logger } from '../utils/logger.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  let message = err.message || MESSAGES.GENERAL.SERVER_ERROR;
  let errors = err.errors || undefined;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = MESSAGES.GENERAL.VALIDATION_ERROR;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}. Please use another value.`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = MESSAGES.AUTH.TOKEN_INVALID;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = MESSAGES.AUTH.TOKEN_EXPIRED;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = MESSAGES.UPLOAD.TOO_LARGE;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Unexpected file field.';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, { stack: err.stack, url: req.originalUrl });
  } else {
    logger.warn(`${statusCode} - ${message}`, { url: req.originalUrl });
  }

  const response = { success: false, message };
  if (errors) response.errors = errors;
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
