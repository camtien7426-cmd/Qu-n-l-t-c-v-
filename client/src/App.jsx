import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { Loading } from "./components/Common.jsx";
import AppLayout from "./components/AppLayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProjectStatsPage from "./pages/ProjectStatsPage.jsx";
import LegacyTabsPage from "./pages/LegacyTabsPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";

// Trang cần đăng nhập: chưa đăng nhập thì về trang giới thiệu
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Đang kiểm tra đăng nhập..." />;
  return user ? <Outlet /> : <Navigate to="/" replace />;
}

// "/" : khách thấy trang giới thiệu, người đã đăng nhập thấy bảng điều khiển trong khung chung
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Đang kiểm tra đăng nhập..." />;
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

            {/* Trang của Người 1 (Đăng nhập/Đăng ký). Khi gộp nhánh Bao-mat, thay 2 dòng giữ chỗ này bằng LoginPage / RegisterPage */}
            <Route path="/login" element={<PlaceholderPage title="Đăng nhập" owner="Người 1" />} />
            <Route path="/register" element={<PlaceholderPage title="Đăng ký" owner="Người 1" />} />

            {/* Mọi trang sau đăng nhập nằm trong khung chung AppLayout.
                Thành viên khác chỉ cần thêm <Route> vào khối này. */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/projects/:projectId" element={<ProjectStatsPage />} />
                <Route path="/notifications" element={<PlaceholderPage title="Thông báo" owner="Người 6" />} />
                <Route path="/profile" element={<PlaceholderPage title="Hồ sơ cá nhân" owner="Người 1" />} />
                <Route path="/legacy" element={<LegacyTabsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<PlaceholderPage title="Không tìm thấy trang" />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
