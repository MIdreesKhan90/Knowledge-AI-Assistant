
import { useEffect, useState } from "react";
import {
  FileText,
  MessageSquare,
  Database,
  Bot,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Loader2,
  Activity,
} from "lucide-react";

import { getAnalyticsOverview } from "../services/analytics";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setError("");
      const data = await getAnalyticsOverview();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard analytics."
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
      title: "Total Documents",
      value: analytics?.total_documents ?? 0,
      icon: FileText,
      style: "bg-blue-500/10 text-blue-400",
      description: "Your uploaded files",
    },
    {
      title: "AI Conversations",
      value: analytics?.total_conversations ?? 0,
      icon: MessageSquare,
      style: "bg-purple-500/10 text-purple-400",
      description: "Your chat sessions",
    },
    {
      title: "Total Messages",
      value: analytics?.total_messages ?? 0,
      icon: Database,
      style: "bg-emerald-500/10 text-emerald-400",
      description: "Messages exchanged",
    },
    {
      title: "AI Responses",
      value: analytics?.total_ai_responses ?? 0,
      icon: Bot,
      style: "bg-orange-500/10 text-orange-400",
      description: "AI generated answers",
    },
  ];

  const activity = analytics?.daily_activity ?? [];
  const maxActivity = Math.max(
    ...activity.map((item) => item.total),
    1
  );

  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      { weekday: "short" }
    );
  };

  return (
    <div className="space-y-8 text-white">

      {/* Dashboard Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Your AI-powered knowledge workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
            <Sparkles size={18} />
            AI Knowledge Assistant
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            title="Refresh analytics"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 transition hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-50"
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
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button
            onClick={loadAnalytics}
            className="shrink-0 font-semibold hover:text-white"
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
              <span className="text-sm text-slate-400">
                {title}
              </span>

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

      {/* Activity and Getting Started */}
      <section className="grid gap-5 lg:grid-cols-3">

        {/* Activity Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Recent Activity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Message activity over the last 7 days
              </p>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
              <Activity size={20} />
            </div>
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 className="animate-spin text-blue-400" size={25} />
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
                Total messages: {analytics?.total_messages ?? 0}
              </p>
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <div className="rounded-2xl bg-slate-800 p-4">
                <Activity size={27} className="text-slate-400" />
              </div>
              <h3 className="mt-4 font-medium">
                No activity yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Start chatting with your AI assistant to see activity here.
              </p>
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={19} className="text-blue-400" />
            <h2 className="font-semibold">
              Getting Started
            </h2>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Make the most of your knowledge workspace.
          </p>

          <div className="mt-7 space-y-6">
            {[
              {
                title: "Create your account",
                description: "Your workspace is ready",
                done: true,
              },
              {
                title: "Upload documents",
                description: "Add your knowledge sources",
                done: (analytics?.total_documents ?? 0) > 0,
              },
              {
                title: "Ask AI questions",
                description: "Explore your uploaded content",
                done: (analytics?.total_user_messages ?? 0) > 0,
              },
            ].map((item, index) => (
              <div key={item.title} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    item.done
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.done ? "✓" : index + 1}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-blue-500/15 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 text-blue-300">
              <Sparkles size={15} />
              <span className="text-xs font-semibold">
                KnowledgeAI Tip
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Upload your documents and ask questions to get intelligent,
              context-aware answers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}