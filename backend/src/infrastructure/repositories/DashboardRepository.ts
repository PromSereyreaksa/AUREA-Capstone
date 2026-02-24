import { supabase } from '../db/supabaseClient';
import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import {
  DashboardSummary,
  DashboardOverview,
  RecentProject,
  PricingProfileSnapshot,
  MarketComparison,
  BenchmarkEntry,
  PortfolioSnapshot,
} from '../../domain/entities/Dashboard';
import { DatabaseError } from '../../shared/errors';

export class DashboardRepository implements IDashboardRepository {

  // ─── Public Methods ────────────────────────────────────────────────────────

  async getDashboardData(userId: number): Promise<DashboardSummary> {
    const [
      projectsResult,
      pricingResult,
      profileResult,
      portfolioResult,
      onboardingResult,
    ] = await Promise.all([
      this._fetchRecentProjectRows(userId, 5),
      supabase.from('pricing_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_profile')
        .select('bio, skills, location, profile_avatar, experience_years, seniority_level, social_links')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('portfolio').select('portfolio_url, is_public').eq('user_id', userId).maybeSingle(),
      supabase.from('onboarding_sessions').select('status').eq('user_id', userId)
        .order('started_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (projectsResult.error)  throw new DatabaseError(`Failed to fetch projects: ${projectsResult.error.message}`);
    if (pricingResult.error)   throw new DatabaseError(`Failed to fetch pricing profile: ${pricingResult.error.message}`);
    if (profileResult.error)   throw new DatabaseError(`Failed to fetch user profile: ${profileResult.error.message}`);
    if (portfolioResult.error) throw new DatabaseError(`Failed to fetch portfolio: ${portfolioResult.error.message}`);
    if (onboardingResult.error) throw new DatabaseError(`Failed to fetch onboarding session: ${onboardingResult.error.message}`);

    const pricingData   = pricingResult.data;
    const profileData   = profileResult.data;
    const portfolioData = portfolioResult.data;
    const onboardingData = onboardingResult.data;

    // Skill categories (needed for market comparison)
    let skillCategories: number[] = [];
    let pricingProfile: PricingProfileSnapshot | null = null;

    if (pricingData) {
      const { data: catData } = await supabase
        .from('user_category').select('category_id').eq('user_id', userId);
      skillCategories = catData?.map((r: any) => r.category_id) || [];

      pricingProfile = {
        base_hourly_rate: pricingData.base_hourly_rate ?? null,
        desired_monthly_income: pricingData.desired_monthly_income,
        billable_hours_per_month: pricingData.billable_hours_per_month,
        profit_margin: pricingData.profit_margin,
        experience_years: pricingData.experience_years,
        seniority_level: pricingData.seniority_level,
        skill_categories: skillCategories,
      };
    }

    // Market comparison
    const marketComparison = await this._buildMarketComparison(
      pricingData?.base_hourly_rate ?? null,
      skillCategories,
      pricingData?.seniority_level
    );

    // Recent projects (with client name from invoice)
    const recentProjects = this._mapProjectRows(projectsResult.data || []);

    // Overview
    const profileCompleteness = this._computeProfileCompleteness(profileData, pricingData);
    const { total, thisWeek, thisMonth } = await this._getProjectCounts(userId);
    const overview: DashboardOverview = {
      totalProjects: total,
      projectsThisWeek: thisWeek,
      projectsThisMonth: thisMonth,
      completedOnboarding: onboardingData?.status === 'completed',
      baseHourlyRate: pricingData?.base_hourly_rate ?? null,
      seniorityLevel: pricingData?.seniority_level ?? profileData?.seniority_level ?? null,
      profileCompleteness,
    };

    const portfolio: PortfolioSnapshot = {
      hasPortfolio: !!portfolioData?.portfolio_url,
      isPublic: portfolioData?.is_public ?? false,
      portfolioUrl: portfolioData?.portfolio_url ?? null,
    };

    return { overview, recentProjects, pricingProfile, marketComparison, portfolio };
  }

  async getDashboardStats(userId: number): Promise<DashboardOverview> {
    const [pricingResult, profileResult, onboardingResult] = await Promise.all([
      supabase.from('pricing_profiles').select('base_hourly_rate, seniority_level').eq('user_id', userId).maybeSingle(),
      supabase.from('user_profile')
        .select('bio, skills, location, profile_avatar, experience_years, seniority_level')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('onboarding_sessions').select('status').eq('user_id', userId)
        .order('started_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (pricingResult.error)  throw new DatabaseError(`Failed to fetch pricing profile: ${pricingResult.error.message}`);
    if (profileResult.error)  throw new DatabaseError(`Failed to fetch user profile: ${profileResult.error.message}`);
    if (onboardingResult.error) throw new DatabaseError(`Failed to fetch onboarding session: ${onboardingResult.error.message}`);

    const pricingData    = pricingResult.data;
    const profileData    = profileResult.data;
    const onboardingData = onboardingResult.data;

    const { total, thisWeek, thisMonth } = await this._getProjectCounts(userId);
    return {
      totalProjects: total,
      projectsThisWeek: thisWeek,
      projectsThisMonth: thisMonth,
      completedOnboarding: onboardingData?.status === 'completed',
      baseHourlyRate: pricingData?.base_hourly_rate ?? null,
      seniorityLevel: pricingData?.seniority_level ?? profileData?.seniority_level ?? null,
      profileCompleteness: this._computeProfileCompleteness(profileData, pricingData),
    };
  }

  async getRecentProjects(userId: number, limit = 5): Promise<RecentProject[]> {
    const { data, error } = await this._fetchRecentProjectRows(userId, limit);
    if (error) throw new DatabaseError(`Failed to fetch recent projects: ${error.message}`);
    return this._mapProjectRows(data || []);
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /** Fetch project rows with embedded invoice for client_name (LEFT JOIN via FK). */
  private _fetchRecentProjectRows(userId: number, limit: number) {
    return supabase
      .from('project_price')
      .select(`
        project_id,
        project_name,
        title,
        difficulty,
        calculated_rate,
        client_type,
        client_region,
        created_at,
        invoice (client_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  /** Map raw DB rows (with embedded invoice) to RecentProject domain objects. */
  private _mapProjectRows(rows: any[]): RecentProject[] {
    return rows.map((p: any) => ({
      project_id:     p.project_id,
      project_name:   p.project_name,
      title:          p.title ?? null,
      difficulty:     p.difficulty ?? null,
      calculated_rate: p.calculated_rate ?? null,
      client_type:    p.client_type ?? null,
      client_region:  p.client_region ?? null,
      // invoice is an array (one-to-one FK) — take first element if present
      client_name:    Array.isArray(p.invoice) && p.invoice.length > 0
                        ? (p.invoice[0].client_name ?? null)
                        : (p.invoice?.client_name ?? null),
      created_at:     p.created_at,
    }));
  }

  private async _buildMarketComparison(
    userRate: number | null,
    skillCategories: number[],
    seniorityLevel?: string,
  ): Promise<MarketComparison> {
    const comparison: MarketComparison = { userRate, benchmarks: [] };

    if (skillCategories.length === 0 && !seniorityLevel) return comparison;

    let q = supabase.from('market_benchmarks').select(`
      median_hourly_rate,
      percentile_75_rate,
      seniority_level,
      category:category_id (category_name)
    `);

    if (skillCategories.length > 0) q = q.in('category_id', skillCategories);
    if (seniorityLevel)             q = q.eq('seniority_level', seniorityLevel);

    const { data } = await q;
    if (data && data.length > 0) {
      comparison.benchmarks = data.map((b: any) => ({
        category_name:       b.category?.category_name ?? 'Unknown',
        median_hourly_rate:  b.median_hourly_rate,
        percentile_75_rate:  b.percentile_75_rate,
        seniority_level:     b.seniority_level,
      })) as BenchmarkEntry[];
    }

    return comparison;
  }

  private async _getProjectCounts(userId: number): Promise<{ total: number; thisWeek: number; thisMonth: number }> {
    const now = new Date();

    const weekStart = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult, weekResult, monthResult] = await Promise.all([
      supabase.from('project_price').select('project_id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('project_price').select('project_id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekStart.toISOString()),
      supabase.from('project_price').select('project_id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', monthStart.toISOString()),
    ]);

    if (totalResult.error) throw new DatabaseError(`Failed to count projects: ${totalResult.error.message}`);
    if (weekResult.error)  throw new DatabaseError(`Failed to count weekly projects: ${weekResult.error.message}`);
    if (monthResult.error) throw new DatabaseError(`Failed to count monthly projects: ${monthResult.error.message}`);

    return {
      total:    totalResult.count ?? 0,
      thisWeek: weekResult.count ?? 0,
      thisMonth: monthResult.count ?? 0,
    };
  }

  private _computeProfileCompleteness(
    profileData: Record<string, any> | null,
    pricingData: Record<string, any> | null,
  ): number {
    const checks: boolean[] = [
      !!(profileData?.bio),
      !!(profileData?.location),
      !!(profileData?.skills && profileData.skills !== '[]'),
      !!(profileData?.profile_avatar),
      !!(profileData?.experience_years),
      !!(pricingData),
      !!(pricingData?.base_hourly_rate),
      !!(pricingData?.desired_monthly_income),
      !!(pricingData?.seniority_level),
      !!(pricingData?.billable_hours_per_month),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
}
