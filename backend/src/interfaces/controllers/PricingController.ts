import { Request, Response } from 'express';
import { PricingValidator } from '../../shared/validators/PricingValidator';
import { StartOnboarding } from '../../application/use_cases/StartOnboarding';
import { AnswerOnboardingQuestion } from '../../application/use_cases/AnswerOnboardingQuestion';
import { CalculateBaseRate } from '../../application/use_cases/CalculateBaseRate';
import { GetMarketBenchmark } from '../../application/use_cases/GetMarketBenchmark';
import { CalculateProjectRate } from '../../application/use_cases/CalculateProjectRate';
import { QuickEstimateRate } from '../../application/use_cases/QuickEstimateRate';
import { PortfolioAssistedPricing } from '../../application/use_cases/PortfolioAssistedPricing';
import { AcceptPortfolioRate } from '../../application/use_cases/AcceptPortfolioRate';
import { OnboardingSessionRepository } from '../../infrastructure/repositories/OnboardingSessionRepository';
import { PricingProfileRepository } from '../../infrastructure/repositories/PricingProfileRepository';
import { MarketBenchmarkRepository } from '../../infrastructure/repositories/MarketBenchmarkRepository';
import { ProjectPriceRepository } from '../../infrastructure/repositories/ProjectPriceRepository';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { GeminiService } from '../../infrastructure/services/GeminiService';
import { ResponseHelper } from '../../shared/utils/responseHelper';
import { HTTP_STATUS } from '../../shared/constants';
import { ForbiddenError } from '../../shared/errors/AppError';

export class PricingController {
  private onboardingSessionRepo: OnboardingSessionRepository;
  private pricingProfileRepo: PricingProfileRepository;
  private marketBenchmarkRepo: MarketBenchmarkRepository;
  private projectPriceRepo: ProjectPriceRepository;
  private categoryRepo: CategoryRepository;
  private geminiService: GeminiService;

  constructor() {
    this.onboardingSessionRepo = new OnboardingSessionRepository();
    this.pricingProfileRepo = new PricingProfileRepository();
    this.marketBenchmarkRepo = new MarketBenchmarkRepository();
    this.projectPriceRepo = new ProjectPriceRepository();
    this.categoryRepo = new CategoryRepository();
    this.geminiService = new GeminiService();
  }

  /**
   * POST /api/v1/pricing/onboarding/start
   * Start or resume onboarding session
   */
  async startOnboarding(req: Request, res: Response): Promise<void> {
    const userId = PricingValidator.validateStartOnboarding(req.body);

    const useCase = new StartOnboarding(this.onboardingSessionRepo);
    const result = await useCase.execute(userId);

    ResponseHelper.success(res, result, 'Onboarding session started');
  }

  /**
   * POST /api/v1/pricing/onboarding/answer
   * Answer current onboarding question
   */
  async answerQuestion(req: Request, res: Response): Promise<void> {
    const validated = PricingValidator.validateAnswerQuestion(req.body);

    const useCase = new AnswerOnboardingQuestion(
      this.onboardingSessionRepo,
      this.geminiService
    );

    const result = await useCase.execute(validated);

    ResponseHelper.success(res, result, 'Answer recorded successfully');
  }

  /**
   * GET /api/v1/pricing/onboarding/session/:session_id
   * Get onboarding session details
   */
  async getSession(req: Request, res: Response): Promise<void> {
    const sessionId = PricingValidator.validateSessionId(req.params.session_id);

    const session = await this.onboardingSessionRepo.findById(sessionId);

    if (!session) {
      ResponseHelper.notFound(res, 'Session not found');
      return;
    }

    // Verify the authenticated user owns this session (IDOR protection)
    const authenticatedUserId = req.user?.user_id;
    if (!authenticatedUserId || session.user_id !== authenticatedUserId) {
      throw new ForbiddenError('You can only access your own sessions');
    }

    ResponseHelper.success(res, {
      session_id: session.session_id,
      user_id: session.user_id,
      status: session.status,
      current_question: session.getCurrentQuestion(),
      progress: session.getProgress(),
      collected_data: session.collected_data
    }, 'Session retrieved successfully');
  }

  /**
   * POST /api/v1/pricing/calculate/base-rate
   * Calculate UREA base hourly rate
   */
  async calculateBaseRate(req: Request, res: Response): Promise<void> {
    const validated = PricingValidator.validateCalculateBaseRate(req.body);

    const useCase = new CalculateBaseRate(
      this.pricingProfileRepo,
      this.onboardingSessionRepo
    );

    const result = await useCase.execute(validated);

    ResponseHelper.success(res, result, 'Base rate calculated successfully');
  }

  /**
   * GET /api/v1/pricing/benchmark
   * Get market benchmarks for user's skill categories
   */
  async getBenchmark(req: Request, res: Response): Promise<void> {
    const queryData = {
      user_id: req.query.user_id,
      skill_categories: req.query.skill_categories 
        ? (req.query.skill_categories as string).split(',').map(id => parseInt(id))
        : undefined,
      seniority_level: req.query.seniority_level as string | undefined
    };

    const validated = PricingValidator.validateGetBenchmark(queryData);

    const useCase = new GetMarketBenchmark(
      this.marketBenchmarkRepo,
      this.pricingProfileRepo
    );

    const result = await useCase.execute(validated);

    ResponseHelper.success(res, result, 'Market benchmarks retrieved successfully');
  }

