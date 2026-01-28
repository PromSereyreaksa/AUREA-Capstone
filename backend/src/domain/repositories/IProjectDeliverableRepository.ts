import { ProjectDeliverable } from '../entities/ProjectDeliverable';

export interface IProjectDeliverableRepository {
  create(deliverable: ProjectDeliverable): Promise<ProjectDeliverable>;
  findByProjectId(projectId: number): Promise<ProjectDeliverable[]>;
  delete(deliverableId: number): Promise<void>;
  deleteByProjectId(projectId: number): Promise<void>;
}
