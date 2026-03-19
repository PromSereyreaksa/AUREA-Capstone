import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

const MenuIcon = ({ open }: { open: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    {open ? (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </>
    ) : (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    )}
  </svg>
);

export default function Navbar() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  const actionButtonClasses =
    "nb-pressable inline-flex items-center justify-center rounded-xl border-2 border-black px-4 py-2 text-sm font-black uppercase tracking-[0.08em] shadow-[4px_4px_0_#000]";

  return (
    <div className="px-3 pt-3 sm:px-6 sm:pt-6 lg:px-12 lg:pt-12">
      <header className="rounded-[1.75rem] border-[3px] border-black bg-white px-4 py-4 shadow-[4px_4px_0_#000] sm:px-5 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            onClick={handleCloseMenu}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black sm:h-12 sm:w-12">
              <img src="/AUREA - Logo.png" alt="AUREA Logo" />
            </div>
            <div className="flex min-w-0 flex-col justify-center text-black">
              <h1 className="text-xl font-black leading-none tracking-tight sm:text-2xl">
                AUREA
              </h1>
              <span className="mt-1 self-end text-[10px] leading-none sm:text-xs">
                .tools
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              to={user ? "/dashboard" : "/signup"}
              onClick={handleCloseMenu}
              className={`${actionButtonClasses} ${
                user
                  ? "bg-[#FFE8DC] text-black"
                  : "bg-[#FB8500] text-white"
              }`}
            >
              {user ? "Dashboard" : "Try"}
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              className="nb-pressable inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-[#FFFEF9] text-black shadow-[3px_3px_0_#000]"
            >
              <MenuIcon open={isMenuOpen} />
            </button>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <nav className="flex items-center gap-8">
              <a
                href="#"
                className="text-base font-medium text-black transition hover:text-[#FB8500]"
              >
                About
              </a>
              <Link
                to="/portfolios"
                className="text-base font-medium text-black transition hover:text-[#FB8500]"
              >
                Portfolios
              </Link>
              <a
                href="#"
                className="text-base font-medium text-black transition hover:text-[#FB8500]"
              >
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className={`${actionButtonClasses} bg-[#FB8500] text-white hover:bg-black hover:text-[#FB8500]`}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="text-base font-medium text-black transition hover:text-[#FB8500]"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className={`${actionButtonClasses} bg-[#FB8500] text-white hover:bg-black hover:text-[#FB8500]`}
                  >
                    Try Aurea
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mt-4 grid gap-4 border-t-[3px] border-black pt-4 md:hidden">
            <nav className="grid gap-2">
              <a
                href="#"
                onClick={handleCloseMenu}
                className="rounded-xl border-2 border-black bg-[#FFFEF9] px-4 py-3 text-sm font-bold text-black shadow-[2px_2px_0_#1a1a1a]"
              >
                About
              </a>
              <Link
                to="/portfolios"
                onClick={handleCloseMenu}
                className="rounded-xl border-2 border-black bg-[#FFFEF9] px-4 py-3 text-sm font-bold text-black shadow-[2px_2px_0_#1a1a1a]"
              >
                Portfolios
              </Link>
              <a
                href="#"
                onClick={handleCloseMenu}
                className="rounded-xl border-2 border-black bg-[#FFFEF9] px-4 py-3 text-sm font-bold text-black shadow-[2px_2px_0_#1a1a1a]"
              >
                Contact
              </a>
            </nav>

            {!user && (
              <div className="grid gap-2">
                <Link
                  to="/signin"
                  onClick={handleCloseMenu}
                  className="rounded-xl border-2 border-black bg-[#FFE8DC] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-black shadow-[3px_3px_0_#1a1a1a]"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}
