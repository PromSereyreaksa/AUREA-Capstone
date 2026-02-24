import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import {
  getDashboardController,
  getDashboardStatsController,
  getRecentProjectsController,
} from '../controllers/DashboardController';

const router = Router();

/**
 * GET /api/v{0,1}/dashboard/stats
 * Lightweight overview: total projects, base rate, seniority, profile completeness.
 */
router.get('/stats', authMiddleware, getDashboardStatsController);

/**
 * GET /api/v{0,1}/dashboard/recent-projects
 * Returns up to N most recent projects (default 5) with client name.
 * Optional query param: ?limit=N
 */
router.get('/recent-projects', authMiddleware, getRecentProjectsController);

/**
 * GET /api/v{0,1}/dashboard
 * Full aggregated dashboard (overview + projects + pricing + benchmarks + portfolio).
 */
router.get('/', authMiddleware, getDashboardController);

export default router;
