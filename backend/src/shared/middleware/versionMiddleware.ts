import { Request, Response, NextFunction } from 'express';

// Middleware to track API version usage and add version headers to responses
export const versionMiddleware = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add version to request for logging/tracking
    (req as any).apiVersion = version;
    
    // Add version header to response
    res.setHeader('X-API-Version', version);
    
    // Add deprecation warning for v0
    if (version === 'v0') {
      res.setHeader('X-API-Deprecated', 'true');
      res.setHeader('X-API-Deprecation-Info', 'This version is deprecated. Please migrate to v1');
    }
    
    next();
  };
};

// Middleware to restrict v0 API access to localhost/development only (v0 for devs, v1 for public)
export const restrictV0ToLocalhost = (req: Request, res: Response, next: NextFunction) => {
  const apiVersion = (req as any).apiVersion;
  
  // Only restrict v0 and v0-legacy
  if (apiVersion === 'v0' || apiVersion === 'v0-legacy') {
    const ip = req.ip || req.socket.remoteAddress || '';
    const isLocalhost = 
      ip === '127.0.0.1' || 
      ip === '::1' || 
      ip === '::ffff:127.0.0.1' ||
      ip.includes('localhost');
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Allow v0 only for localhost OR development environment
    if (!isLocalhost && !isDevelopment) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'v0 API is restricted to localhost/development only. Please use /api/v1 endpoints.',
          code: 'V0_ACCESS_RESTRICTED',
          hint: 'Use /api/v1 endpoints for public access'
        }
      });
    }
    
    // Log v0 usage for developers
    console.log(`[DEV] v0 API accessed from ${ip} - Path: ${req.method} ${req.path}`);
  }
  
  next();
};

// Middleware to check if client is using the latest API version
export const versionCheck = (req: Request, res: Response, next: NextFunction) => {
  const requestedVersion = (req as any).apiVersion || 'unknown';
  const latestVersion = 'v1';
  
  if (requestedVersion !== latestVersion && requestedVersion !== 'unknown') {
    console.warn(`Client using outdated API version: ${requestedVersion}. Latest: ${latestVersion}`);
  }
  
  next();
};

