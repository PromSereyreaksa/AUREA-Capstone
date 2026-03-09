import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { ClientContext } from '../../domain/entities/ClientContext';
import { SeniorityMultiplier } from '../../domain/entities/SeniorityLevel';
import { DifficultyMultiplier } from '../../domain/entities/DifficultyLevel';
import { LicensingMultiplier } from '../../domain/entities/LicensingLevel';
import { PricingCalculatorService } from '../../infrastructure/services/PricingCalculatorService';

interface CalculateProjectRateInput {
  user_id: number;
  project_id?: number;  // Optional: if provided, will update project's calculated_rate
  client_type: string;
  client_region: string;
  seniority_level_override?: string;
}

export interface CalculateProjectRateOutput {
  base_rate: number;
  seniority_level: string;
  seniority_multiplier: number;
  client_type: string;
  client_region: string;
  context_multiplier: number;
  final_hourly_rate: number;
  monthly_revenue_estimate?: number;
  annual_revenue_estimate?: number;
  duration_hours?: number;
  difficulty_multiplier?: number;
  licensing_multiplier?: number;
  total_project_price?: number;
  project_updated: boolean;
}

export class CalculateProjectRate {
  constructor(
    private pricingProfileRepo: IPricingProfileRepository,
    private projectPriceRepo: IProjectPriceRepository
  ) {}

  async execute(input: CalculateProjectRateInput): Promise<CalculateProjectRateOutput> {
    // 1. Fetch user's pricing profile
    const pricingProfile = await this.pricingProfileRepo.findByUserId(input.user_id);
    
    if (!pricingProfile) {
      throw new Error('Pricing profile not found. Please complete onboarding first.');
    }

    if (!pricingProfile.base_hourly_rate) {
      throw new Error('Base hourly rate not calculated. Please calculate base rate first.');
    }

    // 2. Create client context
    const clientContext = ClientContext.fromStrings(input.client_type, input.client_region);

    // 3. Determine seniority level (allow override)
    const seniorityLevel = input.seniority_level_override
      ? SeniorityMultiplier.validate(input.seniority_level_override)
      : pricingProfile.seniority_level;

    // 4. Calculate project rate with breakdown
    const calculation = PricingCalculatorService.calculateProjectRateWithBreakdown(
      pricingProfile.base_hourly_rate,
      seniorityLevel,
      clientContext
    );

    // 5. Calculate revenue estimates
    const monthlyRevenue = PricingCalculatorService.estimateMonthlyRevenue(
      calculation.final_hourly_rate,
      pricingProfile.billable_hours_per_month
    );

    const annualRevenue = PricingCalculatorService.estimateAnnualRevenue(
      calculation.final_hourly_rate,
      pricingProfile.billable_hours_per_month
    );

    // 6. Update project if project_id provided
    let projectUpdated = false;
    let durationHours: number | undefined;
    let difficultyMultiplier: number | undefined;
    let licensingMultiplier: number | undefined;
    let totalProjectPrice: number | undefined;

    if (input.project_id) {
      const updatedProjectData = await this.updateProjectRate(
        input.project_id,
        calculation.final_hourly_rate,
        input.client_type,
        input.client_region
      );

      projectUpdated = updatedProjectData.updated;
      durationHours = updatedProjectData.duration_hours;
      difficultyMultiplier = updatedProjectData.difficulty_multiplier;
      licensingMultiplier = updatedProjectData.licensing_multiplier;
      totalProjectPrice = updatedProjectData.total_project_price;
    }

    return {
      base_rate: calculation.base_rate,
      seniority_level: calculation.seniority_level,
      seniority_multiplier: calculation.seniority_multiplier,
      client_type: calculation.client_type!,
      client_region: calculation.client_region!,
      context_multiplier: calculation.context_multiplier,
      final_hourly_rate: calculation.final_hourly_rate,
      monthly_revenue_estimate: monthlyRevenue,
      annual_revenue_estimate: annualRevenue,
      duration_hours: durationHours,
      difficulty_multiplier: difficultyMultiplier,
      licensing_multiplier: licensingMultiplier,
      total_project_price: totalProjectPrice,
      project_updated: projectUpdated
    };
  }

  private async updateProjectRate(
    projectId: number,
    finalHourlyRate: number,
    clientType: string,
    clientRegion: string
  ): Promise<{
    updated: boolean;
    duration_hours?: number;
    difficulty_multiplier?: number;
    licensing_multiplier?: number;
    total_project_price?: number;
  }> {
    try {
      // First check if project exists
      const project = await this.projectPriceRepo.findById(projectId);
      
      if (!project) {
        console.warn(`Project ${projectId} not found, skipping update`);
        return { updated: false };
      }

      const durationHours = project.duration || 1;
      const difficultyMultiplier = DifficultyMultiplier.getMultiplier(project.difficulty);
      const licensingMultiplier = LicensingMultiplier.getMultiplier(project.licensing);
      const projectPrice = finalHourlyRate * durationHours * difficultyMultiplier;
      const roundedProjectPrice = Math.round(projectPrice * 100) / 100;
      const totalProjectPrice = Math.round(roundedProjectPrice * licensingMultiplier * 100) / 100;

      // Update project with calculated rate and client context
      await this.projectPriceRepo.update(projectId, {
        calculated_rate: roundedProjectPrice,
        client_type: clientType,
        client_region: clientRegion
      });

      return {
        updated: true,
        duration_hours: durationHours,
        difficulty_multiplier: difficultyMultiplier,
        licensing_multiplier: licensingMultiplier,
        total_project_price: totalProjectPrice
      };
    } catch (error: any) {
      console.error('[CalculateProjectRate] Error updating project rate:', {
        projectId,
        error: error.message
      });
      return { updated: false };
    }
  }
}
