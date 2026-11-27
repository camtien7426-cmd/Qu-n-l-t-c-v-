import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore, SESSION_EXPIRED_EVENT } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Có token thì phải hỏi máy chủ xem token còn dùng được không trước khi hiển thị trang
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));
  const [expired, setExpired] = useState(false);

  // Khởi động: khôi phục phiên đăng nhập từ token đã lưu
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let cancelled = false;
    api
      .get("/auth/me")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        // Token sai / hết hạn / máy chủ lỗi: coi như chưa đăng nhập
        if (!cancelled) {
          tokenStore.clear();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // api.js báo token hết hạn giữa chừng (ví dụ sau 1 ngày): đưa về trang đăng nhập
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const startSession = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    setExpired(false);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.post("/auth/login", { email, password }, { auth: false });
      startSession(data);
    },
    [startSession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await api.post("/auth/register", { name, email, password }, { auth: false });
      startSession(data);
    },
    [startSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* dù máy chủ lỗi vẫn đăng xuất ở trình duyệt */
    }
    tokenStore.clear();
    setUser(null);
    setExpired(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, expired, login, register, logout, setUser }),
    [user, loading, expired, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}
