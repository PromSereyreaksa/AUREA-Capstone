import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { 
  injectAuthenticatedUserId, 
  injectAuthenticatedUserIdToQuery 
} from '../../shared/middleware/authorizationMiddleware';
import {
  standardLimiter,
  aiEndpointLimiter,
  calculationLimiter,
  profileLimiter,
  portfolioAnalysisLimiter
} from '../../shared/middleware/rateLimiter';
import { PricingController } from '../controllers/PricingController';

const router = Router();
const pricingController = new PricingController();

// Multer for optional PDF upload on portfolio-assist
const portfolioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: UREA-based pricing calculator endpoints
 */

/**
 * @swagger
 * /api/v1/pricing/onboarding/start:
 *   post:
 *     summary: Start or resume pricing onboarding
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user
 *                 example: 1
 *     responses:
 *       200:
 *         description: Onboarding session started
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboarding/start',
  authMiddleware,
  injectAuthenticatedUserId,
  asyncHandler((req, res) => pricingController.startOnboarding(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/onboarding/answer:
 *   post:
 *     summary: Answer current onboarding question
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - answer
 *             properties:
 *               session_id:
 *                 type: string
 *                 format: uuid
 *                 description: Onboarding session ID
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               answer:
 *                 type: string
 *                 description: User's answer to current question
 *                 example: "400"
 *     responses:
 *       200:
 *         description: Answer recorded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboarding/answer',
  authMiddleware,
  injectAuthenticatedUserId,
  asyncHandler((req, res) => pricingController.answerQuestion(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/onboarding/session/{session_id}:
 *   get:
 *     summary: Get onboarding session details
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Onboarding session ID
 *     responses:
 *       200:
 *         description: Session details retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.get(
  '/onboarding/session/:session_id',
  authMiddleware,
  asyncHandler((req, res) => pricingController.getSession(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/calculate/base-rate:
 *   post:
 *     summary: Calculate UREA base hourly rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user
 *                 example: 1
 *               session_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional completed onboarding session ID
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Base rate calculated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/calculate/base-rate',
  authMiddleware,
  calculationLimiter,
  injectAuthenticatedUserId,
  asyncHandler((req, res) => pricingController.calculateBaseRate(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/benchmark:
 *   get:
 *     summary: Get Cambodia market benchmarks
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: skill_categories
 *         schema:
 *           type: string
 *         description: Comma-separated category IDs (e.g., "1,3,5")
 *       - in: query
 *         name: seniority_level
 *         schema:
 *           type: string
 *           enum: [junior, mid, senior, expert]
 *         description: Seniority level filter
 *     responses:
 *       200:
 *         description: Benchmarks retrieved
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/benchmark',
  authMiddleware,
  injectAuthenticatedUserIdToQuery,
  asyncHandler((req, res) => pricingController.getBenchmark(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/calculate/project-rate:
 *   post:
 *     summary: Calculate project-specific rate with client context
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - client_type
 *               - client_region
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user
 *                 example: 1
 *               project_id:
 *                 type: integer
 *                 description: Optional project ID to update
 *                 example: 5
 *               client_type:
 *                 type: string
 *                 enum: [startup, sme, corporate, ngo, government]
 *                 description: Client organization type
 *                 example: "sme"
 *               client_region:
 *                 type: string
 *                 enum: [cambodia, southeast_asia, global]
 *                 description: Client location
 *                 example: "cambodia"
 *     responses:
 *       200:
 *         description: Project rate calculated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/calculate/project-rate',
  authMiddleware,
  calculationLimiter,
  injectAuthenticatedUserId,
  asyncHandler((req, res) => pricingController.calculateProjectRate(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/profile:
 *   get:
 *     summary: Get user's pricing profile
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get(
  '/profile',
  authMiddleware,
  profileLimiter,
  injectAuthenticatedUserIdToQuery,
  asyncHandler((req, res) => pricingController.getProfile(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/profile:
 *   put:
 *     summary: Update pricing profile (advanced manual adjustments)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fixed_costs:
 *                 type: object
 *                 properties:
 *                   rent:
 *                     type: number
 *                   equipment_amortization:
 *                     type: number
 *                   insurance:
 *                     type: number
 *                   utilities:
 *                     type: number
 *                   business_taxes:
 *                     type: number
 *               variable_costs:
 *                 type: object
 *                 properties:
 *                   materials_per_project:
 *                     type: number
 *                   outsourcing_per_project:
 *                     type: number
 *                   marketing_per_project:
 *                     type: number
 *               desired_monthly_income:
 *                 type: number
 *               billable_hours_per_month:
 *                 type: number
 *                 minimum: 40
 *                 maximum: 200
 *               profit_margin:
 *                 type: number
 *                 minimum: 0.05
 *                 maximum: 0.50
 *               seniority_level:
 *                 type: string
 *                 enum: [junior, mid, senior, expert]
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put(
  '/profile',
  authMiddleware,
  profileLimiter,
  injectAuthenticatedUserIdToQuery,
  asyncHandler((req, res) => pricingController.updateProfile(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/quick-estimate:
 *   post:
 *     summary: AI-powered quick rate estimation for beginners
 *     description: |
 *       Generates a quick hourly rate estimate for freelancers who don't know their exact costs.
 *       Uses Gemini AI to estimate missing data based on Cambodia market benchmarks.
 *       
 *       This is intended as a starting point - users should complete full onboarding for accurate pricing.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - skills
 *               - experience_level
 *               - hours_per_week
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user
 *                 example: 1
 *               skills:
 *                 type: string
 *                 description: Comma-separated list of skills/services offered
 *                 example: "Logo Design, Branding, Social Media Graphics"
 *               experience_level:
 *                 type: string
 *                 enum: [beginner, intermediate, experienced, expert]
 *                 description: Overall experience level
 *                 example: "intermediate"
 *               client_type:
 *                 type: string
 *                 enum: [startup, sme, corporate, ngo, government]
 *                 description: Typical client type (optional)
 *                 example: "sme"
 *               hours_per_week:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 80
 *                 description: Hours available to work per week
 *                 example: 30
 *               region:
 *                 type: string
 *                 description: Operating region (default is Cambodia)
 *                 example: "cambodia"
 *     responses:
 *       200:
 *         description: Quick estimate generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     estimate:
 *                       type: object
 *                       properties:
 *                         hourly_rate_min:
 *                           type: number
 *                           example: 12.5
 *                         hourly_rate_max:
 *                           type: number
 *                           example: 18.0
 *                         recommended_rate:
 *                           type: number
 *                           example: 15.0
 *                         currency:
 *                           type: string
 *                           example: "USD"
 *                     user_inputs:
 *                       type: object
 *                       description: Data provided by the user
 *                     estimated_assumptions:
 *                       type: object
 *                       description: AI-estimated costs and parameters
 *                     market_context:
 *                       type: object
 *                       description: Market benchmark comparison
 *                     disclaimer:
 *                       type: string
 *                       description: Disclaimer about the estimate's accuracy
 *                     recommendation:
 *                       type: string
 *                       description: Recommendation to complete full onboarding
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded (max 5 requests per minute)
 */
