import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { getDashboardController, getDashboardHistoryController } from '../controllers/DashboardController';

const router = Router();

router.get('/', authMiddleware, getDashboardController);
router.get('/history', authMiddleware, getDashboardHistoryController);

export default router;
