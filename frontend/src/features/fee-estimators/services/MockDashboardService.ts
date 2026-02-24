import type {
  IDashboardService,
  DashboardStats,
  RecentProject,
  DashboardData,
} from "./IDashboardService";

/**
 * Mock implementation for development and testing
 */
export class MockDashboardService implements IDashboardService {
  private mockDelay = (ms: number = 500) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async getDashboardStats(): Promise<DashboardStats> {
    await this.mockDelay();

    return {
      baseRate: 25.5,
      projectsThisWeek: 2,
      projectsThisMonth: 6,
      totalProjects: 18,
    };
  }

  async getRecentProjects(limit: number = 5): Promise<RecentProject[]> {
    await this.mockDelay();

    const allProjects: RecentProject[] = [
      {
        id: 1,
        name: "Brand Identity Design",
        clientName: "Techo Academic School",
        created_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: 2,
        name: "Website Redesign",
        clientName: "PhsarDesign Startup",
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: 3,
        name: "App Design",
        clientName: "Johnny YesPaPa Co., Ltd.",
        created_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: 4,
        name: "Logo Design",
        clientName: "Yraspocc Industry",
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: 5,
        name: "Tech Start Up Branding",
        clientName: "Ilong Chea",
        created_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ];

    return allProjects.slice(0, limit);
  }

  async getDashboardData(): Promise<DashboardData> {
    await this.mockDelay();

    const stats = await this.getDashboardStats();
    const recentProjects = await this.getRecentProjects();

    return {
      stats,
      recentProjects,
    };
  }
}

// Export singleton instance
export const mockDashboardService = new MockDashboardService();
