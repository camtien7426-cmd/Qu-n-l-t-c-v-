import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TOAST_EVENT } from "../api.js";

const ToastContext = createContext(null);
const AUTO_CLOSE_MS = 4500;

const STYLES = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

// Thông báo toast dùng chung. Dùng: const toast = useToast(); toast.error("..."), toast.success("...")
// Lỗi từ api.js tự hiện toast, không cần gọi tay.
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message, type = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setItems((list) => [...list.slice(-3), { id, message, type }]);
      setTimeout(() => remove(id), AUTO_CLOSE_MS);
    },
    [remove]
  );

  useEffect(() => {
    const onToast = (e) => push(e.detail.message, e.detail.type);
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [push]);

  const value = useMemo(
    () => ({
      show: push,
      error: (m) => push(m, "error"),
      success: (m) => push(m, "success"),
      info: (m) => push(m, "info"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${STYLES[t.type] || STYLES.info}`}
          >
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Đóng thông báo"
              className="font-bold leading-none opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  return ctx;
}
