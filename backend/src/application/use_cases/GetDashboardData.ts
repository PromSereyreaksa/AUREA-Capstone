import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { supabase } from '../../infrastructure/db/supabaseClient';
import { DatabaseError } from '../../shared/errors/AppError';

export interface RecentProject {
  project_id: number;
  project_name: string;
  title: string | null;
  created_at: string;
}

export interface DashboardData {
  base_rate: number | null;
  projects_this_week: number;
  projects_this_month: number;
  recent_projects: RecentProject[];
}

export class GetDashboardData {
  constructor(private pricingProfileRepo: IPricingProfileRepository) {}

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

    return {
      base_rate,
      projects_this_week,
      projects_this_month,
      recent_projects,
    };
  }
}
