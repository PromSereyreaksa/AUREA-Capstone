export interface DashboardStats {
  baseRate: number | null;
  projectsThisWeek: number;
  projectsThisMonth: number;
  totalProjects?: number;
}

export interface RecentProject {
  id: string;
  name: string;
  clientName: string;
  type?: 'project' | 'base-rate';
  created_at?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: RecentProject[];
}

export interface DashboardHistoryPage {
  items: RecentProject[];
  total: number;
  page: number;
  limit: number;
}

export interface IDashboardService {
  getDashboardStats(): Promise<DashboardStats>;
  getRecentProjects(limit?: number): Promise<RecentProject[]>;
  getDashboardData(): Promise<DashboardData>;
  getHistory(page?: number, limit?: number): Promise<DashboardHistoryPage>;
}
