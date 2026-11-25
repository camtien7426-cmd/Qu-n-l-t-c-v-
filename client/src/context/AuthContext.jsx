import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore, SESSION_EXPIRED_EVENT } from "../api.js";

// BẢN TẠM của Người 2 để khung giao diện chạy được trên main.
// Khi gộp nhánh Bao-mat (Người 1): GIỮ file AuthContext.jsx của Người 1, bỏ file này.
// Hai bản dùng chung giao diện: { user, loading, logout }.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // CHỈ khi chạy dev: cho phép thử giao diện khi chưa có đăng nhập thật (xem api.js)
  const [user, setUser] = useState(() => {
    if (!import.meta.env.DEV || tokenStore.get()) return null;
    try {
      const id = localStorage.getItem("taskflow.devUserId");
      return id ? { id: Number(id), name: `Người dùng thử #${id}`, email: "dev@localhost", avatarUrl: null } : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let cancelled = false;
    api
      .get("/auth/me", { toast: false })
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => !cancelled && tokenStore.clear())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const logout = useCallback(async () => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, logout, setUser }), [user, loading, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}
