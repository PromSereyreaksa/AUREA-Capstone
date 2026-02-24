import { useState, useEffect, useCallback, useRef } from "react";
import { dashboardService } from "../services";
import type { DashboardStats, RecentProject } from "../services";

interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  recentProjects: RecentProject[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const POLL_INTERVAL = 30 * 1000; // Auto-refetch every 30 seconds

export const useDashboardData = (): UseDashboardDataReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Fetch fresh data from API
  const fetchDashboardData = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const data = await dashboardService.getDashboardData();

        if (isMounted.current) {
          setStats(data.stats);
          setRecentProjects(data.recentProjects);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted.current) {
          setError(err.message || "Failed to load dashboard data");
          console.error("Dashboard fetch error:", err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Always fetch fresh data on mount + auto-poll
  useEffect(() => {
    isMounted.current = true;

    // Initial fetch with loader
    fetchDashboardData(true);

    // Auto-refetch on interval (no loader for background refreshes)
    const intervalId = setInterval(() => {
      fetchDashboardData(false);
    }, POLL_INTERVAL);

    // Also refetch when the tab regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboardData(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  return {
    stats,
    recentProjects,
    loading,
    error,
    refetch: () => fetchDashboardData(true),
  };
};
