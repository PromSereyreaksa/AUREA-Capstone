import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { PricingProfile } from '../../domain/entities/PricingProfile';
import { FixedCosts } from '../../domain/entities/FixedCosts';
import { VariableCosts } from '../../domain/entities/VariableCosts';
import { SeniorityLevel, SeniorityMultiplier } from '../../domain/entities/SeniorityLevel';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { SENIORITY_LEVELS } from '../../shared/constants';

interface AcceptPortfolioRateInput {
  user_id: number;
  hourly_rate: number;
  seniority_level?: string;
  skill_categories?: number[];
  experience_years?: number;
  // Optional cost breakdown from AI research
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
}

interface AcceptPortfolioRateOutput {
  pricing_profile: {
    pricing_profile_id: number;
    user_id: number;
    base_hourly_rate: number;
    seniority_level: string;
    experience_years: number;
    skill_categories: number[];
    fixed_costs: {
      rent: number;
      equipment: number;
      insurance: number;
      utilities: number;
      taxes: number;
      total: number;
    };
    variable_costs: {
      materials: number;
      outsourcing: number;
      marketing: number;
      total: number;
    };
    desired_monthly_income: number;
    billable_hours_per_month: number;
    profit_margin: number;
    created_at?: Date;
    updated_at?: Date;
  };
  action: 'created' | 'updated';
  message: string;
}

/**
 * Accept and save an AI-recommended rate to the user's pricing profile
 * 
 * This use case allows users to accept a rate recommended by the portfolio-assisted
 * pricing flow and save it to their pricing profile. If a profile doesn't exist,
 * it creates one with sensible defaults or AI-researched costs.
 */
export class AcceptPortfolioRate {
  constructor(private pricingProfileRepo: IPricingProfileRepository) {}

