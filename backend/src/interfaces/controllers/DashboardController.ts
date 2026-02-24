import { Request, Response } from 'express';
import { DashboardRepository } from '../../infrastructure/repositories/DashboardRepository';
import { GetDashboardSummary } from '../../application/use_cases/GetDashboardSummary';
import { ResponseHelper } from '../../shared/utils/responseHelper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

const dashboardRepository = new DashboardRepository();
const dashboardUseCase = new GetDashboardSummary(dashboardRepository);

/** GET /dashboard — full aggregated dashboard data */
export const getDashboardController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.user_id;
  if (!userId) return ResponseHelper.error(res, 'Unauthorized', 401);

  const result = await dashboardUseCase.execute({ user_id: userId });
  return ResponseHelper.success(res, result, 'Dashboard data retrieved successfully');
});

/** GET /dashboard/stats — lightweight stats only (total projects, base rate, completeness) */
export const getDashboardStatsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.user_id;
  if (!userId) return ResponseHelper.error(res, 'Unauthorized', 401);

  const result = await dashboardUseCase.getStats({ user_id: userId });
  return ResponseHelper.success(res, result, 'Dashboard stats retrieved successfully');
});

/** GET /dashboard/recent-projects — recent projects with client name */
export const getRecentProjectsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.user_id;
  if (!userId) return ResponseHelper.error(res, 'Unauthorized', 401);

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
  const result = await dashboardUseCase.getRecentProjects({ user_id: userId, limit });
  return ResponseHelper.success(res, result, 'Recent projects retrieved successfully');
});
