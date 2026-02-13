import { BaseValidator } from './BaseValidator';
import { 
  SENIORITY_LEVELS, 
  CLIENT_TYPES, 
  CLIENT_REGIONS, 
  PRICING_CONSTANTS,
  PORTFOLIO_QUALITY_TIERS,
  PORTFOLIO_CONFIDENCE_LEVELS
} from '../constants';

export class PricingValidator extends BaseValidator {
  
  /**
   * Validate start onboarding request
   */
  static validateStartOnboarding(data: any): number {
    this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
    return this.parsePositiveInt(data.user_id, 'user_id');
  }

  /**
   * Validate answer onboarding question request
   */
  static validateAnswerQuestion(data: any): { session_id: string; user_answer: string } {
    this.throwIf(this.isNullOrEmpty(data?.session_id), 'session_id is required');
    this.throwIf(typeof data.session_id !== 'string', 'session_id must be a string');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    this.throwIf(!uuidRegex.test(data.session_id), 'Invalid session_id format (must be UUID)');
    
    this.throwIf(this.isNullOrEmpty(data?.answer), 'answer is required');
    this.throwIf(typeof data.answer !== 'string', 'answer must be a string');
    this.throwIf(data.answer.length > 500, 'answer is too long (max 500 characters)');
    
    return {
      session_id: data.session_id.trim(),
      user_answer: data.answer.trim()
    };
  }

  /**
   * Validate calculate base rate request
   */
  static validateCalculateBaseRate(data: any): { user_id: number; session_id?: string } {
    this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
    const user_id = this.parsePositiveInt(data.user_id, 'user_id');
    
    let session_id: string | undefined;
    if (data?.session_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      this.throwIf(!uuidRegex.test(data.session_id), 'Invalid session_id format (must be UUID)');
      session_id = data.session_id.trim();
    }
    
    return { user_id, session_id };
  }

  /**
   * Validate get market benchmark request
   */
  static validateGetBenchmark(data: any): { 
    user_id: number; 
    skill_categories?: number[]; 
    seniority_level?: string 
  } {
    this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
    const user_id = this.parsePositiveInt(data.user_id, 'user_id');
    
    let skill_categories: number[] | undefined;
    if (data?.skill_categories && Array.isArray(data.skill_categories)) {
      skill_categories = data.skill_categories.map((id: any) => {
        const num = parseInt(id);
        this.throwIf(isNaN(num) || num < 1, 'skill_categories must contain positive integers');
        return num;
      });
    }
    
    let seniority_level: string | undefined;
    if (data?.seniority_level) {
      const level = data.seniority_level.toLowerCase().trim();
      this.throwIf(
        !SENIORITY_LEVELS.includes(level as any),
        `seniority_level must be one of: ${SENIORITY_LEVELS.join(', ')}`
      );
      seniority_level = level;
    }
    
    return { user_id, skill_categories, seniority_level };
  }

  /**
   * Validate calculate project rate request
   */
  static validateCalculateProjectRate(data: any): { 
    user_id: number; 
    project_id?: number; 
    client_type: string; 
    client_region: string 
  } {
    this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
    const user_id = this.parsePositiveInt(data.user_id, 'user_id');
    
    let project_id: number | undefined;
    if (data?.project_id) {
      project_id = this.parsePositiveInt(data.project_id, 'project_id');
    }
    
    this.throwIf(this.isNullOrEmpty(data?.client_type), 'client_type is required');
    const client_type = data.client_type.toLowerCase().trim();
    this.throwIf(
      !CLIENT_TYPES.includes(client_type as any),
      `client_type must be one of: ${CLIENT_TYPES.join(', ')}`
    );
    
    this.throwIf(this.isNullOrEmpty(data?.client_region), 'client_region is required');
    const client_region = data.client_region.toLowerCase().trim();
    this.throwIf(
      !CLIENT_REGIONS.includes(client_region as any),
      `client_region must be one of: ${CLIENT_REGIONS.join(', ')}`
    );
    
    return { user_id, project_id, client_type, client_region };
  }

  /**
   * Validate session_id path parameter
   */
  static validateSessionId(sessionId: any): string {
    this.throwIf(this.isNullOrEmpty(sessionId), 'session_id is required');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    this.throwIf(!uuidRegex.test(sessionId), 'Invalid session_id format (must be UUID)');
    return sessionId.trim();
  }

