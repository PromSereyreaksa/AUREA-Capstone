import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';

export class CreateProjectManually {
  constructor(
    private projectPriceRepo: IProjectPriceRepository,
    private projectDeliverableRepo: IProjectDeliverableRepository
  ) {}

  async execute(
    userId: number,
    projectData: {
      project_name: string;
      title: string;
      description?: string | null;
      duration?: number | null;
      difficulty?: string | null;
      licensing?: string | null;
      usage_rights?: string | null;
      result?: string | null;
      deliverables: Array<{ deliverable_type: string; quantity: number }>;
    }
  ): Promise<{ project: ProjectPrice; deliverables: ProjectDeliverable[] }> {
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
        deliverable.quantity
      );
      const saved = await this.projectDeliverableRepo.create(projectDeliverable);
      savedDeliverables.push(saved);
    }

    return {
      project: savedProject,
      deliverables: savedDeliverables
    };
  }
}
