import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="pt-12 pl-12 pr-12">
      <header className="border-3 border-black rounded-3xl bg-white shadow-md px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <img src="/AUREA - Logo.png" alt="AUREA Logo" />
            </div>
            <div className="text-black flex flex-col items-end justify-center gap-0">
              <h1 className="text-2xl font-black tracking-tigh leading-none">
                AUREA
              </h1>
              <span className="text-xs leading-none mt-1 self-end">.tools</span>
            </div>
          </div>
          <nav className="hidden md:flex item-center gap-8">
            <a
              href="#"
              className="font-medium text-black hover:text-[#FB8500] transition"
            >
              About
            </a>
            <Link
              to="/portfolios"
              className="font-medium text-black hover:text-[#FB8500] transition"
            >
              Portfolios
            </Link>
            <a
              href="#"
              className="font-medium text-black hover:text-[#FB8500] transition"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/signin"
              className="font-medium text-black hover:text-[#FB8500] transition"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="bg-[#FB8500] text-white font-medium px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all border-2 border-black"
            >
              TRY AUREA
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
