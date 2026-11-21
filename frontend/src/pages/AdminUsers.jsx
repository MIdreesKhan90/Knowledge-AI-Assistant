import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  CalendarDays,
} from "lucide-react";

import {
  getAdminUsers,
  updateUserStatus,
  updateUserRole,
} from "../services/adminUsers";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadUsers = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers(searchTerm);
      setUsers(data.users ?? []);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (user) => {
    const action = user.is_active ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError("");

      await updateUserStatus(user.id, !user.is_active);
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to update user status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return;

    if (
      !window.confirm(
        `Change ${user.name}'s role to ${newRole}?`
      )
    ) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError("");

      await updateUserRole(user.id, newRole);
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to update user role."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const activeCount = users.filter((user) => user.is_active).length;
  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <div className="space-y-7 text-white">

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-purple-400">
            <ShieldCheck size={17} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Administration
            </span>
          </div>

          <h1 className="text-2xl font-bold md:text-3xl">
            User Management
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage accounts, permissions and user access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadUsers()}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm text-slate-300 transition hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <RefreshCw size={17} />
          )}
          Refresh
        </button>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Total Users",
            value: users.length,
            icon: Users,
            color: "text-blue-400 bg-blue-500/10",
          },
          {
            title: "Active Users",
            value: activeCount,
            icon: UserCheck,
            color: "text-emerald-400 bg-emerald-500/10",
          },
          {
            title: "Administrators",
            value: adminCount,
            icon: ShieldCheck,
            color: "text-purple-400 bg-purple-500/10",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {item.title}
              </span>

              <div className={`rounded-xl p-3 ${item.color}`}>
                <item.icon size={20} />
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold">
              {loading ? "—" : item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      {/* User Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">All Users</h2>
            <p className="mt-1 text-xs text-slate-500">
              Search and manage registered accounts.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60">
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 font-semibold">User</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Joined</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <Loader2
                      size={25}
                      className="mx-auto animate-spin text-blue-400"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading users...
                    </p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <Users
                      size={30}
                      className="mx-auto text-slate-600"
                    />
                    <p className="mt-3 font-medium text-slate-300">
                      No users found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try another name or email.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div>
                          <p className="font-medium text-slate-200">
                            {user.name}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(e) =>
                          handleRoleChange(user, e.target.value)
                        }
                        className="cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                          user.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.is_active
                              ? "bg-emerald-400"
                              : "bg-red-400"
                          }`}
                        />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={15} />
                        {formatDate(user.created_at)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={updatingId === user.id}
                        onClick={() => handleStatusChange(user)}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          user.is_active
                            ? "border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {updatingId === user.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : user.is_active ? (
                          <UserX size={14} />
                        ) : (
                          <UserCheck size={14} />
                        )}

                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
          Showing {users.length} users
        </div>
      </section>
    </div>
  );
}
