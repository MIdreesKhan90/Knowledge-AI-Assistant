import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Search,
  Settings,
  Brain,
  ShieldCheck,
  Users,
} from "lucide-react";

import { getCurrentUser } from "../services/user";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", path: "/documents", icon: FileText },
  { name: "AI Chat", path: "/chat", icon: MessageSquare },
  { name: "Search", path: "/search", icon: Search },
];

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const user = await getCurrentUser();

        if (mounted) {
          setIsAdmin(user.role === "admin");
        }
      } catch (error) {
        console.error("Unable to load sidebar user:", error);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-5 text-white">

      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2">
          <Brain size={24} />
        </div>

        <div>
          <h1 className="text-xl font-bold">KnowledgeAI</h1>
          <p className="text-xs text-slate-400">
            Knowledge Assistant
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Workspace
      </p>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon size={19} />
            {name}
          </NavLink>
        ))}

        {/* Admin Dashboard - Admin Only */}
        {isAdmin && (
          <>
            <div className="my-5 border-t border-slate-800" />

            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Administration
            </p>

            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition duration-200 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <ShieldCheck size={19} />
              Admin Dashboard
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition duration-200 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Users size={19} />
              User Management
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-semibold">KnowledgeAI Pro</p>
        <p className="mt-1 text-xs text-slate-400">
          Your knowledge, powered by AI.
        </p>
      </div>
    </aside>
  );
}