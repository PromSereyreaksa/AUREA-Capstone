import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { getDashboardController } from '../controllers/DashboardController';

const router = Router();

router.get('/', authMiddleware, getDashboardController);

export default router;
