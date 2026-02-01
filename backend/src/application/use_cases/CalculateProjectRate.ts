import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { ClientContext } from '../../domain/entities/ClientContext';
import { SeniorityMultiplier } from '../../domain/entities/SeniorityLevel';
import { PricingCalculatorService } from '../../infrastructure/services/PricingCalculatorService';

interface CalculateProjectRateInput {
  user_id: number;
  project_id?: number;  // Optional: if provided, will update project's calculated_rate
  client_type: string;
  client_region: string;
}

interface CalculateProjectRateOutput {
  base_rate: number;
  seniority_level: string;
  seniority_multiplier: number;
  client_type: string;
  client_region: string;
  context_multiplier: number;
  final_hourly_rate: number;
  monthly_revenue_estimate?: number;
  annual_revenue_estimate?: number;
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

    // 3. Calculate project rate with breakdown
    const calculation = PricingCalculatorService.calculateProjectRateWithBreakdown(
      pricingProfile.base_hourly_rate,
      pricingProfile.seniority_level,
      clientContext
    );

    // 4. Calculate revenue estimates
    const monthlyRevenue = PricingCalculatorService.estimateMonthlyRevenue(
      calculation.final_hourly_rate,
      pricingProfile.billable_hours_per_month
    );

    const annualRevenue = PricingCalculatorService.estimateAnnualRevenue(
      calculation.final_hourly_rate,
      pricingProfile.billable_hours_per_month
    );

    // 5. Update project if project_id provided
    let projectUpdated = false;
    if (input.project_id) {
      projectUpdated = await this.updateProjectRate(
        input.project_id,
        calculation.final_hourly_rate,
        input.client_type,
        input.client_region
      );
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
      project_updated: projectUpdated
    };
  }

  private async updateProjectRate(
    projectId: number,
    calculatedRate: number,
    clientType: string,
    clientRegion: string
  ): Promise<boolean> {
    try {
      // First check if project exists
      const project = await this.projectPriceRepo.findById(projectId);
      
      if (!project) {
        console.warn(`Project ${projectId} not found, skipping update`);
        return false;
      }

      // Update project with calculated rate and client context
      await this.projectPriceRepo.update(projectId, {
        calculated_rate: calculatedRate,
        client_type: clientType,
        client_region: clientRegion
      });

      return true;
    } catch (error: any) {
      console.error('[CalculateProjectRate] Error updating project rate:', {
        projectId,
        error: error.message
      });
      return false;
    }
  }
}
