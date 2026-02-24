import { DashboardSummary, DashboardOverview, RecentProject } from '../entities/Dashboard';

export interface IDashboardRepository {
  getDashboardData(userId: number): Promise<DashboardSummary>;
  getDashboardStats(userId: number): Promise<DashboardOverview>;
  getRecentProjects(userId: number, limit?: number): Promise<RecentProject[]>;
}
