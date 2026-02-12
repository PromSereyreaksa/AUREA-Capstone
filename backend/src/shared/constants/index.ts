export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Complex'] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const LICENSING_TYPES = ['One-Time Used', 'Limited Used', 'Exclusive License'] as const;
export type LicensingType = typeof LICENSING_TYPES[number];

export const USAGE_RIGHTS = ['Personal Use', 'Small Business', 'Large Corporation', 'Full Commercial Right'] as const;
export type UsageRight = typeof USAGE_RIGHTS[number];

export const USER_ROLES = ['client', 'designer', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

export const DELIVERABLE_TYPES = [
  'Logo Design',
  'Brand Guideline',
  'Business Card',
  'Poster',
  'Website Mockup',
  'App Screen',
  'Social Media',
  'Packaging',
  'Illustration',
  'Other'
] as const;
export type DeliverableType = typeof DELIVERABLE_TYPES[number];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

export const FILE_LIMITS = {
  MAX_PDF_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

export const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview'
] as const;
export type GeminiModel = typeof GEMINI_MODELS[number];

// UREA Pricing Framework Constants
export const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'expert'] as const;
export type SeniorityLevel = typeof SENIORITY_LEVELS[number];

export const CLIENT_TYPES = ['startup', 'sme', 'corporate', 'ngo', 'government'] as const;
export type ClientType = typeof CLIENT_TYPES[number];

export const CLIENT_REGIONS = ['cambodia', 'southeast_asia', 'global'] as const;
export type ClientRegion = typeof CLIENT_REGIONS[number];

export const ONBOARDING_STATUS = ['in_progress', 'completed', 'abandoned'] as const;
export type OnboardingStatus = typeof ONBOARDING_STATUS[number];

export const PRICING_CONSTANTS = {
  MIN_BILLABLE_HOURS: 40,
  MAX_BILLABLE_HOURS: 200,
  DEFAULT_BILLABLE_HOURS: 100,
  MIN_PROFIT_MARGIN: 0.05, // 5%
  MAX_PROFIT_MARGIN: 0.50, // 50%
  DEFAULT_PROFIT_MARGIN: 0.15, // 15%
  USD_TO_KHR_RATE: 4000, // Approximate exchange rate
  MIN_BENCHMARK_SAMPLE_SIZE: 10 // Minimum sample size for reliable benchmarks
} as const;

export const SENIORITY_MULTIPLIERS = {
  junior: 0.8,
  mid: 1.0,
  senior: 1.3,
  expert: 1.5
} as const;

export const PORTFOLIO_QUALITY_TIERS = ['budget', 'mid', 'premium'] as const;
export type PortfolioQualityTier = typeof PORTFOLIO_QUALITY_TIERS[number];

export const PORTFOLIO_CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type PortfolioConfidenceLevel = typeof PORTFOLIO_CONFIDENCE_LEVELS[number];

export const RATE_POSITION = ['below_median', 'at_median', 'above_median'] as const;
export type RatePosition = typeof RATE_POSITION[number];
