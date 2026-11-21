import { LoaderCircle, CheckCircle2, AlertCircle, Inbox } from "lucide-react";

const variants = {
  loading: {
    icon: LoaderCircle,
    color: "text-blue-400",
    title: "Loading...",
  },
  success: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    title: "Success",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    title: "Something went wrong",
  },
  empty: {
    icon: Inbox,
    color: "text-slate-400",
    title: "Nothing here yet",
  },
};

export default function StatusMessage({
  type = "empty",
  message,
}) {
  const status = variants[type] || variants.empty;
  const Icon = status.icon;

  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
      <Icon
        size={32}
        className={`${status.color} ${type === "loading" ? "animate-spin" : ""}`}
      />

      <h3 className="mt-4 font-semibold text-white">
        {status.title}
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        {message}
      </p>
    </div>
  );
}