router.post(
  '/quick-estimate',
  authMiddleware,
  aiEndpointLimiter,  // Strict rate limit for AI endpoint (5/min)
  injectAuthenticatedUserId,
  asyncHandler((req, res) => pricingController.quickEstimate(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/portfolio-assist:
 *   post:
 *     summary: Portfolio-assisted pricing analysis
 *     description: |
 *       Analyzes a portfolio (URL, PDF upload, or pasted text) to infer structured signals,
 *       allows user overrides, and calculates project rate with confirmed values.
 *
 *       **Input modes (at least one required):**
 *       - **URL only** – uses Google Search grounding to analyze the live portfolio page
 *       - **PDF upload** – sends the PDF directly to Gemini for inline analysis
 *       - **Text** – analyses pasted/extracted portfolio content
 *       - **Overrides / client_type only** – skips AI, uses manual values
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - client_region
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               project_id:
 *                 type: integer
 *                 description: Optional project ID to update
 *               client_region:
 *                 type: string
 *                 enum: [cambodia, southeast_asia, global]
 *               portfolio_url:
 *                 type: string
 *                 description: Public portfolio URL (analyzed via Google Search grounding)
 *               portfolio_text:
 *                 type: string
 *                 description: Extracted portfolio content (plain text)
 *               portfolio_pdf:
 *                 type: string
 *                 format: binary
 *                 description: Portfolio PDF file (max 20 MB)
 *               client_type:
 *                 type: string
 *                 enum: [startup, sme, corporate, ngo, government]
 *                 description: Manual client type when AI is skipped
 *               use_ai:
 *                 type: boolean
 *                 description: Disable AI analysis if false
 *               experience_years:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 description: Years of experience (optional, helps AI calculate better rates)
 *               skills:
 *                 type: string
 *                 maxLength: 200
 *                 description: Comma-separated skills (optional, supplements portfolio analysis)
 *               hours_per_week:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 80
 *                 description: Available work hours per week (optional, used in rate calculation)
 *               overrides:
 *                 type: string
 *                 description: JSON string of override values (parsed server-side)
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - client_region
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               project_id:
 *                 type: integer
 *               client_region:
 *                 type: string
 *                 enum: [cambodia, southeast_asia, global]
 *               portfolio_url:
 *                 type: string
 *               portfolio_text:
 *                 type: string
 *               client_type:
 *                 type: string
 *                 enum: [startup, sme, corporate, ngo, government]
 *               experience_years:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *               skills:
 *                 type: string
 *                 maxLength: 200
 *               hours_per_week:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 80
 *               use_ai:
 *                 type: boolean
 *               overrides:
 *                 type: object
 *                 properties:
 *                   seniority_level:
 *                     type: string
 *                     enum: [junior, mid, senior, expert]
 *                   skill_areas:
 *                     type: array
 *                     items:
 *                       type: string
 *                   specialization:
 *                     type: string
 *                   portfolio_quality_tier:
 *                     type: string
 *                     enum: [budget, mid, premium]
 *                   client_readiness:
 *                     type: string
 *                     enum: [startup, sme, corporate, ngo, government]
 *                   confidence:
 *                     type: string
 *                     enum: [low, medium, high]
 *                   market_benchmark_category:
 *                     type: string
 *     responses:
 *       200:
 *         description: Portfolio-assisted pricing result
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/portfolio-assist',
  authMiddleware,
  portfolioAnalysisLimiter,
  portfolioUpload.single('portfolio_pdf'),
  injectAuthenticatedUserId,
  asyncHandler((req, res) => pricingController.portfolioAssistedPricing(req, res))
);

/**
 * @swagger
 * /api/v1/pricing/portfolio-assist/accept:
 *   post:
 *     summary: Accept and save AI-recommended rate to pricing profile
 *     description: |
 *       Allows users to accept a rate recommended by the portfolio-assisted pricing flow
 *       and save it to their pricing profile. If no profile exists, creates one with
 *       sensible defaults or AI-researched costs.
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hourly_rate
 *             properties:
 *               hourly_rate:
 *                 type: number
 *                 description: The hourly rate to accept (must be > 0)
 *                 example: 15.50
 *               seniority_level:
 *                 type: string
 *                 enum: [junior, mid, senior, expert]
 *                 description: Seniority level
 *                 example: mid
 *               skill_categories:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of category IDs
 *                 example: [1, 2, 3]
 *               experience_years:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 description: Years of experience
 *                 example: 5
 *               researched_costs:
 *                 type: object
 *                 description: AI-researched cost breakdown from portfolio analysis
 *                 properties:
 *                   workspace:
 *                     type: number
 *                     example: 50
 *                   software:
 *                     type: number
 *                     example: 30
 *                   equipment:
 *                     type: number
 *                     example: 25
 *                   utilities:
 *                     type: number
 *                     example: 30
 *                   materials:
 *                     type: number
 *                     example: 20
 *               desired_monthly_income:
 *                 type: number
 *                 description: Desired monthly take-home income
 *                 example: 800
 *               billable_hours_per_month:
 *                 type: number
 *                 minimum: 40
 *                 maximum: 200
 *                 description: Billable hours per month
 *                 example: 80
 *               profit_margin:
 *                 type: number
 *                 minimum: 0.05
 *                 maximum: 0.50
 *                 description: Profit margin as decimal (5% to 50%)
 *                 example: 0.15
 *     responses:
 *       200:
 *         description: Rate accepted and pricing profile created/updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pricing_profile:
 *                       type: object
 *                     action:
 *                       type: string
 *                       enum: [created, updated]
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/portfolio-assist/accept',
  authMiddleware,
  profileLimiter,
  injectAuthenticatedUserId,
  asyncHandler((req, res) => pricingController.acceptPortfolioRate(req, res))
);

export default router;