  /**
   * POST /api/v1/pricing/calculate/project-rate
   * Calculate project-specific rate with client context
   */
  async calculateProjectRate(req: Request, res: Response): Promise<void> {
    const validated = PricingValidator.validateCalculateProjectRate(req.body);

    const useCase = new CalculateProjectRate(
      this.pricingProfileRepo,
      this.projectPriceRepo
    );

    const result = await useCase.execute(validated);

    ResponseHelper.success(res, result, 'Project rate calculated successfully');
  }

  /**
   * GET /api/v1/pricing/profile
   * Get user's pricing profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = PricingValidator.validateStartOnboarding({ user_id: req.query.user_id });

    const profile = await this.pricingProfileRepo.findByUserId(userId);

    if (!profile) {
      ResponseHelper.notFound(res, 'Pricing profile not found. Please complete onboarding.');
      return;
    }

    ResponseHelper.success(res, {
      pricing_profile_id: profile.pricing_profile_id,
      user_id: profile.user_id,
      fixed_costs: profile.fixed_costs,
      variable_costs: profile.variable_costs,
      desired_monthly_income: profile.desired_monthly_income,
      billable_hours_per_month: profile.billable_hours_per_month,
      profit_margin: profile.profit_margin,
      experience_years: profile.experience_years,
      seniority_level: profile.seniority_level,
      skill_categories: profile.skill_categories,
      base_hourly_rate: profile.base_hourly_rate,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }, 'Pricing profile retrieved successfully');
  }

  /**
   * PUT /api/v1/pricing/profile
   * Update user's pricing profile (for advanced manual adjustments)
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = PricingValidator.validateStartOnboarding({ user_id: req.query.user_id });
    const updates = PricingValidator.validateUpdateProfile(req.body);

    const profile = await this.pricingProfileRepo.findByUserId(userId);

    if (!profile) {
      ResponseHelper.notFound(res, 'Pricing profile not found. Please complete onboarding first.');
      return;
    }

    await this.pricingProfileRepo.update(profile.pricing_profile_id, updates);

    // Fetch updated profile
    const updatedProfile = await this.pricingProfileRepo.findByUserId(userId);

    ResponseHelper.success(res, updatedProfile, 'Pricing profile updated successfully');
  }

  /**
   * POST /api/v1/pricing/quick-estimate
   * AI-powered quick rate estimation for beginners who don't know their costs
   * Uses Gemini to estimate missing data based on Cambodia market benchmarks
   * Query param: use_grounding=false to disable Google Search (for comparison testing)
   */
  async quickEstimate(req: Request, res: Response): Promise<void> {
    const validated = PricingValidator.validateQuickEstimate(req.body);
    
    // Check if grounding should be disabled (for A/B testing)
    const useGrounding = req.query.use_grounding !== 'false';

    const useCase = new QuickEstimateRate(
      this.geminiService,
      this.marketBenchmarkRepo
    );

    // Pass the input with useGrounding flag
    const input = {
      user_id: validated.user_id,
      skills: validated.skills,
      experience_level: validated.experience_level,
      client_type: validated.client_type,
      hours_per_week: validated.hours_per_week,
      region: validated.region,
      useGrounding
    };

    const result = await useCase.execute(input);

    ResponseHelper.success(res, result, 'Quick estimate generated successfully');
  }

  /**
   * POST /api/v1/pricing/portfolio-assist
   * Analyze a portfolio and calculate project rate with AI-inferred signals.
   * Accepts JSON body or multipart/form-data (for PDF upload).
   */
  async portfolioAssistedPricing(req: Request, res: Response): Promise<void> {
    // When sent as multipart/form-data, `overrides` arrives as a JSON string
    const body = { ...req.body };
    if (typeof body.overrides === 'string') {
      try { body.overrides = JSON.parse(body.overrides); } catch { body.overrides = undefined; }
    }

    // Handle optional PDF file from multipart/form-data
    let portfolio_pdf: Buffer | undefined;
    if ((req as any).file) {
      const file = (req as any).file as { buffer: Buffer; mimetype: string; size: number };
      portfolio_pdf = PricingValidator.validatePortfolioPdf(file);
    }

    // Pass hasPdf flag so the validator allows PDF-only requests
    const validated = PricingValidator.validatePortfolioAssistedPricing(body, !!portfolio_pdf);

    const useCase = new PortfolioAssistedPricing(
      this.pricingProfileRepo,
      this.projectPriceRepo,
      this.marketBenchmarkRepo,
      this.categoryRepo,
      this.geminiService
    );

    const result = await useCase.execute({ ...validated, portfolio_pdf });

    ResponseHelper.success(res, result, 'Portfolio-assisted pricing completed successfully');
  }

  /**
   * POST /api/v1/pricing/portfolio-assist/accept
   * Accept and save an AI-recommended rate to the user's pricing profile
   */
  async acceptPortfolioRate(req: Request, res: Response): Promise<void> {
    const validated = PricingValidator.validateAcceptRate(req.body);

    const useCase = new AcceptPortfolioRate(this.pricingProfileRepo);

    const result = await useCase.execute(validated);

    ResponseHelper.success(res, result, result.message);
  }
}
