import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/AppError';

/**
 * Authorization middleware to prevent IDOR (Insecure Direct Object Reference) vulnerabilities.
 * Ensures the authenticated user can only access their own resources.
 */

/**
 * Verifies that the user_id in the request body matches the authenticated user's ID.
 * Use for POST/PUT requests where user_id is in the body.
 */
export const authorizeBodyUserId = (req: Request, res: Response, next: NextFunction) => {
  const authenticatedUserId = req.user?.user_id;
  const requestedUserId = req.body?.user_id;

  if (!authenticatedUserId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    console.warn(`[SECURITY] IDOR attempt: User ${authenticatedUserId} tried to access user ${requestedUserId}'s resources`);
    return res.status(403).json({
      success: false,
      error: { message: 'You can only access your own resources' }
    });
  }

  next();
};

/**
 * Verifies that the user_id in query params matches the authenticated user's ID.
 * Use for GET requests where user_id is in query string.
 */
export const authorizeQueryUserId = (req: Request, res: Response, next: NextFunction) => {
  const authenticatedUserId = req.user?.user_id;
  const requestedUserId = req.query?.user_id ? parseInt(req.query.user_id as string) : undefined;

  if (!authenticatedUserId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    console.warn(`[SECURITY] IDOR attempt: User ${authenticatedUserId} tried to access user ${requestedUserId}'s resources`);
    return res.status(403).json({
      success: false,
      error: { message: 'You can only access your own resources' }
    });
  }

  next();
};

/**
 * Helper function to check ownership in controller methods.
 * Use when authorization middleware can't be used (e.g., complex logic).
 * @throws ForbiddenError if user doesn't own the resource
 */
export const verifyOwnership = (
  authenticatedUserId: number | undefined, 
  resourceUserId: number,
  resourceName: string = 'resource'
): void => {
  if (!authenticatedUserId) {
    throw new ForbiddenError('Authentication required');
  }
  
  if (authenticatedUserId !== resourceUserId) {
    console.warn(`[SECURITY] IDOR attempt: User ${authenticatedUserId} tried to access user ${resourceUserId}'s ${resourceName}`);
    throw new ForbiddenError(`You can only access your own ${resourceName}`);
  }
};

/**
 * Injects the authenticated user's ID into the request body.
 * This ensures the user_id always comes from the token, not user input.
 * Use this middleware before validation to enforce ownership.
 */
export const injectAuthenticatedUserId = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.user_id) {
    // Override any user_id in body with the authenticated user's ID
    req.body.user_id = req.user.user_id;
  }
  next();
};

/**
 * Same as injectAuthenticatedUserId but for query params.
 */
export const injectAuthenticatedUserIdToQuery = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.user_id) {
    // Override any user_id in query with the authenticated user's ID
    req.query.user_id = String(req.user.user_id);
  }
  next();
};
