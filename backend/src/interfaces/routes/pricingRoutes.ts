import { Router } from 'express';
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
  profileLimiter
} from '../../shared/middleware/rateLimiter';
import { PricingController } from '../controllers/PricingController';

const router = Router();
const pricingController = new PricingController();

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

export default router;
