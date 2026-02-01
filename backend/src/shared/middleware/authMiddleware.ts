import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../../infrastructure/services/JwtService';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided. Authorization header required.' });
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid token format. Use: Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = JwtService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error: any) {
    console.warn('[Auth] Authentication failed:', error.message);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

// Optional: Middleware that doesn't fail if no token, just attaches user if present
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = JwtService.verifyToken(token);
      
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

export const conditionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pathParts = req.baseUrl.split('/');
  const isV1 = pathParts.includes('v1');

  if (isV1) {
    // Apply authentication for v1 routes (required)
    authMiddleware(req, res, next);
  } else {
    // Skip authentication for v0 routes (optional)
    next();
  }
};
