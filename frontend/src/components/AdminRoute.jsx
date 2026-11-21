import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../services/user";

export default function AdminRoute() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      try {
        const user = await getCurrentUser();

        if (mounted) {
          setStatus(user.role === "admin" ? "admin" : "forbidden");
        }
      } catch (error) {
        if (mounted) {
          setStatus(
            error.response?.status === 401 ? "unauthorized" : "error"
          );
        }
      }
    };

    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  if (status === "forbidden") {
    return <Navigate to="/dashboard" replace />;
  }

  if (status === "error") {
    return (
      <div className="p-6 text-center text-red-400">
        Unable to verify administrator access. Please refresh and try again.
      </div>
    );
  }

  return <Outlet />;
}
