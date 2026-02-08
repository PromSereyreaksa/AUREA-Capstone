import type {
  IDashboardService,
  DashboardStats,
  RecentProject,
  DashboardData,
} from "./IDashboardService";
import { httpClient } from "../../../shared/api/client";

export class DashboardService implements IDashboardService {
  /**
   * Fetch dashboard statistics including base rate and project counts
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await httpClient.get<{
        data: DashboardStats;
      }>("/dashboard/stats");

      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch dashboard stats:", error);
      throw new Error(error.message || "Failed to fetch dashboard statistics");
    }
  }

  /**
   * Fetch recent projects
   * @param limit - Maximum number of projects to fetch (default: 5)
   */
  async getRecentProjects(limit: number = 5): Promise<RecentProject[]> {
    try {
      const response = await httpClient.get<{
        data: RecentProject[];
      }>(`/dashboard/recent-projects?limit=${limit}`);

      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch recent projects:", error);
      throw new Error(error.message || "Failed to fetch recent projects");
    }
  }

  /**
   * Fetch all dashboard data in one request (stats + recent projects)
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await httpClient.get<{
        data: DashboardData;
      }>("/dashboard");

      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      throw new Error(error.message || "Failed to fetch dashboard data");
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
