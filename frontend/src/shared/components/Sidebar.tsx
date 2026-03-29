import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import UserAvatar from "./UserAvatar";

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

const Sidebar = ({ userName, userAvatar }: SidebarProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const avatarName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || user?.first_name || user?.last_name;

  const resolvedUserName =
    userName ||
    avatarName ||
    user?.email?.split("@")[0] ||
    "User";
  const resolvedUserAvatar = userAvatar || user?.avatar_url;

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
    {
      path: "/fee-estimator",
      label: "Fee Estimator",
      icon: <FeeEstimatorIcon />,
    },
  ];

  return (
    <aside className="w-full shrink-0 rounded-2xl border-[3px] border-black bg-[#FFFEF9] p-3 shadow-[2px_2px_0_#1a1a1a] flex flex-col lg:w-60 lg:p-6">
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-6 lg:flex-col lg:items-center">
        <Link to="/" className="flex items-center gap-3 text-black lg:flex-col lg:gap-1">
          <div className="flex flex-col">
            <h1 className="text-lg font-black leading-none tracking-tight sm:text-xl lg:text-2xl">
              AUREA
            </h1>
            <span className="self-end text-[10px] leading-none lg:text-xs">
              .tools
            </span>
          </div>
        </Link>

        <NavLink
          to="/designer-profile"
          className="nb-pressable flex min-w-0 items-center gap-2 rounded-xl border-2 border-black bg-[#FFE8DC] px-2 py-2 shadow-[2px_2px_0_#1a1a1a] lg:w-full lg:px-3"
        >
          <UserAvatar
            name={avatarName}
            email={user?.email}
            imageUrl={resolvedUserAvatar}
            seed={user?.user_id ?? resolvedUserName}
            className="h-10 w-10 shrink-0 rounded-lg border-2 border-black"
            initialsClassName="text-xs sm:text-sm"
          />

          <div className="min-w-0">
            <span className="block truncate text-[11px] font-extrabold uppercase tracking-[0.08em] text-black">
              {resolvedUserName}
            </span>
            <div className="text-[10px] font-medium text-black">View Profile</div>
          </div>
        </NavLink>
      </div>

      <nav className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nb-pressable flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-center text-xs font-bold sm:text-sm lg:justify-start lg:px-4 ${
                isActive
                  ? "border-black bg-[#FFE8DC] text-black shadow-[2px_2px_0_#1a1a1a]"
                  : "border-black bg-white text-black shadow-[2px_2px_0_#1a1a1a] hover:bg-[#FFF3E8]"
              }`
            }
          >
            <span className="flex w-5 items-center justify-center">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-2">
        <button
          className="nb-pressable col-span-2 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-3 text-center text-xs font-bold text-black shadow-[2px_2px_0_#1a1a1a] hover:bg-[#FFF3E8] sm:text-sm lg:justify-start lg:px-4"
          onClick={handleLogout}
        >
          <span className="flex w-5 items-center justify-center">
            <LogoutIcon />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
