export interface DashboardStats {
  baseRate: number | null;
  projectsThisWeek: number;
  projectsThisMonth: number;
  totalProjects?: number;
}

export interface RecentProject {
  id: number;
  name: string;
  clientName: string;
  created_at?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: RecentProject[];
}

export interface IDashboardService {
  getDashboardStats(): Promise<DashboardStats>;
  getRecentProjects(limit?: number): Promise<RecentProject[]>;
  getDashboardData(): Promise<DashboardData>;
}
