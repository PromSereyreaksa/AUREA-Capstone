import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { ResponseHelper } from '../../shared/utils/responseHelper';
import { PricingProfileRepository } from '../../infrastructure/repositories/PricingProfileRepository';
import { GetDashboardData } from '../../application/use_cases/GetDashboardData';

interface AuthenticatedRequest extends Request {
  user?: { user_id: number; email: string };
}

// Repository & use-case instances (module-level, same pattern as ProfileController)
const pricingProfileRepo = new PricingProfileRepository();
const getDashboardData = new GetDashboardData(pricingProfileRepo);

/**
 * GET /api/v{0,1}/dashboard
 * Returns the authenticated user's base rate, project counts, and recent projects.
 */
export const getDashboardController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user_id } = req.user as any;

  const data = await getDashboardData.execute(user_id);

  return ResponseHelper.success(res, data, 'Dashboard data retrieved successfully');
});

/**
 * GET /api/v{0,1}/dashboard/history
 * Returns paginated history for the authenticated user.
 */
export const getDashboardHistoryController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user_id } = req.user as any;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Number(req.query.limit || 20));

  const data = await getDashboardData.executeHistory(user_id, page, limit);

  return ResponseHelper.success(res, data, 'Dashboard history retrieved successfully');
});
