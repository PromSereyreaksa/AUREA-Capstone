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
      // Backend returns data wrapped in { success, message, data }
      const response = await httpClient.get<{
        success: boolean;
        message?: string;
        data: {
          base_rate: number | null;
          projects_this_week: number;
          projects_this_month: number;
          recent_projects: Array<{
            project_id: number;
            project_name: string;
            title: string | null;
            created_at: string;
          }>;
        };
      }>("/dashboard");

      const backendData = response.data;

      // Transform backend format to frontend format
      return {
        stats: {
          baseRate: backendData.base_rate,
          projectsThisWeek: backendData.projects_this_week,
          projectsThisMonth: backendData.projects_this_month,
        },
        recentProjects: backendData.recent_projects.map((project) => ({
          id: project.project_id,
          name: project.project_name,
          clientName: project.title || "Untitled Project",
          created_at: project.created_at,
        })),
      };
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      throw new Error(error.message || "Failed to fetch dashboard data");
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