  /**
   * Validate update pricing profile request
   */
  static validateUpdateProfile(data: any): Record<string, any> {
    const validFields = [
      'fixed_costs', 'variable_costs', 'desired_monthly_income',
      'billable_hours_per_month', 'profit_margin', 'seniority_level'
    ];
    
    const updates: Record<string, any> = {};
    let hasUpdate = false;
    
    if (data?.fixed_costs && typeof data.fixed_costs === 'object') {
      updates.fixed_costs = this.validateCosts(data.fixed_costs, 'fixed_costs');
      hasUpdate = true;
    }
    
    if (data?.variable_costs && typeof data.variable_costs === 'object') {
      updates.variable_costs = this.validateCosts(data.variable_costs, 'variable_costs');
      hasUpdate = true;
    }
    
    if (data?.desired_monthly_income !== undefined) {
      const income = parseFloat(data.desired_monthly_income);
      this.throwIf(isNaN(income) || income < 0, 'desired_monthly_income must be a non-negative number');
      this.throwIf(income > 100000, 'desired_monthly_income seems unrealistically high');
      updates.desired_monthly_income = income;
      hasUpdate = true;
    }
    
    if (data?.billable_hours_per_month !== undefined) {
      const hours = parseInt(data.billable_hours_per_month);
      this.throwIf(isNaN(hours), 'billable_hours_per_month must be a number');
      this.throwIf(
        hours < PRICING_CONSTANTS.MIN_BILLABLE_HOURS || hours > PRICING_CONSTANTS.MAX_BILLABLE_HOURS,
        `billable_hours_per_month must be between ${PRICING_CONSTANTS.MIN_BILLABLE_HOURS} and ${PRICING_CONSTANTS.MAX_BILLABLE_HOURS}`
      );
      updates.billable_hours_per_month = hours;
      hasUpdate = true;
    }
    
    if (data?.profit_margin !== undefined) {
      const margin = parseFloat(data.profit_margin);
      this.throwIf(isNaN(margin), 'profit_margin must be a number');
      this.throwIf(
        margin < PRICING_CONSTANTS.MIN_PROFIT_MARGIN || margin > PRICING_CONSTANTS.MAX_PROFIT_MARGIN,
        `profit_margin must be between ${PRICING_CONSTANTS.MIN_PROFIT_MARGIN} and ${PRICING_CONSTANTS.MAX_PROFIT_MARGIN}`
      );
      updates.profit_margin = margin;
      hasUpdate = true;
    }
    
    if (data?.seniority_level) {
      const level = data.seniority_level.toLowerCase().trim();
      this.throwIf(
        !SENIORITY_LEVELS.includes(level as any),
        `seniority_level must be one of: ${SENIORITY_LEVELS.join(', ')}`
      );
      updates.seniority_level = level;
      hasUpdate = true;
    }
    
    this.throwIf(!hasUpdate, 'At least one field must be provided for update');
    
    return updates;
  }

