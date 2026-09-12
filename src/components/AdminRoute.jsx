import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");

  if (!token || !rawUser) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(rawUser);
    if (user.role !== "admin") {
      return (
        <Navigate
          to="/admin/login"
          replace
          state={{ error: "Accès refusé. Privilèges administrateur requis." }}
        />
      );
    }
  } catch {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
