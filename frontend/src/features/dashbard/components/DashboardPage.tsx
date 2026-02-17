import { useAuth } from "../../auth/context/AuthContext";
import Sidebar from "../../../shared/components/Sidebar";
import StatCard from "./StatCard";
import RecentProjects from "./RecentProjects";
import { useDashboardData } from "../hooks";

// Calendar Icon
const CalendarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FB8500"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Refresh Icon
const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FB8500"
    strokeWidth="2"
    className={spinning ? "animate-spin" : ""}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { stats, recentProjects, loading, error, refetch, isStale } =
    useDashboardData();

  // Get user's first name from email or use default
  const getUserName = () => {
    if (user?.first_name) {
      return user.first_name;
    }

    if (user?.last_name) {
      return user.last_name;
    }

    return "Designer";
  };

  // Format current date
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FB8500] p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
      <Sidebar userName={getUserName()} />

      <main className="flex-1 bg-[#FFFEF9] rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5 md:gap-6 overflow-y-auto border-[3px] border-black shadow-[2px_2px_0_#1a1a1a]">
        {/* Loading State */}
        {loading && (
          <div className="space-y-6 animate-[pulse_1.5s_ease-in-out_infinite]">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-300 border-2 border-black rounded"></div>
                <div className="h-4 w-64 bg-gray-200 border-2 border-black rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-9 h-9 bg-[#FFE8DC] border-2 border-black rounded-lg shadow-[2px_2px_0_#1a1a1a]"></div>
                <div className="w-9 h-9 bg-[#FFE8DC] border-2 border-black rounded-lg shadow-[2px_2px_0_#1a1a1a]"></div>
              </div>
            </div>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] h-32"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="h-4 w-32 bg-gray-300 border-2 border-black rounded mb-3"></div>
                  <div className="h-10 w-24 bg-gray-400 border-2 border-black rounded"></div>
                </div>
              ))}
            </div>
            {/* Projects Skeleton */}
            <div className="bg-white rounded-xl p-6 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a]">
              <div className="h-6 w-40 bg-gray-300 border-2 border-black rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-200 border-2 border-black rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && stats && (
          <>
            {/* Header Section */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight mb-1">
                  Hello {getUserName()}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-black">
                  What's your task going to be today?
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Stale data indicator */}
                {isStale && !loading && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded border border-orange-300">
                    Updating...
                  </span>
                )}

                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-black">
                  <span>{formatDate()}</span>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#FFE8DC] rounded-lg border-2 border-black shadow-[2px_2px_0_#1a1a1a]">
                    <CalendarIcon />
                  </div>
                </div>

                {/* Refresh button */}
                <button
                  onClick={() => refetch()}
                  disabled={loading}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#FFE8DC] rounded-lg border-2 border-black shadow-[2px_2px_0_#1a1a1a] hover:bg-[#FFD4BC] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh data"
                >
                  <RefreshIcon spinning={loading} />
                </button>
              </div>
            </header>

            {/* Stats Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="animate-[slideUp_0.5s_ease-out] [animation-delay:0.1s] opacity-0 [animation-fill-mode:forwards]">
                <StatCard
                  title="Your Base Rate"
                  value={stats.baseRate !== null ? `$ ${stats.baseRate}` : "-"}
                  unit="/hr"
                  icon="chart"
                />
              </div>
              <div className="animate-[slideUp_0.5s_ease-out] [animation-delay:0.2s] opacity-0 [animation-fill-mode:forwards]">
                <StatCard
                  title="Project This week"
                  value={stats.projectsThisWeek}
                  icon="folder"
                />
              </div>
              <div className="animate-[slideUp_0.5s_ease-out] [animation-delay:0.3s] opacity-0 [animation-fill-mode:forwards]">
                <StatCard
                  title="Project This Month"
                  value={stats.projectsThisMonth}
                  icon="folder"
                />
              </div>
            </section>

            {/* Recent Projects Section */}
            <section className="flex-1 animate-[slideUp_0.6s_ease-out] [animation-delay:0.4s] opacity-0 [animation-fill-mode:forwards]">
              <RecentProjects projects={recentProjects} />
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