  private static validateCosts(costs: any, fieldName: string): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(costs)) {
      if (value !== undefined && value !== null) {
        const num = parseFloat(value as string);
        this.throwIf(isNaN(num) || num < 0, `${fieldName}.${key} must be a non-negative number`);
        result[key] = num;
      }
    }
    
    return result;
  }

  /**
   * Validate quick estimate request (AI-powered estimation for beginners)
   */
  static validateQuickEstimate(data: any): {
    user_id: number;
    skills: string;
    experience_level: 'beginner' | 'intermediate' | 'experienced' | 'expert';
    client_type?: 'startup' | 'sme' | 'corporate' | 'ngo' | 'government';
    hours_per_week: number;
    region?: string;
  } {
    this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
    const user_id = this.parsePositiveInt(data.user_id, 'user_id');

    this.throwIf(this.isNullOrEmpty(data?.skills), 'skills is required');
    this.throwIf(typeof data.skills !== 'string', 'skills must be a string');
    this.throwIf(data.skills.length > 200, 'skills is too long (max 200 characters)');
    const skills = data.skills.trim();

    this.throwIf(this.isNullOrEmpty(data?.experience_level), 'experience_level is required');
    const validExperienceLevels = ['beginner', 'intermediate', 'experienced', 'expert'];
    const experience_level = data.experience_level.toLowerCase().trim();
    this.throwIf(
      !validExperienceLevels.includes(experience_level),
      `experience_level must be one of: ${validExperienceLevels.join(', ')}`
    );

    this.throwIf(this.isNullOrEmpty(data?.hours_per_week), 'hours_per_week is required');
    const hours_per_week = parseInt(data.hours_per_week);
    this.throwIf(isNaN(hours_per_week), 'hours_per_week must be a number');
    this.throwIf(hours_per_week < 5 || hours_per_week > 80, 'hours_per_week must be between 5 and 80');

    let client_type: 'startup' | 'sme' | 'corporate' | 'ngo' | 'government' | undefined;
    if (data?.client_type) {
      const ct = data.client_type.toLowerCase().trim();
      this.throwIf(
        !CLIENT_TYPES.includes(ct as any),
        `client_type must be one of: ${CLIENT_TYPES.join(', ')}`
      );
      client_type = ct as any;
    }

    let region: string | undefined;
    if (data?.region) {
      region = data.region.toLowerCase().trim();
    }

    return {
      user_id,
      skills,
      experience_level: experience_level as any,
      client_type,
      hours_per_week,
      region
    };
  }

  /**
   * Validate portfolio-assisted pricing request
   */
  static validatePortfolioAssistedPricing(data: any, hasPdf: boolean = false): {
    user_id: number;
    project_id?: number;
    client_region: string;
    portfolio_url?: string;
    portfolio_text?: string;
    client_type?: string;
    use_ai?: boolean;
    experience_years?: number;
    skills?: string;
    hours_per_week?: number;
    overrides?: {
      seniority_level?: string;
      skill_areas?: string[];
      specialization?: string;
      portfolio_quality_tier?: string;
      client_readiness?: string;
      confidence?: string;
      market_benchmark_category?: string;
    };
  } {
    this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
    const user_id = this.parsePositiveInt(data.user_id, 'user_id');

    let project_id: number | undefined;
    if (data?.project_id) {
      project_id = this.parsePositiveInt(data.project_id, 'project_id');
    }

    this.throwIf(this.isNullOrEmpty(data?.client_region), 'client_region is required');
    const client_region = data.client_region.toLowerCase().trim();
    this.throwIf(
      !CLIENT_REGIONS.includes(client_region as any),
      `client_region must be one of: ${CLIENT_REGIONS.join(', ')}`
    );

    let portfolio_url: string | undefined;
    if (data?.portfolio_url != null && data.portfolio_url !== '') {
      this.throwIf(typeof data.portfolio_url !== 'string', 'portfolio_url must be a string');
      const trimmedUrl = data.portfolio_url.trim();
      if (trimmedUrl.length > 0) {
        this.throwIf(trimmedUrl.length > 500, 'portfolio_url is too long (max 500 characters)');
        this.throwIf(
          !/^https?:\/\/.+/i.test(trimmedUrl),
          'portfolio_url must be a valid HTTP or HTTPS URL'
        );
        portfolio_url = trimmedUrl;
      }
    }

    let portfolio_text: string | undefined;
    if (data?.portfolio_text != null && data.portfolio_text !== '') {
      this.throwIf(typeof data.portfolio_text !== 'string', 'portfolio_text must be a string');
      const trimmedText = data.portfolio_text.trim();
      if (trimmedText.length > 0) {
        this.throwIf(trimmedText.length > 10000, 'portfolio_text is too long (max 10000 characters)');
        portfolio_text = trimmedText;
      }
    }

    let client_type: string | undefined;
    if (data?.client_type) {
      const ct = data.client_type.toLowerCase().trim();
      this.throwIf(
        !CLIENT_TYPES.includes(ct as any),
        `client_type must be one of: ${CLIENT_TYPES.join(', ')}`
      );
      client_type = ct;
    }

    let use_ai: boolean | undefined;
    if (data?.use_ai !== undefined) {
      use_ai = Boolean(data.use_ai);
    }

    let overrides: any | undefined;
    if (data?.overrides && typeof data.overrides === 'object' && !Array.isArray(data.overrides)) {
      overrides = {};

      if (data.overrides.seniority_level) {
        const level = String(data.overrides.seniority_level).toLowerCase().trim();
        this.throwIf(
          !SENIORITY_LEVELS.includes(level as any),
          `overrides.seniority_level must be one of: ${SENIORITY_LEVELS.join(', ')}`
        );
        overrides.seniority_level = level;
      }

      if (Array.isArray(data.overrides.skill_areas)) {
        const skills = data.overrides.skill_areas
          .filter((item: any) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
        overrides.skill_areas = skills;
      }

      if (data.overrides.specialization) {
        this.throwIf(typeof data.overrides.specialization !== 'string', 'overrides.specialization must be a string');
        overrides.specialization = data.overrides.specialization.trim().substring(0, 100);
      }

      if (data.overrides.portfolio_quality_tier) {
        const tier = String(data.overrides.portfolio_quality_tier).toLowerCase().trim();
        this.throwIf(
          !PORTFOLIO_QUALITY_TIERS.includes(tier as any),
          `overrides.portfolio_quality_tier must be one of: ${PORTFOLIO_QUALITY_TIERS.join(', ')}`
        );
        overrides.portfolio_quality_tier = tier;
      }

      if (data.overrides.client_readiness) {
        const readiness = String(data.overrides.client_readiness).toLowerCase().trim();
        this.throwIf(
          !CLIENT_TYPES.includes(readiness as any),
          `overrides.client_readiness must be one of: ${CLIENT_TYPES.join(', ')}`
        );
        overrides.client_readiness = readiness;
      }

      if (data.overrides.confidence) {
        const confidence = String(data.overrides.confidence).toLowerCase().trim();
        this.throwIf(
          !PORTFOLIO_CONFIDENCE_LEVELS.includes(confidence as any),
          `overrides.confidence must be one of: ${PORTFOLIO_CONFIDENCE_LEVELS.join(', ')}`
        );
        overrides.confidence = confidence;
      }

      if (data.overrides.market_benchmark_category) {
        this.throwIf(typeof data.overrides.market_benchmark_category !== 'string', 'overrides.market_benchmark_category must be a string');
        overrides.market_benchmark_category = data.overrides.market_benchmark_category.trim().substring(0, 100);
      }

      // Discard overrides if all fields ended up empty/undefined
      if (Object.keys(overrides).length === 0) {
        overrides = undefined;
      }
    }

    this.throwIf(
      !portfolio_url && !portfolio_text && !hasPdf && !overrides && !client_type,
      'At least one of portfolio_url, portfolio_text, portfolio_pdf, overrides, or client_type is required'
    );

    // Validate new structured fields for AI rate recommendation
    let experience_years: number | undefined;
    if (data?.experience_years !== undefined && data?.experience_years !== null && data?.experience_years !== '') {
      experience_years = parseInt(data.experience_years);
      this.throwIf(isNaN(experience_years), 'experience_years must be a number');
      this.throwIf(experience_years < 0 || experience_years > 50, 'experience_years must be between 0 and 50');
    }

    let skills: string | undefined;
    if (data?.skills != null && data.skills !== '') {
      this.throwIf(typeof data.skills !== 'string', 'skills must be a string');
      const trimmedSkills = data.skills.trim();
      if (trimmedSkills.length > 0) {
        this.throwIf(trimmedSkills.length > 200, 'skills is too long (max 200 characters)');
        skills = trimmedSkills;
      }
    }

    let hours_per_week: number | undefined;
    if (data?.hours_per_week !== undefined && data?.hours_per_week !== null && data?.hours_per_week !== '') {
      hours_per_week = parseInt(data.hours_per_week);
      this.throwIf(isNaN(hours_per_week), 'hours_per_week must be a number');
      this.throwIf(hours_per_week < 5 || hours_per_week > 80, 'hours_per_week must be between 5 and 80');
    }

    return {
      user_id,
      project_id,
      client_region,
      portfolio_url,
      portfolio_text,
      client_type,
      use_ai,
      experience_years,
      skills,
      hours_per_week,
      overrides
    };
  }

  /**
   * Validate accept portfolio rate request
   */
  static validateAcceptRate(data: any): {
    user_id: number;
    hourly_rate: number;
    seniority_level?: string;
    skill_categories?: number[];
    experience_years?: number;
    researched_costs?: {
      workspace?: number;
      software?: number;
      equipment?: number;
      utilities?: number;
      materials?: number;
    };
    desired_monthly_income?: number;
    billable_hours_per_month?: number;
    profit_margin?: number;
  } {
    this.throwIf(this.isNullOrEmpty(data?.user_id), 'user_id is required');
    const user_id = this.parsePositiveInt(data.user_id, 'user_id');

    this.throwIf(this.isNullOrEmpty(data?.hourly_rate), 'hourly_rate is required');
    const hourly_rate = parseFloat(data.hourly_rate);
    this.throwIf(isNaN(hourly_rate), 'hourly_rate must be a number');
    this.throwIf(hourly_rate <= 0, 'hourly_rate must be greater than 0');

    let seniority_level: string | undefined;
    if (data?.seniority_level) {
      const level = String(data.seniority_level).toLowerCase().trim();
      this.throwIf(
        !SENIORITY_LEVELS.includes(level as any),
        `seniority_level must be one of: ${SENIORITY_LEVELS.join(', ')}`
      );
      seniority_level = level;
    }

    let skill_categories: number[] | undefined;
    if (Array.isArray(data?.skill_categories)) {
      skill_categories = data.skill_categories
        .filter((item: any) => typeof item === 'number' || typeof item === 'string')
        .map((item: any) => parseInt(item))
        .filter((item: number) => !isNaN(item) && item > 0);
    }

    let experience_years: number | undefined;
    if (data?.experience_years !== undefined && data?.experience_years !== null && data?.experience_years !== '') {
      experience_years = parseInt(data.experience_years);
      this.throwIf(isNaN(experience_years), 'experience_years must be a number');
      this.throwIf(experience_years < 0 || experience_years > 50, 'experience_years must be between 0 and 50');
    }

    let researched_costs: any | undefined;
    if (data?.researched_costs && typeof data.researched_costs === 'object') {
      researched_costs = {};
      const costFields = ['workspace', 'software', 'equipment', 'utilities', 'materials'];
      for (const field of costFields) {
        if (data.researched_costs[field] !== undefined && data.researched_costs[field] !== null) {
          const value = parseFloat(data.researched_costs[field]);
          this.throwIf(isNaN(value), `researched_costs.${field} must be a number`);
          this.throwIf(value < 0, `researched_costs.${field} must be non-negative`);
          researched_costs[field] = value;
        }
      }
    }

    let desired_monthly_income: number | undefined;
    if (data?.desired_monthly_income !== undefined && data?.desired_monthly_income !== null && data?.desired_monthly_income !== '') {
      desired_monthly_income = parseFloat(data.desired_monthly_income);
      this.throwIf(isNaN(desired_monthly_income), 'desired_monthly_income must be a number');
      this.throwIf(desired_monthly_income < 0, 'desired_monthly_income must be non-negative');
    }

    let billable_hours_per_month: number | undefined;
    if (data?.billable_hours_per_month !== undefined && data?.billable_hours_per_month !== null && data?.billable_hours_per_month !== '') {
      billable_hours_per_month = parseFloat(data.billable_hours_per_month);
      this.throwIf(isNaN(billable_hours_per_month), 'billable_hours_per_month must be a number');
      this.throwIf(
        billable_hours_per_month < 40 || billable_hours_per_month > 200,
        'billable_hours_per_month must be between 40 and 200'
      );
    }

    let profit_margin: number | undefined;
    if (data?.profit_margin !== undefined && data?.profit_margin !== null && data?.profit_margin !== '') {
      profit_margin = parseFloat(data.profit_margin);
      this.throwIf(isNaN(profit_margin), 'profit_margin must be a number');
      this.throwIf(
        profit_margin < 0.05 || profit_margin > 0.50,
        'profit_margin must be between 0.05 and 0.50 (5% and 50%)'
      );
    }

    return {
      user_id,
      hourly_rate,
      seniority_level,
      skill_categories,
      experience_years,
      researched_costs,
      desired_monthly_income,
      billable_hours_per_month,
      profit_margin
    };
  }

  /**
   * Validate a PDF buffer for portfolio analysis.
   * Called separately from the main validator because the buffer comes from multer.
   */
  static validatePortfolioPdf(file: { buffer: Buffer; mimetype: string; size: number }): Buffer {
    PricingValidator.throwIf(
      file.mimetype !== 'application/pdf',
      'portfolio_pdf must be a PDF file (application/pdf)'
    );
    PricingValidator.throwIf(
      file.size > 20 * 1024 * 1024,
      'portfolio_pdf must be under 20 MB'
    );
    PricingValidator.throwIf(
      file.buffer.length === 0,
      'portfolio_pdf file is empty'
    );
    return file.buffer;
  }
}
