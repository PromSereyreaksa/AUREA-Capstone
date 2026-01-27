import { ProjectDeliverable } from '../entities/ProjectDeliverable';

export interface IProjectDeliverableRepository {
  create(deliverable: ProjectDeliverable): Promise<ProjectDeliverable>;
  findByProjectId(projectId: number): Promise<ProjectDeliverable[]>;
}
