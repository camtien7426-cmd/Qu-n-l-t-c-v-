import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_NAME } from "../config/constants.js";
import { Avatar } from "./Common.jsx";

// Các trang khác gọi: window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT))
// sau khi tạo / sửa / xóa dự án để thanh bên tự tải lại danh sách.
export const PROJECTS_CHANGED_EVENT = "taskflow:projects-changed";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-brand-100 text-brand-700" : "text-gray-700 hover:bg-gray-200"
  }`;

function Sidebar({ projects, state, onReload, onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto p-3" aria-label="Điều hướng chính">
      <div className="space-y-1">
        <NavLink to="/" end className={linkClass} onClick={onNavigate}>
          Bảng điều khiển
        </NavLink>
        <NavLink to="/projects" end className={linkClass} onClick={onNavigate}>
        Quản lý dự án
        </NavLink>
      </div>

      <div>
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Dự án</p>
        {state === "loading" && <p className="px-3 py-2 text-sm text-gray-500">Đang tải...</p>}
        {state === "error" && (
          <p className="px-3 py-2 text-sm text-red-600">
            Không tải được dự án.{" "}
            <button type="button" onClick={onReload} className="underline">
              Thử lại
            </button>
          </p>
        )}
        {state === "ready" && projects.length === 0 && <p className="px-3 py-2 text-sm text-gray-500">Chưa có dự án nào.</p>}
        <ul className="space-y-0.5">
          {projects.map((p) => (
            <li key={p.id}>
              <NavLink to={`/projects/${p.id}`} className={linkClass} onClick={onNavigate} title={p.name}>
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-600 text-xs font-bold text-white">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function SearchBox({ projects }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return [];
    return projects.filter((p) => p.name.toLowerCase().includes(keyword)).slice(0, 6);
  }, [q, projects]);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (id) => {
    setQ("");
    setOpen(false);
    navigate(`/projects/${id}`);
  };

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].id);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Tìm dự án..."
        aria-label="Tìm kiếm dự án"
        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
      {open && q.trim() && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Không có dự án phù hợp</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => go(p.id)} className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-gray-100">
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Menu tài khoản">
        <Avatar name={user.name} src={user.avatarUrl} size={34} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Hồ sơ cá nhân
          </Link>
          <button type="button" role="menuitem" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

// Khung chung kiểu Jira: thanh trên (tìm kiếm, chuông, ảnh đại diện) + thanh bên (danh sách dự án).
// Các trang khác chỉ cần khai báo <Route> bên trong layout này (xem App.jsx) là có sẵn khung.
export default function AppLayout({ children }) {
  const [projects, setProjects] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await api.get("/projects", { toast: false });
      setProjects(Array.isArray(data) ? data : []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(PROJECTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, load);
  }, [load]);

  // Đổi trang thì đóng ngăn kéo trên điện thoại
  useEffect(() => setDrawer(false), [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 text-gray-800">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-3 sm:px-4">
        <button type="button" onClick={() => setDrawer((v) => !v)} className="rounded p-2 text-gray-600 hover:bg-gray-100 md:hidden" aria-label="Mở danh sách dự án" aria-expanded={drawer}>
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
        <Link to="/" className="shrink-0 text-lg font-bold text-brand-600">
          {APP_NAME}
        </Link>
        <div className="flex flex-1 justify-center px-1 sm:px-4">
          <SearchBox projects={projects} />
        </div>
        <Link to="/notifications" className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100" aria-label="Thông báo" title="Thông báo">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </Link>
        <UserMenu />
      </header>

      <div className="relative flex flex-1">
        {/* Thanh bên: cố định trên máy tính, ngăn kéo trên điện thoại */}
        <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white md:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <Sidebar projects={projects} state={state} onReload={load} />
          </div>
        </aside>

        {drawer && (
          <div className="fixed inset-0 top-14 z-20 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} aria-hidden="true" />
            <aside className="absolute inset-y-0 left-0 w-64 max-w-[85%] bg-white shadow-xl">
              <Sidebar projects={projects} state={state} onReload={load} onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
