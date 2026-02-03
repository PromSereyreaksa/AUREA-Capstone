import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';
import { CalculateProjectRate } from './CalculateProjectRate';

interface DeliverableInput {
  deliverable_type: string;
  quantity: number;
  items?: string[];  // Sub-items/components included in this deliverable
}

interface ProjectInput {
  project_name: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  difficulty?: string | null;
  licensing?: string | null;
  usage_rights?: string | null;
  result?: string | null;
  deliverables: DeliverableInput[];
  // OPTIONAL pricing fields
  client_type?: string;
  client_region?: string;
  auto_calculate_rate?: boolean;
}

interface CreateResult {
  project: ProjectPrice;
  deliverables: ProjectDeliverable[];
  calculated_rate?: number;
}

export class CreateProjectManually {
  private calculateProjectRateUseCase?: CalculateProjectRate;

  constructor(
    private projectPriceRepo: IProjectPriceRepository,
    private projectDeliverableRepo: IProjectDeliverableRepository,
    pricingProfileRepo?: IPricingProfileRepository
  ) {
    // Optional pricing integration
    if (pricingProfileRepo) {
      this.calculateProjectRateUseCase = new CalculateProjectRate(
        pricingProfileRepo,
        projectPriceRepo
      );
    }
  }

  async execute(userId: number, projectData: ProjectInput): Promise<CreateResult> {
    // Validate required fields
    if (!projectData.project_name || !projectData.title) {
      throw new Error('project_name and title are required');
    }

    if (!Array.isArray(projectData.deliverables) || projectData.deliverables.length === 0) {
      throw new Error('At least one deliverable is required');
    }

    // Create project price entity
    const projectPrice = new ProjectPrice(
      0,
      userId,
      projectData.project_name,
      projectData.title,
      projectData.description || undefined,
      projectData.duration || undefined,
      projectData.difficulty || undefined,
      projectData.licensing || undefined,
      projectData.usage_rights || undefined,
      projectData.result || undefined
    );

    // Save project to database
    const savedProject = await this.projectPriceRepo.create(projectPrice);

    // Create and save deliverables
    const savedDeliverables: ProjectDeliverable[] = [];
    for (const deliverable of projectData.deliverables) {
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

    // Build result
    const result: CreateResult = {
      project: savedProject,
      deliverables: savedDeliverables
    };

    // OPTIONAL: Auto-calculate project rate if user has pricing profile
    if (projectData.auto_calculate_rate && this.calculateProjectRateUseCase) {
      try {
        const clientType = projectData.client_type || 'sme';
        const clientRegion = projectData.client_region || 'cambodia';

        const rateResult = await this.calculateProjectRateUseCase.execute({
          user_id: userId,
          project_id: savedProject.project_id,
          client_type: clientType,
          client_region: clientRegion
        });

        result.calculated_rate = rateResult.final_hourly_rate;
      } catch (error: any) {
        // Expected if user hasn't completed pricing onboarding
        console.log('[CreateProject] Auto rate calculation skipped:', error.message);
      }
    }

    return result;
  }
}
