// import React from "react";
export default function Navbar() {
  return (
    <>
      <header className="border-3 border-black rounded-3xl bg-white shadow-md p-5">
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
              className="font-md text-black! hover:text-[#FB8500] transition"
            >
              About
            </a>
            <a
              href="#"
              className="font-md text-black! hover:text-[#FB8500] transition"
            >
              Portfolios
            </a>
            <a
              href="#"
              className="font-md text-black! hover:text-[#FB8500]! transition"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="font-md text-black hover:text-[#FB8500] transition">
              Log in
            </button>
            <button className="bg-[#FB8500] text-white font-md px-6 py-2 border-2 border-black rounded-lg hover:scale-105 transition-transform">
              TRY AUREA
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
