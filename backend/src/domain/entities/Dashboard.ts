export interface DashboardOverview {
  totalProjects: number;
  projectsThisWeek: number;
  projectsThisMonth: number;
  completedOnboarding: boolean;
  baseHourlyRate: number | null;
  seniorityLevel: string | null;
  profileCompleteness: number; // 0–100
}

export interface RecentProject {
  project_id: number;
  project_name: string;
  title: string | null;
  difficulty: string | null;
  calculated_rate: number | null;
  client_type: string | null;
  client_region: string | null;
  client_name: string | null;
  created_at?: Date;
}

export interface PricingProfileSnapshot {
  base_hourly_rate: number | null;
  desired_monthly_income: number;
  billable_hours_per_month: number;
  profit_margin: number;
  experience_years: number;
  seniority_level: string;
  skill_categories: number[];
}

export interface BenchmarkEntry {
  category_name: string;
  median_hourly_rate: number;
  percentile_75_rate: number;
  seniority_level: string;
}

export interface MarketComparison {
  userRate: number | null;
  benchmarks: BenchmarkEntry[];
}

export interface PortfolioSnapshot {
  hasPortfolio: boolean;
  isPublic: boolean;
  portfolioUrl: string | null;
}

export interface DashboardSummary {
  overview: DashboardOverview;
  recentProjects: RecentProject[];
  pricingProfile: PricingProfileSnapshot | null;
  marketComparison: MarketComparison;
  portfolio: PortfolioSnapshot;
}
