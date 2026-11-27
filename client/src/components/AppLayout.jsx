import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import Avatar from "./Avatar.jsx";
import { ChevronDownIcon, FolderIcon, LogoutIcon, UserIcon } from "./Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Đóng menu khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
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
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-slate-700 sm:block">{user.name}</span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <UserIcon className="h-5 w-5 text-slate-400" /> Hồ sơ cá nhân
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogoutIcon className="h-5 w-5" /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Khung chung của các trang sau khi đăng nhập: thanh điều hướng + nội dung
export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Điều hướng chính">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`
                }
              >
                <FolderIcon className="h-5 w-5" /> Dự án
              </NavLink>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
