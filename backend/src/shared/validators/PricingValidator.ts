import { BaseValidator } from './BaseValidator';
import { SENIORITY_LEVELS, CLIENT_TYPES, CLIENT_REGIONS, PRICING_CONSTANTS } from '../constants';

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
}
