import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { ResponseHelper } from '../../shared/utils/responseHelper';
import { PricingProfileRepository } from '../../infrastructure/repositories/PricingProfileRepository';
import { GetDashboardData } from '../../application/use_cases/GetDashboardData';

// Repository & use-case instances (module-level, same pattern as ProfileController)
const pricingProfileRepo = new PricingProfileRepository();
const getDashboardData = new GetDashboardData(pricingProfileRepo);

/**
 * GET /api/v{0,1}/dashboard
 * Returns the authenticated user's base rate, project counts, and recent projects.
 */
export const getDashboardController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;

  const data = await getDashboardData.execute(user_id);

  return ResponseHelper.success(res, data, 'Dashboard data retrieved successfully');
});
