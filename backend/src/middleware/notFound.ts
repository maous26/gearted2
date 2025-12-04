import { NextFunction, Request, Response } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[404 Handler] Method: ${req.method}, URL: ${req.originalUrl}, Path: ${req.path}`);
  console.log(`[404 Handler] Headers:`, JSON.stringify(req.headers, null, 2));
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404
    }
  });
};