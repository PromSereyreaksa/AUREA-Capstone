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
  MAX_PDF_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

export const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview'
] as const;
export type GeminiModel = typeof GEMINI_MODELS[number];
