import { NextFunction, Request, Response } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  // Skip 404 for AdminJS routes - they're handled by AdminJS router
  if (req.path.startsWith('/admin')) {
    return next();
  }

  console.log(`[404 Handler] Method: ${req.method}, URL: ${req.originalUrl}, Path: ${req.path}`);
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404
    }
  });
};