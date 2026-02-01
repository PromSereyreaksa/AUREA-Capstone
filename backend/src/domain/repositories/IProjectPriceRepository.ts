import { ProjectPrice } from '../entities/ProjectPrice';

export interface IProjectPriceRepository {
  create(project: ProjectPrice): Promise<ProjectPrice>;
  findById(projectId: number): Promise<ProjectPrice | null>;
  findByUserId(userId: number): Promise<ProjectPrice[]>;
  update(projectId: number, project: Partial<ProjectPrice>): Promise<ProjectPrice>;
  delete(projectId: number): Promise<void>;
}
