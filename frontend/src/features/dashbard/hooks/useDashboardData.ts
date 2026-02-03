import { useState, useEffect, useCallback } from "react";
import { dashboardService, mockDashboardService } from "../services";
import type { DashboardStats, RecentProject } from "../services";

interface DashboardCache {
  stats: DashboardStats;
  recentProjects: RecentProject[];
  timestamp: number;
}

interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  recentProjects: RecentProject[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

const CACHE_KEY = "dashboard_data_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDashboardData = (): UseDashboardDataReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Get cached data from localStorage
  const getCachedData = useCallback((): DashboardCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: DashboardCache = JSON.parse(cached);
      const now = Date.now();
      const age = now - data.timestamp;

      // Check if cache is still valid
      if (age < CACHE_DURATION) {
        return data;
      }

      // Cache is stale but return it anyway (will refresh in background)
      setIsStale(true);
      return data;
    } catch (err) {
      console.error("Error reading cache:", err);
      return null;
    }
  }, []);

  // Save data to cache
  const setCachedData = useCallback(
    (data: { stats: DashboardStats; recentProjects: RecentProject[] }) => {
      try {
        const cacheData: DashboardCache = {
          ...data,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (err) {
        console.error("Error saving cache:", err);
      }
    },
    [],
  );

  // Fetch fresh data from API
  const fetchDashboardData = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        // const data = await dashboardService.getDashboardData();
        const data = await mockDashboardService.getDashboardData();

        setStats(data.stats);
        setRecentProjects(data.recentProjects);
        setError(null);
        setIsStale(false);

        // Update cache with fresh data
        setCachedData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [setCachedData],
  );

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      // Try to get cached data first
      const cachedData = getCachedData();

      if (cachedData) {
        // Show cached data immediately (instant load!)
        setStats(cachedData.stats);
        setRecentProjects(cachedData.recentProjects);
        setLoading(false);

        // Fetch fresh data in background if cache is stale
        if (isStale) {
          fetchDashboardData(false); // Don't show loader
        }
      } else {
        // No cache, fetch with loader
        await fetchDashboardData(true);
      }
    };

    loadData();
  }, [getCachedData, fetchDashboardData, isStale]);

  return {
    stats,
    recentProjects,
    loading,
    error,
    refetch: () => fetchDashboardData(true),
    isStale,
  };
};
