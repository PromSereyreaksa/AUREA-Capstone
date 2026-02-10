import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

// Icons as SVG components
const DashboardIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ProjectsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FeeEstimatorIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

interface SidebarProps {
  userName?: string;
  userAvatar?: string;
}

const Sidebar = ({ userName = "User", userAvatar }: SidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/projects", label: "Projects", icon: <ProjectsIcon /> },
    {
      path: "/fee-estimator",
      label: "Fee Estimator",
      icon: <FeeEstimatorIcon />,
    },
    { path: "/settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  return (
    <aside className="w-full lg:w-60 bg-[#FFFEF9] rounded-2xl p-4 sm:p-5 lg:p-6 flex flex-col shrink-0 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a]">
      {/* Logo */}
      <div className="text-black flex flex-col items-center mb-4 lg:mb-6 w-fit self-center">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
          AUREA
        </h1>
        <span className="text-xs leading-none self-end">.tools</span>
      </div>

      {/* User Profile Card */}
      <NavLink to="/designer-profile">
        <div className="flex items-center gap-3 p-2 sm:p-3 bg-[#FFE8DC] rounded-xl mb-4 lg:mb-6 border-2 border-black shadow-[2px_2px_0_#1a1a1a]">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center border-2 border-black">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-black">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-black tracking-wide">
              {userName.toUpperCase()}
            </span>
            <div className="text-[10px] text-black font-medium ">
              View Profile
            </div>
          </div>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="flex flex-row lg:flex-col gap-2 flex-wrap lg:flex-nowrap lg:flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-lg text-black text-xs sm:text-sm font-semibold transition-all duration-150 border-2 flex-1 lg:flex-none ${
                isActive
                  ? "bg-[#FFE8DC] border-black shadow-[2px_2px_0_#1a1a1a]"
                  : "border-transparent hover:bg-[#FFE8DC] hover:border-black hover:shadow-[2px_2px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5"
              }`
            }
          >
            <span className="flex items-center justify-center w-5">
              {item.icon}
            </span>
            <span className="hidden sm:inline lg:inline">{item.label}</span>
          </NavLink>
        ))}

        {/* Logout Button */}
        <button
          className="flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-lg text-black text-xs sm:text-sm font-semibold lg:mt-auto border-2 border-transparent hover:bg-[#FFE8DC] hover:border-black hover:shadow-[2px_2px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer w-full text-center lg:text-left flex-1 lg:flex-none"
          onClick={handleLogout}
        >
          <span className="flex items-center justify-center w-5">
            <LogoutIcon />
          </span>
          <span className="hidden sm:inline lg:inline">Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
