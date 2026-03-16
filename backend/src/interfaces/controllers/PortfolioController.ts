import { Request, Response } from 'express';
import { PortfolioRepository } from '../../infrastructure/repositories/PortfolioRepository';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { StorageService } from '../../infrastructure/services/StorageService';
import { ResponseHelper } from '../../shared/utils';
import { asyncHandler } from '../../shared/middleware';

const portfolioRepo = new PortfolioRepository();
const categoryRepo = new CategoryRepository();
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
    portfolio_cover_url: portfolio.portfolio_cover_url,
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
    portfolio_cover_url: updatedPortfolio.portfolio_cover_url,
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
    portfolio_url: null as any
  });

  return ResponseHelper.success(res, null, 'Portfolio PDF deleted successfully');
});

/**
 * PUT /api/portfolio
 * Update portfolio settings (is_public)
 */
export const updatePortfolioController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;
  const { is_public, portfolio_url, portfolio_cover_url } = req.body;

  let normalizedPortfolioUrl: string | null | undefined;
  if (portfolio_url !== undefined) {
    if (portfolio_url === null || portfolio_url === '') {
      normalizedPortfolioUrl = null;
    } else if (typeof portfolio_url === 'string') {
      const trimmed = portfolio_url.trim();
      if (trimmed.length > 0 && !/^https?:\/\/.+/i.test(trimmed)) {
        return ResponseHelper.error(res, 'portfolio_url must be a valid HTTP or HTTPS URL', 400);
      }
      normalizedPortfolioUrl = trimmed;
    } else {
      return ResponseHelper.error(res, 'portfolio_url must be a string', 400);
    }
  }

  let normalizedPortfolioCoverUrl: string | null | undefined;
  if (portfolio_cover_url !== undefined) {
    if (portfolio_cover_url === null || portfolio_cover_url === '') {
      normalizedPortfolioCoverUrl = null;
    } else if (typeof portfolio_cover_url === 'string') {
      const trimmed = portfolio_cover_url.trim();
      if (trimmed.length > 0 && !/^https?:\/\/.+/i.test(trimmed)) {
        return ResponseHelper.error(res, 'portfolio_cover_url must be a valid HTTP or HTTPS URL', 400);
      }
      normalizedPortfolioCoverUrl = trimmed;
    } else {
      return ResponseHelper.error(res, 'portfolio_cover_url must be a string', 400);
    }
  }

  const updatedPortfolio = await portfolioRepo.update(user_id, {
    is_public,
    ...(normalizedPortfolioUrl !== undefined
      ? { portfolio_url: normalizedPortfolioUrl as any }
      : {}),
    ...(normalizedPortfolioCoverUrl !== undefined
      ? { portfolio_cover_url: normalizedPortfolioCoverUrl as any }
      : {})
  });

  return ResponseHelper.success(res, {
    portfolio_id: updatedPortfolio.portfolio_id,
    user_id: updatedPortfolio.user_id,
    portfolio_url: updatedPortfolio.portfolio_url,
    portfolio_cover_url: updatedPortfolio.portfolio_cover_url,
    is_public: updatedPortfolio.is_public,
  }, 'Portfolio updated successfully');
});

/**
 * POST /api/portfolio/cover
 * Upload portfolio cover image
 */
export const uploadPortfolioCoverController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;
  const file = req.file;

  if (!file) {
    return ResponseHelper.error(res, 'No cover image provided', 400);
  }

  const existingPortfolio = await portfolioRepo.findByUserId(user_id);
  if (existingPortfolio?.portfolio_cover_url) {
    await storageService.deletePortfolioCover(existingPortfolio.portfolio_cover_url);
  }

  const publicUrl = await storageService.uploadPortfolioCover(user_id, file);
  const updatedPortfolio = await portfolioRepo.update(user_id, {
    portfolio_cover_url: publicUrl
  });

  return ResponseHelper.success(res, {
    message: 'Portfolio cover uploaded successfully',
    portfolio_id: updatedPortfolio.portfolio_id,
    user_id: updatedPortfolio.user_id,
    portfolio_url: updatedPortfolio.portfolio_url,
    portfolio_cover_url: updatedPortfolio.portfolio_cover_url,
    is_public: updatedPortfolio.is_public,
  }, 'Portfolio cover uploaded successfully');
});

/**
 * DELETE /api/portfolio/cover
 * Delete portfolio cover image
 */
export const deletePortfolioCoverController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;

  const portfolio = await portfolioRepo.findByUserId(user_id);
  if (!portfolio || !portfolio.portfolio_cover_url) {
    return ResponseHelper.notFound(res, 'No portfolio cover found');
  }

  await storageService.deletePortfolioCover(portfolio.portfolio_cover_url);
  await portfolioRepo.update(user_id, {
    portfolio_cover_url: null as any
  });

  return ResponseHelper.success(res, null, 'Portfolio cover deleted successfully');
});

/**
 * GET /api/portfolio/public
 * Get all public portfolios with search, category filter, and pagination
 * No authentication required
 */
export const getPublicPortfoliosController = asyncHandler(async (req: Request, res: Response) => {
  // Parse query parameters
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 9));
  const search = req.query.search as string | undefined;
  
  // Parse category_ids: "1,2,3" -> [1, 2, 3]
  let categoryIds: number[] | undefined;
  if (req.query.category_ids) {
    const categoryIdsStr = req.query.category_ids as string;
    categoryIds = categoryIdsStr
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
    
    if (categoryIds.length === 0) {
      categoryIds = undefined;
    }
  }

  const result = await portfolioRepo.findPublicPortfolios({
    page,
    limit,
    search: search?.trim(),
    categoryIds
  });

  return ResponseHelper.paginated(res, result.data, page, limit, result.total);
});

/**
 * GET /api/portfolio/public/:id
 * Get a single public portfolio by id
 * No authentication required
 */
export const getPublicPortfolioByIdController = asyncHandler(async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const portfolioId = Number(idParam);

  if (!idParam || Number.isNaN(portfolioId) || portfolioId <= 0) {
    return ResponseHelper.error(res, 'Invalid portfolio id', 400);
  }

  const portfolio = await portfolioRepo.findPublicPortfolioById(portfolioId);

  if (!portfolio) {
    return ResponseHelper.notFound(res, 'Portfolio not found or not public');
  }

  return ResponseHelper.success(res, portfolio, 'Public portfolio retrieved successfully');
});

/**
 * GET /api/portfolio/categories
 * Get all categories for filtering
 * No authentication required
 */
export const getCategoriesController = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryRepo.findAll();
  
  return ResponseHelper.success(res, categories.map(c => ({
    category_id: c.category_id,
    category_name: c.category_name
  })), 'Categories retrieved successfully');
});

