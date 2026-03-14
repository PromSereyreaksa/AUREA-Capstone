import { Router } from 'express';
import {
  getPortfolioController,
  uploadPortfolioPdfController,
  deletePortfolioPdfController,
  updatePortfolioController,
  getPublicPortfoliosController,
  getCategoriesController,
  getPublicPortfolioByIdController,
} from '../controllers/PortfolioController';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { portfolioPdfUpload } from '../../shared/middleware/uploadMiddleware';

// Portfolio routes for portfolio CRUD operations
const portfolioRouter = Router();

// Public routes (no authentication required)
portfolioRouter.get('/public', getPublicPortfoliosController);
portfolioRouter.get('/public/:id', getPublicPortfolioByIdController);
portfolioRouter.get('/categories', getCategoriesController);

// Protected routes (authentication required)
// Get portfolio
portfolioRouter.get('/', authMiddleware, getPortfolioController);

// Update portfolio settings (is_public)
portfolioRouter.put('/', authMiddleware, updatePortfolioController);

// Portfolio PDF routes
portfolioRouter.post('/pdf', authMiddleware, portfolioPdfUpload.single('pdf'), uploadPortfolioPdfController);
portfolioRouter.delete('/pdf', authMiddleware, deletePortfolioPdfController);

export default portfolioRouter;
