import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { type: err.name })
      }
    });
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
      LIMIT_PART_COUNT: 'Too many parts',
      LIMIT_FIELD_KEY: 'Field name too long',
      LIMIT_FIELD_VALUE: 'Field value too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
      LIMIT_FILE_COUNT: 'Too many files'
    };
    return res.status(400).json({
      success: false,
      error: {
        message: messages[err.code] || `File upload error: ${err.message}`
      }
    });
  }

  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid JSON in request body' }
    });
  }

  // Handle database constraint errors (Supabase/PostgreSQL)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: { message: 'Referenced record does not exist' }
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { message: 'Record already exists' }
    });
  }

  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        details: err.toString(),
        stack: err.stack 
      })
    }
  });
};
