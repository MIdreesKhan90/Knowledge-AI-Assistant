import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    const currentTime = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp <= currentTime) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("current_user");

      return <Navigate to="/login?session=expired" replace />;
    }
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}