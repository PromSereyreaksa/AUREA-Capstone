import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';
import { GeminiService } from '../../infrastructure/services/GeminiService';
import { CalculateProjectRate } from './CalculateProjectRate';

export class ExtractProjectFromPdf {
  private calculateProjectRateUseCase?: CalculateProjectRate;

  constructor(
    private projectPriceRepo: IProjectPriceRepository,
    private projectDeliverableRepo: IProjectDeliverableRepository,
    private geminiService: GeminiService,
    pricingProfileRepo?: IPricingProfileRepository
  ) {
    // Optional pricing integration - only if user has completed onboarding
    if (pricingProfileRepo) {
      this.calculateProjectRateUseCase = new CalculateProjectRate(
        pricingProfileRepo,
        projectPriceRepo
      );
    }
  }

  async execute(
    pdfBuffer: Buffer,
    userId: number,
    options?: {
      auto_calculate_rate?: boolean;
      client_type?: string;
      client_region?: string;
    }
  ): Promise<{ project: ProjectPrice; deliverables: ProjectDeliverable[]; calculated_rate?: number }> {
    // Use Gemini AI to extract and analyze PDF content directly
    const { projectDetails, deliverables } = await this.geminiService.extractFromPdf(pdfBuffer);

    // Create project price entity with extracted data
    const projectPrice = new ProjectPrice(
      0, 
      userId,
      projectDetails.project_name,
      projectDetails.title,
      projectDetails.description,
      projectDetails.duration,
      projectDetails.difficulty,
      projectDetails.licensing,
      projectDetails.usage_rights,
      projectDetails.result
    );

    // Save the project first to get the project_id
    const savedProject = await this.projectPriceRepo.create(projectPrice);

    // Create and save project deliverables
    const savedDeliverables: ProjectDeliverable[] = [];
    for (const deliverable of deliverables) {
      const projectDeliverable = new ProjectDeliverable(
        0, 
        savedProject.project_id,
        deliverable.deliverable_type,
        deliverable.quantity
      );
      const saved = await this.projectDeliverableRepo.create(projectDeliverable);
      savedDeliverables.push(saved);
    }

    // OPTIONAL: Auto-calculate project rate if user has pricing profile
    let calculatedRate: number | undefined;
    if (options?.auto_calculate_rate && this.calculateProjectRateUseCase) {
      try {
        const clientType = options.client_type || projectDetails.client_type || 'sme';
        const clientRegion = options.client_region || projectDetails.client_region || 'cambodia';

        const rateResult = await this.calculateProjectRateUseCase.execute({
          user_id: userId,
          project_id: savedProject.project_id,
          client_type: clientType,
          client_region: clientRegion
        });

        calculatedRate = rateResult.final_hourly_rate;
      } catch (error: any) {
        // Expected if user hasn't completed pricing onboarding
        console.log('[ExtractProject] Auto rate calculation skipped:', error.message);
      }
    }

    return {
      project: savedProject,
      deliverables: savedDeliverables,
      calculated_rate: calculatedRate
    };
  }
}
