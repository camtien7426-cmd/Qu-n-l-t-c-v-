import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FullPageLoading } from "./Spinner.jsx";

// Trang cần đăng nhập: chưa đăng nhập thì chuyển về /login (nhớ trang đang muốn vào)
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Trang dành cho khách (đăng nhập, đăng ký...): đã đăng nhập thì chuyển về trang chính
export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoading />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