  async execute(input: AcceptPortfolioRateInput): Promise<AcceptPortfolioRateOutput> {
    // Validate hourly rate
    if (input.hourly_rate <= 0) {
      throw new ValidationError('Hourly rate must be greater than 0');
    }

    // Validate seniority level if provided
    let seniorityLevel: SeniorityLevel = SeniorityLevel.MID; // Default
    if (input.seniority_level) {
      const normalized = input.seniority_level.toLowerCase().trim();
      if (!SENIORITY_LEVELS.includes(normalized as any)) {
        throw new ValidationError(`Invalid seniority level. Must be one of: ${SENIORITY_LEVELS.join(', ')}`);
      }
      seniorityLevel = SeniorityMultiplier.validate(normalized);
    }

    // Fetch existing pricing profile
    const existingProfile = await this.pricingProfileRepo.findByUserId(input.user_id);

    let action: 'created' | 'updated';
    let profile: PricingProfile;

    if (existingProfile) {
      // Update existing profile
      action = 'updated';

      // Preserve existing costs unless AI-researched costs are provided
      const fixedCosts = input.researched_costs
        ? new FixedCosts(
            input.researched_costs.workspace || existingProfile.fixed_costs.rent,
            input.researched_costs.equipment || existingProfile.fixed_costs.equipment,
            existingProfile.fixed_costs.insurance,
            input.researched_costs.utilities || existingProfile.fixed_costs.utilities,
            existingProfile.fixed_costs.taxes
          )
        : existingProfile.fixed_costs;

      const variableCosts = input.researched_costs?.materials
        ? new VariableCosts(
            input.researched_costs.materials,
            existingProfile.variable_costs.outsourcing,
            existingProfile.variable_costs.marketing
          )
        : existingProfile.variable_costs;

      profile = await this.pricingProfileRepo.update(existingProfile.pricing_profile_id, {
        base_hourly_rate: input.hourly_rate,
        seniority_level: seniorityLevel,
        experience_years: input.experience_years ?? existingProfile.experience_years,
        skill_categories: input.skill_categories ?? existingProfile.skill_categories,
        fixed_costs: fixedCosts,
        variable_costs: variableCosts,
        desired_monthly_income: input.desired_monthly_income ?? existingProfile.desired_monthly_income,
        billable_hours_per_month: input.billable_hours_per_month ?? existingProfile.billable_hours_per_month,
        profit_margin: input.profit_margin ?? existingProfile.profit_margin
      });
    } else {
      // Create new profile with AI-researched costs or sensible defaults
      action = 'created';

      const fixedCosts = new FixedCosts(
        input.researched_costs?.workspace ?? 50,  // Default: $50/mo coworking
        input.researched_costs?.equipment ?? 30,   // Default: $30/mo equipment amortization
        10,  // Default: $10/mo insurance
        input.researched_costs?.utilities ?? 30,   // Default: $30/mo internet + electricity
        0    // Default: $0 taxes (will vary by location)
      );

      const variableCosts = new VariableCosts(
        input.researched_costs?.materials ?? 20,  // Default: $20/mo stock photos, fonts, etc.
        0,   // Default: $0 outsourcing
        10   // Default: $10/mo marketing/portfolio hosting
      );

      // Estimate desired income and billable hours from the accepted rate
      // Using reverse UREA: if they accepted rate X, back-calculate reasonable values
      const billableHours = input.billable_hours_per_month ?? 80; // Default: 20 hours/week × 4 weeks
      const profitMargin = input.profit_margin ?? 0.15;
      
      // Reverse UREA: desiredIncome = (rate × billableHours) - costs - profit
      const totalCosts = fixedCosts.total() + variableCosts.total();
      const monthlyRevenue = input.hourly_rate * billableHours;
      const desiredIncome = input.desired_monthly_income ?? Math.max(
        300, // Minimum $300/mo
        monthlyRevenue - totalCosts - (totalCosts * profitMargin)
      );

      profile = new PricingProfile(
        0, // Will be set by database
        input.user_id,
        fixedCosts,
        variableCosts,
        desiredIncome,
        billableHours,
        profitMargin,
        input.experience_years ?? this.estimateExperienceFromRate(input.hourly_rate),
        seniorityLevel,
        input.skill_categories ?? [],
        input.hourly_rate
      );

      profile = await this.pricingProfileRepo.create(profile);
    }

    return {
      pricing_profile: {
        pricing_profile_id: profile.pricing_profile_id,
        user_id: profile.user_id,
        base_hourly_rate: profile.base_hourly_rate!,
        seniority_level: profile.seniority_level,
        experience_years: profile.experience_years,
        skill_categories: profile.skill_categories,
        fixed_costs: {
          rent: profile.fixed_costs.rent,
          equipment: profile.fixed_costs.equipment,
          insurance: profile.fixed_costs.insurance,
          utilities: profile.fixed_costs.utilities,
          taxes: profile.fixed_costs.taxes,
          total: profile.fixed_costs.total()
        },
        variable_costs: {
          materials: profile.variable_costs.materials,
          outsourcing: profile.variable_costs.outsourcing,
          marketing: profile.variable_costs.marketing,
          total: profile.variable_costs.total()
        },
        desired_monthly_income: profile.desired_monthly_income,
        billable_hours_per_month: profile.billable_hours_per_month,
        profit_margin: profile.profit_margin,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      action,
      message: action === 'created'
        ? 'Pricing profile created successfully with accepted rate'
        : 'Pricing profile updated successfully with accepted rate'
    };
  }

  /**
   * Estimate experience years from hourly rate using simple heuristics
   */
  private estimateExperienceFromRate(rate: number): number {
    if (rate < 8) return 1;   // Junior: <$8/hr → ~1 year
    if (rate < 15) return 3;  // Mid: $8-15/hr → ~3 years
    if (rate < 25) return 6;  // Senior: $15-25/hr → ~6 years
    return 10;                // Expert: >$25/hr → ~10 years
  }
}
