/**
 * MongoDB query injection sanitizer compatible with Express 5.
 * Express 5 makes req.query a read-only getter, so we cannot reassign it.
 * Instead, we sanitize req.body and req.params (which are still writable)
 * and sanitize query values in-place on the object properties.
 */

const MONGO_OPERATORS = /^\$|\.(?=\$)/;

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    if (MONGO_OPERATORS.test(key)) {
      delete obj[key];
    } else {
      obj[key] = sanitizeValue(obj[key]);
    }
  }
  return obj;
}

export const sanitize = (req, _res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);

  // For Express 5, req.query is read-only but its properties can be mutated
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (MONGO_OPERATORS.test(key)) {
        delete req.query[key];
      }
    }
  }

  next();
};
