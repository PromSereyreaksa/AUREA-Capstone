/**
 * Unit Tests: PricingValidator — Portfolio-Assisted Pricing validation
 *
 * Tests edge cases for validatePortfolioAssistedPricing:
 * - empty strings, whitespace, empty overrides, URL format, etc.
 *
 * @jest-environment node
 */

import { PricingValidator } from '../../../src/shared/validators/PricingValidator';
import { ValidationError } from '../../../src/shared/errors/AppError';

describe('PricingValidator.validatePortfolioAssistedPricing', () => {
  const validBase = {
    user_id: 1,
    client_region: 'cambodia',
  };

  // ── Happy path ──────────────────────────────────────────────

  it('should pass with valid portfolio_url', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      portfolio_url: 'https://dribbble.com/user',
    });
    expect(result.user_id).toBe(1);
    expect(result.portfolio_url).toBe('https://dribbble.com/user');
  });

  it('should pass with valid portfolio_text', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      portfolio_text: 'I have 5 years experience in logo design.',
    });
    expect(result.portfolio_text).toBe('I have 5 years experience in logo design.');
  });

  it('should pass with client_type only', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      client_type: 'startup',
    });
    expect(result.client_type).toBe('startup');
  });

  it('should pass with overrides only', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      overrides: { seniority_level: 'senior' },
    });
    expect(result.overrides).toEqual({ seniority_level: 'senior' });
  });

  it('should normalize client_region to lowercase', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      client_region: 'CAMBODIA',
      client_type: 'sme',
    });
    expect(result.client_region).toBe('cambodia');
  });

  it('should accept valid project_id', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      project_id: 42,
      portfolio_url: 'https://example.com',
    });
    expect(result.project_id).toBe(42);
  });

  // ── Required fields ─────────────────────────────────────────

  it('should throw if user_id is missing', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        client_region: 'cambodia',
        portfolio_url: 'https://example.com',
      })
    ).toThrow(ValidationError);
  });

  it('should throw if client_region is missing', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        user_id: 1,
        portfolio_url: 'https://example.com',
      })
    ).toThrow(ValidationError);
  });

  it('should throw for invalid client_region', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        client_region: 'mars',
        portfolio_url: 'https://example.com',
      })
    ).toThrow(ValidationError);
  });

  // ── Edge-case: nothing useful provided ──────────────────────

  it('should throw when no portfolio_url, text, overrides, or client_type', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({ ...validBase })
    ).toThrow(ValidationError);
  });

  it('should throw when portfolio_url is empty string', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        portfolio_url: '',
      })
    ).toThrow(ValidationError);
  });

  it('should throw when portfolio_url is whitespace only', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        portfolio_url: '   ',
      })
    ).toThrow(ValidationError);
  });

  it('should throw when portfolio_text is whitespace only', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        portfolio_text: '   ',
      })
    ).toThrow(ValidationError);
  });

  it('should throw when overrides is an empty object', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        overrides: {},
      })
    ).toThrow(ValidationError);
  });

  // ── URL validation ──────────────────────────────────────────

  it('should throw for non-HTTP URL', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        portfolio_url: 'ftp://evil.com/file',
      })
    ).toThrow(/HTTP/i);
  });

  it('should throw for javascript: URL', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        portfolio_url: 'javascript:alert(1)',
      })
    ).toThrow(/HTTP/i);
  });

  it('should throw for URL exceeding 500 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(500);
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        portfolio_url: longUrl,
      })
    ).toThrow(/too long/i);
  });

  // ── portfolio_text limits ───────────────────────────────────

  it('should throw for text exceeding 10000 characters', () => {
    const longText = 'a'.repeat(10001);
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        portfolio_text: longText,
      })
    ).toThrow(/too long/i);
  });

  // ── overrides validation ────────────────────────────────────

  it('should reject invalid seniority_level in overrides', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        overrides: { seniority_level: 'legendary' },
      })
    ).toThrow(ValidationError);
  });

  it('should reject invalid portfolio_quality_tier in overrides', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        overrides: { portfolio_quality_tier: 'platinum' },
      })
    ).toThrow(ValidationError);
  });

  it('should reject invalid confidence in overrides', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        overrides: { confidence: 'very_high' },
      })
    ).toThrow(ValidationError);
  });

  it('should ignore arrays for overrides (must be object)', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        overrides: ['seniority_level'],
      })
    ).toThrow(ValidationError);
    // Array is not a plain object, so overrides = undefined, and nothing provided → throw
  });

  it('should accept valid skill_areas array in overrides', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      overrides: { skill_areas: ['logo', 'branding', ''] },
    });
    // empty strings should be filtered out
    expect(result.overrides!.skill_areas).toEqual(['logo', 'branding']);
  });

  it('should truncate specialization to 100 chars', () => {
    const longSpec = 'A'.repeat(200);
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      overrides: { specialization: longSpec },
    });
    expect(result.overrides!.specialization!.length).toBe(100);
  });

  // ── client_type validation ──────────────────────────────────

  it('should reject invalid client_type', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing({
        ...validBase,
        client_type: 'alien',
      })
    ).toThrow(ValidationError);
  });

  // ── use_ai flag ─────────────────────────────────────────────

  it('should coerce use_ai to boolean', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing({
      ...validBase,
      portfolio_url: 'https://example.com',
      use_ai: 0,
    });
    expect(result.use_ai).toBe(false);
  });
});

