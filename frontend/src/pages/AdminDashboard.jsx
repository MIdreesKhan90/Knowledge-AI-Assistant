
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  FileText,
  MessageSquare,
  Database,
  Bot,
  Activity,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import { getAdminAnalytics } from "../services/adminAnalytics";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Admin analytics error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load admin dashboard analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const stats = [
    {
      title: "Total Users",
      value: analytics?.total_users ?? 0,
      icon: Users,
      style: "bg-blue-500/10 text-blue-400",
      description: "Registered platform users",
    },
    {
      title: "Active Users",
      value: analytics?.active_users ?? 0,
      icon: UserCheck,
      style: "bg-emerald-500/10 text-emerald-400",
      description: "Currently active accounts",
    },
    {
      title: "Inactive Users",
      value: analytics?.inactive_users ?? 0,
      icon: UserX,
      style: "bg-orange-500/10 text-orange-400",
      description: "Deactivated accounts",
    },
    {
      title: "Admin Users",
      value: analytics?.admin_users ?? 0,
      icon: ShieldCheck,
      style: "bg-purple-500/10 text-purple-400",
      description: "Platform administrators",
    },
    {
      title: "Total Documents",
      value: analytics?.total_documents ?? 0,
      icon: FileText,
      style: "bg-cyan-500/10 text-cyan-400",
      description: "Uploaded platform documents",
    },
    {
      title: "Conversations",
      value: analytics?.total_conversations ?? 0,
      icon: MessageSquare,
      style: "bg-indigo-500/10 text-indigo-400",
      description: "Total AI conversations",
    },
    {
      title: "Total Messages",
      value: analytics?.total_messages ?? 0,
      icon: Database,
      style: "bg-pink-500/10 text-pink-400",
      description: "Platform-wide messages",
    },
    {
      title: "AI Responses",
      value: analytics?.total_ai_responses ?? 0,
      icon: Bot,
      style: "bg-amber-500/10 text-amber-400",
      description: "AI generated responses",
    },
  ];

  const activity = analytics?.daily_activity ?? [];

  const maxActivity = Math.max(
    ...activity.map((item) => item.total),
    1
  );

  const formatDate = (date) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    });

  return (
    <div className="space-y-8 text-white">

      {/* Admin Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
              <ShieldCheck size={13} className="mr-1 inline" />
              Administrator
            </span>
          </div>

          <h1 className="text-2xl font-bold md:text-3xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor users, documents and overall platform activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300 sm:flex">
            <Sparkles size={18} />
            Platform Overview
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            title="Refresh analytics"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 transition hover:border-blue-500/50 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
          </button>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 sm:flex-row sm:items-center">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadAnalytics}
            className="shrink-0 cursor-pointer font-semibold transition hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, style, description }) => (
          <div
            key={title}
            className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600 hover:shadow-xl hover:shadow-black/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{title}</span>

              <div className={`rounded-xl p-3 ${style}`}>
                <Icon size={21} />
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <h2 className="text-3xl font-bold tracking-tight">
                {loading ? (
                  <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-slate-800" />
                ) : (
                  value.toLocaleString()
                )}
              </h2>

              <ArrowUpRight
                size={18}
                className="mb-1 text-slate-600 transition group-hover:text-blue-400"
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {description}
            </p>
          </div>
        ))}
      </section>

      {/* Platform Activity */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Platform Activity</h2>
            <p className="mt-1 text-xs text-slate-500">
              Total message activity over the last 7 days
            </p>
          </div>

          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
            <Activity size={20} />
          </div>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2
              className="animate-spin text-blue-400"
              size={25}
            />
          </div>
        ) : activity.length > 0 ? (
          <div className="mt-8">
            <div className="flex h-44 items-end justify-around gap-3 border-b border-slate-800 px-2">
              {activity.map((item) => (
                <div
                  key={item.date}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-medium text-slate-400">
                    {item.total}
                  </span>

                  <div
                    title={`${item.total} messages`}
                    className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-400 transition-all duration-500 hover:from-blue-500 hover:to-cyan-300"
                    style={{
                      height: `${Math.max(
                        (item.total / maxActivity) * 100,
                        5
                      )}%`,
                    }}
                  />

                  <span className="text-[10px] text-slate-500">
                    {formatDate(item.date)}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">
              Total platform messages:{" "}
              {analytics?.total_messages ?? 0}
            </p>
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center text-center">
            <div className="rounded-2xl bg-slate-800 p-4">
              <Activity size={27} className="text-slate-400" />
            </div>

            <h3 className="mt-4 font-medium">No activity yet</h3>

            <p className="mt-2 text-sm text-slate-500">
              Platform message activity will appear here.
            </p>
          </div>
        )}
      </section>

      {/* Admin Information */}
      <section className="rounded-2xl border border-purple-500/15 bg-gradient-to-r from-purple-500/5 to-blue-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-200">
              Platform Administration
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              You are viewing platform-wide analytics. Use this
              dashboard to monitor registered accounts, document
              uploads and AI usage across KnowledgeAI.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
