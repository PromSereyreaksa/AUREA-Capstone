import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardSummary, DashboardOverview, RecentProject } from '../../domain/entities/Dashboard';

interface GetDashboardSummaryInput {
  user_id: number;
}

export class GetDashboardSummary {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(input: GetDashboardSummaryInput): Promise<DashboardSummary> {
    if (!input.user_id || input.user_id <= 0) throw new Error('Invalid user_id');
    return this.dashboardRepository.getDashboardData(input.user_id);
  }

  async getStats(input: GetDashboardSummaryInput): Promise<DashboardOverview> {
    if (!input.user_id || input.user_id <= 0) throw new Error('Invalid user_id');
    return this.dashboardRepository.getDashboardStats(input.user_id);
  }

  async getRecentProjects(input: GetDashboardSummaryInput & { limit?: number }): Promise<RecentProject[]> {
    if (!input.user_id || input.user_id <= 0) throw new Error('Invalid user_id');
    return this.dashboardRepository.getRecentProjects(input.user_id, input.limit);
  }
}
