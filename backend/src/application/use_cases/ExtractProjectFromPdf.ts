import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';
import { GeminiService } from '../../infrastructure/services/GeminiService';

export class ExtractProjectFromPdf {
  constructor(
    private projectPriceRepo: IProjectPriceRepository,
    private projectDeliverableRepo: IProjectDeliverableRepository,
    private geminiService: GeminiService
  ) {}

  async execute(pdfBuffer: Buffer, userId: number): Promise<{ project: ProjectPrice; deliverables: ProjectDeliverable[] }> {
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

    return {
      project: savedProject,
      deliverables: savedDeliverables
    };
  }
}
