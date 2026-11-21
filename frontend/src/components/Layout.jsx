
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Logout from "./Logout";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden h-full shrink-0 md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative h-full w-72 max-w-[85vw]">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>

            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header - Fixed */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-4 sm:px-5 md:px-8">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-semibold">
                Workspace
              </h2>

              <p className="hidden text-xs text-slate-400 sm:block">
                Manage your knowledge with AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-label="Notifications"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Bell size={20} />
            </button>

            <Logout />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:p-8">
          <Outlet />
        </div>

      </main>
    </div>
  );
}
