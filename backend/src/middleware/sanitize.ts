import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize string values to prevent XSS attacks
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Sanitize HTML content
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [], // Remove all HTML tags
      ALLOWED_ATTR: []  // Remove all attributes
    }).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const sanitized: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitized[key] = sanitizeValue(value[key]);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Sanitize specific fields in request body
 */
export const sanitizeFields = (...fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field]) {
          req.body[field] = sanitizeValue(req.body[field]);
        }
      });
    }
    next();
  };
};