// ── PDF validation ───────────────────────────────────────────

describe('PricingValidator.validatePortfolioPdf', () => {
  const validPdfBuffer = Buffer.from('%PDF-1.4\n...mock pdf content...');

  it('should accept valid PDF file', () => {
    const file = {
      buffer: validPdfBuffer,
      mimetype: 'application/pdf',
      size: validPdfBuffer.length,
    };
    const result = PricingValidator.validatePortfolioPdf(file);
    expect(result).toBe(validPdfBuffer);
  });

  it('should reject non-PDF mimetype', () => {
    const file = {
      buffer: validPdfBuffer,
      mimetype: 'image/png',
      size: validPdfBuffer.length,
    };
    expect(() => PricingValidator.validatePortfolioPdf(file)).toThrow(
      'portfolio_pdf must be a PDF file (application/pdf)'
    );
  });

  it('should reject files over 20 MB', () => {
    const file = {
      buffer: validPdfBuffer,
      mimetype: 'application/pdf',
      size: 20 * 1024 * 1024 + 1, // 20 MB + 1 byte
    };
    expect(() => PricingValidator.validatePortfolioPdf(file)).toThrow(
      'portfolio_pdf must be under 20 MB'
    );
  });

  it('should reject empty PDF buffer', () => {
    const file = {
      buffer: Buffer.alloc(0),
      mimetype: 'application/pdf',
      size: 0,
    };
    expect(() => PricingValidator.validatePortfolioPdf(file)).toThrow(
      'portfolio_pdf file is empty'
    );
  });

  it('should accept PDF at exactly 20 MB', () => {
    const file = {
      buffer: Buffer.alloc(20 * 1024 * 1024),
      mimetype: 'application/pdf',
      size: 20 * 1024 * 1024,
    };
    const result = PricingValidator.validatePortfolioPdf(file);
    expect(result).toBe(file.buffer);
  });
});

// ── validatePortfolioAssistedPricing with hasPdf flag ────────

describe('PricingValidator.validatePortfolioAssistedPricing with PDF', () => {
  const validBase = {
    user_id: 1,
    client_region: 'cambodia',
  };

  it('should pass with hasPdf=true and no other inputs', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing(
      validBase,
      true // hasPdf
    );
    expect(result.user_id).toBe(1);
    expect(result.client_region).toBe('cambodia');
  });

  it('should reject when hasPdf=false and no other inputs', () => {
    expect(() =>
      PricingValidator.validatePortfolioAssistedPricing(validBase, false)
    ).toThrow('At least one of portfolio_url, portfolio_text, portfolio_pdf, overrides, or client_type is required');
  });

  it('should pass with PDF + portfolio_url', () => {
    const result = PricingValidator.validatePortfolioAssistedPricing(
      {
        ...validBase,
        portfolio_url: 'https://behance.net/user',
      },
      true
    );
    expect(result.portfolio_url).toBe('https://behance.net/user');
  });
});
