import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { IOnboardingSessionRepository } from '../../domain/repositories/IOnboardingSessionRepository';
import { PricingProfile } from '../../domain/entities/PricingProfile';
import { FixedCosts } from '../../domain/entities/FixedCosts';
import { VariableCosts } from '../../domain/entities/VariableCosts';
import { SeniorityLevel, SeniorityMultiplier } from '../../domain/entities/SeniorityLevel';
import { PricingCalculatorService } from '../../infrastructure/services/PricingCalculatorService';

interface CalculateBaseRateInput {
  user_id: number;
  session_id?: string; // Optional: if called after onboarding completion
  onboarding_data?: Record<string, any>; // Optional: if provided directly from frontend
}

interface CalculateBaseRateOutput {
  base_hourly_rate: number;
  breakdown: {
    fixed_costs_total: number;
    variable_costs_total: number;
    desired_income: number;
    total_monthly_costs: number;
    profit_margin_percentage: number;
    profit_amount: number;
    total_required: number;
    billable_hours: number;
  };
  created_profile: boolean;
}

export class CalculateBaseRate {
  constructor(
    private pricingProfileRepo: IPricingProfileRepository,
    private onboardingSessionRepo: IOnboardingSessionRepository
  ) {}

  async execute(input: CalculateBaseRateInput): Promise<CalculateBaseRateOutput> {
    // 1. Check if user already has a pricing profile
    let existingProfile = await this.pricingProfileRepo.findByUserId(input.user_id);
    
    // 2. If session_id provided, get onboarding data
    let onboardingData: Record<string, any> = input.onboarding_data || {};
    if (input.session_id) {
      const session = await this.onboardingSessionRepo.findById(input.session_id);
      if (!session || session.status !== 'completed') {
        throw new Error('Onboarding session not found or not completed');
      }
      onboardingData = session.collected_data;
    }

    // 3. If no existing profile and no onboarding data, throw error
    if (!existingProfile && Object.keys(onboardingData).length === 0) {
      throw new Error('No pricing profile found. Please complete onboarding first.');
    }

    // 4. Extract data from onboarding or use existing profile
    const profileData = this.extractProfileData(onboardingData, existingProfile);

    // 5. Calculate base rate using UREA formula
    const calculation = PricingCalculatorService.calculateWithBreakdown(
      profileData.fixedCosts,
      profileData.variableCosts,
      profileData.desiredIncome,
      profileData.profitMargin,
      profileData.billableHours
    );

    // 6. Save or update pricing profile
    const createdProfile = await this.saveProfile(
      input.user_id,
      profileData,
      calculation.base_hourly_rate,
      existingProfile
    );

    return {
      base_hourly_rate: calculation.base_hourly_rate,
      breakdown: calculation.breakdown,
      created_profile: createdProfile
    };
  }

  private extractProfileData(
    onboardingData: Record<string, any>,
    existingProfile: PricingProfile | null
  ): {
    fixedCosts: FixedCosts;
    variableCosts: VariableCosts;
    desiredIncome: number;
    profitMargin: number;
    billableHours: number;
    experienceYears: number;
    seniorityLevel: SeniorityLevel;
    skillCategories: number[];
  } {
    if (Object.keys(onboardingData).length > 0) {
      // Extract from onboarding data
      // Parse utilities/insurance/taxes (combined question)
      const combinedCosts = parseFloat(onboardingData.fixed_costs_utilities_insurance_taxes || 0);
      const utilitiesCost = combinedCosts * 0.4; // Estimate split
      const insuranceCost = combinedCosts * 0.3;
      const taxesCost = combinedCosts * 0.3;

      const fixedCosts = new FixedCosts(
        parseFloat(onboardingData.fixed_costs_rent || 0),
        parseFloat(onboardingData.fixed_costs_equipment || 0),
        insuranceCost,
        utilitiesCost,
        taxesCost
      );

      const variableCosts = new VariableCosts(
        parseFloat(onboardingData.variable_costs_materials || 0),
        0, // Outsourcing not asked in onboarding
        0  // Marketing not asked in onboarding
      );

      const seniorityLevel = SeniorityMultiplier.validate(
        onboardingData.seniority_level || 'mid'
      );

      return {
        fixedCosts,
        variableCosts,
        desiredIncome: parseFloat(onboardingData.desired_income || 0),
        profitMargin: parseFloat(onboardingData.profit_margin || 0.15),
        billableHours: parseInt(onboardingData.billable_hours || 100),
        experienceYears: parseInt(onboardingData.experience_years || 0),
        seniorityLevel,
        skillCategories: [] // Will be mapped from skills string separately
      };
    } else if (existingProfile) {
      // Use existing profile
      return {
        fixedCosts: existingProfile.fixed_costs,
        variableCosts: existingProfile.variable_costs,
        desiredIncome: existingProfile.desired_monthly_income,
        profitMargin: existingProfile.profit_margin,
        billableHours: existingProfile.billable_hours_per_month,
        experienceYears: existingProfile.experience_years,
        seniorityLevel: existingProfile.seniority_level,
        skillCategories: existingProfile.skill_categories
      };
    }

    throw new Error('Cannot extract profile data');
  }

  private async saveProfile(
    userId: number,
    profileData: any,
    calculatedRate: number,
    existingProfile: PricingProfile | null
  ): Promise<boolean> {
    if (existingProfile) {
      // Update existing profile
      await this.pricingProfileRepo.update(existingProfile.pricing_profile_id, {
        fixed_costs: profileData.fixedCosts,
        variable_costs: profileData.variableCosts,
        desired_monthly_income: profileData.desiredIncome,
        billable_hours_per_month: profileData.billableHours,
        profit_margin: profileData.profitMargin,
        experience_years: profileData.experienceYears,
        seniority_level: profileData.seniorityLevel,
        base_hourly_rate: calculatedRate
      });
      return false; // Updated, not created
    } else {
      // Create new profile
      const newProfile = new PricingProfile(
        0,
        userId,
        profileData.fixedCosts,
        profileData.variableCosts,
        profileData.desiredIncome,
        profileData.billableHours,
        profileData.profitMargin,
        profileData.experienceYears,
        profileData.seniorityLevel,
        profileData.skillCategories,
        calculatedRate
      );

      await this.pricingProfileRepo.create(newProfile);
      return true; // Created
    }
  }
}
