import { PricingProfile } from '../../domain/entities/PricingProfile';
import { FixedCosts } from '../../domain/entities/FixedCosts';
import { VariableCosts } from '../../domain/entities/VariableCosts';
import { SeniorityLevel } from '../../domain/entities/SeniorityLevel';

export function mapPricingProfileToDb(profile: PricingProfile) {
  return {
    user_id: profile.user_id,
    ...profile.fixed_costs.toDb(),
    ...profile.variable_costs.toDb(),
    desired_monthly_income: profile.desired_monthly_income,
    billable_hours_per_month: profile.billable_hours_per_month,
    profit_margin: profile.profit_margin,
    experience_years: profile.experience_years,
    seniority_level: profile.seniority_level,
    base_hourly_rate: profile.base_hourly_rate
  };
}

export function mapPricingProfileFromDb(data: any): PricingProfile {
  const fixedCosts = FixedCosts.fromDb({
    rent: data.fixed_cost_rent || 0,
    equipment: data.fixed_cost_equipment || 0,
    insurance: data.fixed_cost_insurance || 0,
    utilities: data.fixed_cost_utilities || 0,
    taxes: data.fixed_cost_taxes || 0
  });

  const variableCosts = VariableCosts.fromDb({
    materials: data.variable_cost_materials || 0,
    outsourcing: data.variable_cost_outsourcing || 0,
    marketing: data.variable_cost_marketing || 0
  });

  // Note: skill_categories will be fetched separately from user_category table
  return new PricingProfile(
    data.pricing_profile_id,
    data.user_id,
    fixedCosts,
    variableCosts,
    data.desired_monthly_income,
    data.billable_hours_per_month,
    data.profit_margin,
    data.experience_years || 0,
    data.seniority_level as SeniorityLevel,
    [], // skill_categories loaded separately
    data.base_hourly_rate,
    data.created_at,
    data.updated_at
  );
}
