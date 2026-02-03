import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting Middleware
 * Implements sliding window rate limiting without external dependencies.
 * Critical for protecting AI endpoints from abuse and controlling costs.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  message?: string;     // Custom error message
  keyGenerator?: (req: Request) => string;  // Custom key generator
  skipFailedRequests?: boolean;  // Don't count failed requests
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
}

// In-memory stores for different rate limit types
const stores: { [limiterId: string]: RateLimitStore } = {};

// Cleanup old entries periodically
const cleanupInterval = 60000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const limiterId of Object.keys(stores)) {
    const store = stores[limiterId];
    for (const key of Object.keys(store)) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }
}, cleanupInterval);

/**
 * Creates a rate limiter middleware with the specified configuration.
 */
function createRateLimiter(limiterId: string, config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => req.ip || req.user?.user_id?.toString() || 'anonymous',
    skipFailedRequests = false,
    skipSuccessfulRequests = false
  } = config;

  // Initialize store for this limiter
  if (!stores[limiterId]) {
    stores[limiterId] = {};
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const store = stores[limiterId];
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    const record = store[key];
    
    // Check if limit exceeded
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      console.warn(`[RATE_LIMIT] ${limiterId}: User ${key} exceeded limit (${record.count}/${maxRequests})`);
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', record.resetTime.toString());
      
      return res.status(429).json({
        success: false,
        error: {
          message,
          retryAfter
        }
      });
    }

    // Increment counter
    record.count++;

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    // Handle skip options on response finish
    if (skipFailedRequests || skipSuccessfulRequests) {
      res.on('finish', () => {
        const statusCode = res.statusCode;
        if (skipFailedRequests && statusCode >= 400) {
          record.count = Math.max(0, record.count - 1);
        }
        if (skipSuccessfulRequests && statusCode < 400) {
          record.count = Math.max(0, record.count - 1);
        }
      });
    }

    next();
  };
}

// ==================== Pre-configured Rate Limiters ====================

/**
 * Standard API rate limiter
 * 100 requests per minute per user
 */
export const standardLimiter = createRateLimiter('standard', {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,
  message: 'Too many requests. Please try again in a minute.',
  keyGenerator: (req) => req.user?.user_id?.toString() || req.ip || 'anonymous'
});

/**
 * Strict rate limiter for AI/expensive endpoints
 * 5 requests per minute per user
 * This protects against API cost abuse and ensures fair usage
 */
export const aiEndpointLimiter = createRateLimiter('ai-endpoint', {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 5,
  message: 'AI estimation limit reached. Please wait before making another request (max 5/minute).',
  keyGenerator: (req) => req.user?.user_id?.toString() || req.ip || 'anonymous'
});

/**
 * Authentication endpoint limiter
 * 10 requests per 15 minutes per IP
 * Protects against brute force attacks
 */
export const authLimiter = createRateLimiter('auth', {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => req.ip || 'anonymous',
  skipSuccessfulRequests: false
});

/**
 * Profile update limiter
 * 20 requests per minute per user
 */
export const profileLimiter = createRateLimiter('profile', {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 20,
  message: 'Too many profile updates. Please wait before trying again.',
  keyGenerator: (req) => req.user?.user_id?.toString() || req.ip || 'anonymous'
});

/**
 * Calculation endpoint limiter
 * 30 requests per minute per user
 */
export const calculationLimiter = createRateLimiter('calculation', {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 30,
  message: 'Too many calculation requests. Please wait before trying again.',
  keyGenerator: (req) => req.user?.user_id?.toString() || req.ip || 'anonymous'
});

/**
 * Global fallback limiter
 * Applied at the app level as a safety net
 * 1000 requests per minute per IP
 */
export const globalLimiter = createRateLimiter('global', {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 1000,
  message: 'Server is busy. Please try again later.',
  keyGenerator: (req) => req.ip || 'anonymous'
});

/**
 * Factory function to create custom rate limiters
 */
export const createCustomLimiter = createRateLimiter;

export default {
  standardLimiter,
  aiEndpointLimiter,
  authLimiter,
  profileLimiter,
  calculationLimiter,
  globalLimiter,
  createCustomLimiter
};
