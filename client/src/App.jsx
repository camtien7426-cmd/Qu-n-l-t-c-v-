
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { GuestRoute, ProtectedRoute } from "./components/RouteGuards.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { FullPageLoading } from "./components/Spinner.jsx";

import AppLayout from "./components/AppLayout.jsx";

// Các trang xác thực của Người 1.
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import HomePage from "./pages/HomePage.jsx";

// Các trang giao diện của Người 2.
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProjectStatsPage from "./pages/ProjectStatsPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";

// Khách xem trang giới thiệu.
// Người đã đăng nhập xem Dashboard.
function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoading />;

  return user ? (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  ) : (
    <LandingPage />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRoute />} />

            {/* Các trang dành cho khách. */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />
            </Route>

            {/* Trang đặt lại mật khẩu. */}
            <Route
              path="/reset-password"
              element={<ResetPasswordPage />}
            />

            {/* Các trang yêu cầu đăng nhập. */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/projects" element={<HomePage />} />

                <Route
                  path="/projects/:projectId"
                  element={<ProjectStatsPage />}
                />

                <Route
                  path="/notifications"
                  element={
                    <PlaceholderPage
                      title="Thông báo"
                      owner="Người 6"
                    />
                  }
                />

                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
