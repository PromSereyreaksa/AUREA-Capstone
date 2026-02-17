import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';
import { GeminiService } from '../../infrastructure/services/GeminiService';
import { ProjectValidator } from '../../shared/validators';
import { CalculateProjectRate } from './CalculateProjectRate';

interface ExtractOptions {
  autoSummarize?: boolean;          // Auto-condense large extractions (default: true)
  auto_calculate_rate?: boolean;    // Calculate pricing using UREA profile (requires profile)
  auto_calculate_pricing?: boolean; // Calculate pricing using AI Quick Estimate mode (default: true)
  use_grounding?: boolean;          // Enable Google Search grounding for pricing (default: true)
  client_type?: string;             // For rate calculation (override extracted)
  client_region?: string;           // For rate calculation (override extracted)
}

interface ExtractResult {
  project: ProjectPrice;
  deliverables: ProjectDeliverable[];
  metadata?: { model: string; summarized?: boolean };
  clientContext?: {
    client_type: string;
    client_region: string;
    budget_mentioned: number | null;
    urgency: string;
    estimated_project_hours: number | null;
    complexity_indicators: string[];
  };
  calculated_rate?: number; // Simple rate from UREA profile (legacy)
  pricing?: {
    final_hourly_rate: number;
    project_total_estimate: number;
    estimated_hours: number;
    hourly_rate_range: { min: number; max: number };
    ai_researched_costs: any;
    market_research: any;
    adjustments: any[];
    calculation_breakdown: any;
    sources: string[];
    disclaimer: string;
  };
}

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
    options: ExtractOptions = {}
  ): Promise<ExtractResult> {
    // Use Gemini AI to extract and analyze PDF content
    // If autoSummarize is true (default), automatically condense large extractions
    const shouldAutoSummarize = options.autoSummarize !== false;

    const { projectDetails, clientContext, deliverables, metadata } = shouldAutoSummarize
      ? await this.geminiService.extractFromPdfWithSummarization(pdfBuffer)
      : await this.geminiService.extractFromPdf(pdfBuffer);

    // Sanitize extracted data to prevent DB field overflow errors
    const sanitizedData = ProjectValidator.sanitizeProjectData({
      project_name: projectDetails.project_name,
      title: projectDetails.title,
      description: projectDetails.description,
      duration: projectDetails.duration,
      difficulty: projectDetails.difficulty,
      licensing: projectDetails.licensing,
      usage_rights: projectDetails.usage_rights,
      result: projectDetails.result,
      deliverables: deliverables
    });

    // Create project price entity with sanitized data
    const projectPrice = new ProjectPrice(
      0,
      userId,
      sanitizedData.project_name,
      sanitizedData.title,
      sanitizedData.description,
      sanitizedData.duration,
      sanitizedData.difficulty,
      sanitizedData.licensing,
      sanitizedData.usage_rights,
      sanitizedData.result
    );

    // Save the project first to get the project_id
    const savedProject = await this.projectPriceRepo.create(projectPrice);

    // Create and save project deliverables with sanitized data
    const savedDeliverables: ProjectDeliverable[] = [];
    for (const deliverable of sanitizedData.deliverables) {
      const projectDeliverable = new ProjectDeliverable(
        0,
        savedProject.project_id,
        deliverable.deliverable_type,
        deliverable.quantity,
        deliverable.items || []
      );
      const saved = await this.projectDeliverableRepo.create(projectDeliverable);
      savedDeliverables.push(saved);
    }

    // Build result with client context
    const result: ExtractResult = {
      project: savedProject,
      deliverables: savedDeliverables,
      metadata,
      clientContext: clientContext || undefined
    };

    // NEW: Auto-calculate pricing using AI Quick Estimate mode (project-specific)
    if (options.auto_calculate_pricing !== false) {
      try {
        const useGrounding = options.use_grounding !== false; // Default true
        
        console.log('[ExtractProject] Calculating AI-powered project pricing...');
        const pricingResult = await this.geminiService.generateProjectBasedEstimate({
          projectDetails: savedProject,
          deliverables: savedDeliverables,
          clientContext: clientContext || {
            client_type: options.client_type || 'sme',
            client_region: options.client_region || 'cambodia',
            budget_mentioned: null,
            urgency: 'normal',
            estimated_project_hours: null,
            complexity_indicators: []
          },
          useGrounding
        });

        result.pricing = pricingResult;
      } catch (error: any) {
        console.error('[ExtractProject] Auto pricing calculation failed:', error.message);
        // Don't fail the entire extraction if pricing fails - it's optional
      }
    }

    // LEGACY: Auto-calculate project rate if user has pricing profile
    if (options.auto_calculate_rate && this.calculateProjectRateUseCase) {
      try {
        const clientType = options.client_type || clientContext?.client_type || 'sme';
        const clientRegion = options.client_region || clientContext?.client_region || 'cambodia';

        const rateResult = await this.calculateProjectRateUseCase.execute({
          user_id: userId,
          project_id: savedProject.project_id,
          client_type: clientType,
          client_region: clientRegion
        });

        result.calculated_rate = rateResult.final_hourly_rate;
      } catch (error: any) {
        // Expected if user hasn't completed pricing onboarding
        console.log('[ExtractProject] Auto rate calculation skipped:', error.message);
      }
    }

    return result;
  }
}
