import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

// Tải dữ liệu GET kèm 3 trạng thái: đang tải / lỗi / có dữ liệu. Lỗi hiện trong trang, không bật toast.
export function useApi(path, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError("");
    try {
      setData(await api.get(path, { toast: false }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
