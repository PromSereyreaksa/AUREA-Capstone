import { Request, Response } from 'express';
import { PortfolioRepository } from '../../infrastructure/repositories/PortfolioRepository';
import { StorageService } from '../../infrastructure/services/StorageService';
import { ResponseHelper } from '../../shared/utils';
import { asyncHandler } from '../../shared/middleware';

const portfolioRepo = new PortfolioRepository();
const storageService = new StorageService();

/**
 * GET /api/portfolio
 * Get current user's portfolio
 */
export const getPortfolioController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;

  const portfolio = await portfolioRepo.findByUserId(user_id);

  if (!portfolio) {
    return ResponseHelper.notFound(res, 'Portfolio not found');
  }

  return ResponseHelper.success(res, {
    portfolio_id: portfolio.portfolio_id,
    user_id: portfolio.user_id,
    portfolio_url: portfolio.portfolio_url, // Public URL to access the PDF
    is_public: portfolio.is_public,
  }, 'Portfolio retrieved successfully');
});

/**
 * POST /api/portfolio/pdf
 * Upload portfolio PDF
 */
export const uploadPortfolioPdfController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;
  const file = req.file;

  if (!file) {
    return ResponseHelper.error(res, 'No PDF file provided', 400);
  }

  // Check if portfolio exists
  const existingPortfolio = await portfolioRepo.findByUserId(user_id);

  // Delete old PDF if it exists
  if (existingPortfolio?.portfolio_url) {
    await storageService.deletePortfolioPdf(existingPortfolio.portfolio_url);
  }

  // Upload PDF to Supabase Storage (returns public URL)
  const publicUrl = await storageService.uploadPortfolioPdf(
    user_id,
    file.buffer,
    file.originalname
  );

  // Update or create portfolio with new PDF URL
  const updatedPortfolio = await portfolioRepo.update(user_id, {
    portfolio_url: publicUrl
  });

  return ResponseHelper.success(res, {
    message: 'Portfolio PDF uploaded successfully',
    portfolio_id: updatedPortfolio.portfolio_id,
    user_id: updatedPortfolio.user_id,
    portfolio_url: updatedPortfolio.portfolio_url,
    is_public: updatedPortfolio.is_public,
  }, 'Portfolio PDF uploaded successfully');
});

/**
 * DELETE /api/portfolio/pdf
 * Delete portfolio PDF
 */
export const deletePortfolioPdfController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;

  const portfolio = await portfolioRepo.findByUserId(user_id);

  if (!portfolio || !portfolio.portfolio_url) {
    return ResponseHelper.notFound(res, 'No portfolio PDF found');
  }

  // Delete from Supabase Storage
  await storageService.deletePortfolioPdf(portfolio.portfolio_url);

  // Update portfolio to remove PDF URL
  await portfolioRepo.update(user_id, {
    portfolio_url: undefined
  });

  return ResponseHelper.success(res, null, 'Portfolio PDF deleted successfully');
});

/**
 * PUT /api/portfolio
 * Update portfolio settings (is_public)
 */
export const updatePortfolioController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;
  const { is_public } = req.body;

  const updatedPortfolio = await portfolioRepo.update(user_id, {
    is_public
  });

  return ResponseHelper.success(res, {
    portfolio_id: updatedPortfolio.portfolio_id,
    user_id: updatedPortfolio.user_id,
    portfolio_url: updatedPortfolio.portfolio_url,
    is_public: updatedPortfolio.is_public,
  }, 'Portfolio updated successfully');
});

