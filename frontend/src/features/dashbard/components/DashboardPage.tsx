import { useAuth } from "../../auth/context/AuthContext";
import Sidebar from "../../../shared/components/Sidebar";
import StatCard from "./StatCard";
import RecentProjects from "./RecentProjects";

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

const DashboardPage = () => {
  const { user } = useAuth();

  // Get user's first name from email or use default
  const getUserName = () => {
    if (user?.email) {
      const emailPrefix = user.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return "User";
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

  // Mock data - replace with actual data from API
  const stats = {
    baseRate: "-",
    projectsThisWeek: 2,
    projectsThisMonth: 6,
  };

  const recentProjects = [
    {
      id: 1,
      name: "Brand Identity Design",
      clientName: "Techo Acadmic School",
    },
    { id: 2, name: "Website Redesign", clientName: "PhsarDesign Startup" },
    { id: 3, name: "App Design", clientName: "Johnny YesPaPa Co., Ltd." },
    { id: 4, name: "Logo Design", clientName: "Yraspocc Industry" },
    { id: 5, name: "Tech Start Up Branding", clientName: "Ilong Chea" },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FB8500] p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6 font-sans">
      <Sidebar userName={getUserName()} />

      <main className="flex-1 bg-[#FFFEF9] rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5 md:gap-6 overflow-y-auto border-[3px] border-black shadow-[2px_2px_0_#1a1a1a]">
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
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-black">
            <span>{formatDate()}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#FFE8DC] rounded-lg border-2 border-black shadow-[2px_2px_0_#1a1a1a]">
              <CalendarIcon />
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Your Base Rate"
            value={`$ ${stats.baseRate}`}
            unit="/hr"
            icon="chart"
          />
          <StatCard
            title="Project This week"
            value={stats.projectsThisWeek}
            icon="folder"
          />
          <StatCard
            title="Project This Month"
            value={stats.projectsThisMonth}
            icon="folder"
          />
        </section>

        {/* Recent Projects Section */}
        <section className="flex-1">
          <RecentProjects projects={recentProjects} />
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
