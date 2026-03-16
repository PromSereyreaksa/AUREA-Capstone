import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { supabase } from '../../infrastructure/db/supabaseClient';
import { DatabaseError } from '../../shared/errors/AppError';

export interface RecentProject {
  project_id: number;
  project_name: string;
  title: string | null;
  created_at: string;
}

export interface RecentHistoryItem {
  id: string;
  type: 'project' | 'base-rate';
  title: string;
  subtitle: string;
  created_at: string;
}

export interface DashboardData {
  base_rate: number | null;
  projects_this_week: number;
  projects_this_month: number;
  recent_projects: RecentProject[];
  recent_history: RecentHistoryItem[];
}

export interface DashboardHistoryResult {
  items: RecentHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export class GetDashboardData {
  constructor(private pricingProfileRepo: IPricingProfileRepository) {}

  private async buildHistory(userId: number): Promise<RecentHistoryItem[]> {
    const { data: recentData, error: recentError } = await supabase
      .from('project_price')
      .select('project_id, project_name, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (recentError) {
      throw new DatabaseError(`Failed to fetch recent projects: ${recentError.message}`);
    }

    const recentProjects: RecentProject[] = (recentData ?? []).map((row: any) => ({
      project_id: row.project_id,
      project_name: row.project_name,
      title: row.title ?? null,
      created_at: row.created_at,
    }));

    const historyItems: RecentHistoryItem[] = recentProjects.map((project) => ({
      id: `project-${project.project_id}`,
      type: 'project',
      title: project.project_name,
      subtitle: project.title || 'Project-based calculation',
      created_at: project.created_at,
    }));

    const { data: pricingProfiles, error: pricingProfileError } = await supabase
      .from('pricing_profiles')
      .select('pricing_profile_id, base_hourly_rate, created_at, updated_at')
      .eq('user_id', userId)
      .limit(1);

    if (pricingProfileError) {
      throw new DatabaseError(`Failed to fetch pricing profile history: ${pricingProfileError.message}`);
    }

    const profileHistory = pricingProfiles?.[0];
    if (profileHistory?.updated_at || profileHistory?.created_at) {
      historyItems.push({
        id: `pricing-profile-${profileHistory.pricing_profile_id}`,
        type: 'base-rate',
        title: 'Base Rate Updated',
        subtitle: profileHistory.base_hourly_rate != null
          ? `Saved base rate: $${Number(profileHistory.base_hourly_rate).toFixed(2)}/hr`
          : 'Pricing profile updated',
        created_at: profileHistory.updated_at || profileHistory.created_at,
      });
    } else {
      const { data: legacyBaseRate, error: legacyBaseRateError } = await supabase
        .from('base_price')
        .select('base_price_id, base_rate_result, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (legacyBaseRateError) {
        throw new DatabaseError(`Failed to fetch legacy base_rate history: ${legacyBaseRateError.message}`);
      }

      const basePrice = legacyBaseRate?.[0];
      if (basePrice) {
        historyItems.push({
          id: `base-price-${basePrice.base_price_id}`,
          type: 'base-rate',
          title: 'Base Rate Calculated',
          subtitle: basePrice.base_rate_result != null
            ? `Calculated base rate: $${Number(basePrice.base_rate_result).toFixed(2)}/hr`
            : 'Base rate calculation saved',
          created_at: basePrice.updated_at || basePrice.created_at,
        });
      }
    }

    return historyItems.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async executeHistory(userId: number, page: number = 1, limit: number = 20): Promise<DashboardHistoryResult> {
    const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;

    const allHistory = await this.buildHistory(userId);
    const total = allHistory.length;
    const start = (normalizedPage - 1) * normalizedLimit;
    const items = allHistory.slice(start, start + normalizedLimit);

    return {
      items,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  async execute(userId: number): Promise<DashboardData> {
    // ----------------------------------------------------------------
    // 1. Base rate  – pricing_profiles.base_hourly_rate → base_price fallback
    // ----------------------------------------------------------------
    let base_rate: number | null = null;

    const profile = await this.pricingProfileRepo.findByUserId(userId);
    if (profile && profile.base_hourly_rate != null) {
      base_rate = profile.base_hourly_rate;
    } else {
      // Fallback: legacy base_price table
      const { data: bpData, error: bpError } = await supabase
        .from('base_price')
        .select('base_rate_result')
        .eq('user_id', userId)
        .maybeSingle();

      if (bpError) {
        throw new DatabaseError(`Failed to fetch base_price fallback: ${bpError.message}`);
      }
      if (bpData && bpData.base_rate_result != null) {
        base_rate = Number(bpData.base_rate_result);
      }
    }

    // ----------------------------------------------------------------
    // 2. Project counts – last 7 days and last 30 days
    // ----------------------------------------------------------------
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [weekResult, monthResult] = await Promise.all([
      supabase
        .from('project_price')
        .select('project_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('project_price')
        .select('project_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo),
    ]);

    if (weekResult.error) {
      throw new DatabaseError(`Failed to count weekly projects: ${weekResult.error.message}`);
    }
    if (monthResult.error) {
      throw new DatabaseError(`Failed to count monthly projects: ${monthResult.error.message}`);
    }

    const projects_this_week = weekResult.count ?? 0;
    const projects_this_month = monthResult.count ?? 0;

    // ----------------------------------------------------------------
    // 3. Recent projects – 5 most recent ordered by created_at DESC
    // ----------------------------------------------------------------
    const { data: recentData, error: recentError } = await supabase
      .from('project_price')
      .select('project_id, project_name, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      throw new DatabaseError(`Failed to fetch recent projects: ${recentError.message}`);
    }

    const recent_projects: RecentProject[] = (recentData ?? []).map((row: any) => ({
      project_id: row.project_id,
      project_name: row.project_name,
      title: row.title ?? null,
      created_at: row.created_at,
    }));

    const recent_history = (await this.buildHistory(userId)).slice(0, 5);

    return {
      base_rate,
      projects_this_week,
      projects_this_month,
      recent_projects,
      recent_history,
    };
  }
}
