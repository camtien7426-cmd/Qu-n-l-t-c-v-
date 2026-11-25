// Module gọi API dùng chung: mọi component gọi qua đây, KHÔNG viết cứng địa chỉ máy chủ.
// - Tự gắn token đăng nhập vào header Authorization.
// - Địa chỉ lấy từ VITE_API_URL (mặc định "/api", Vite dev tự chuyển sang backend).
// - Lỗi tự hiện thông báo toast dùng chung (tắt cho từng lệnh gọi bằng { toast: false }).
const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
const TOKEN_KEY = "taskflow.token";
const DEV_USER_KEY = "taskflow.devUserId";

export const TOAST_EVENT = "taskflow:toast";
export const SESSION_EXPIRED_EVENT = "taskflow:session-expired";

// Token lưu ở localStorage (bọc try/catch phòng trình duyệt chặn lưu trữ)
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* bỏ qua */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* bỏ qua */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Gửi thông báo toast từ bất kỳ đâu (ToastProvider lắng nghe sự kiện này)
export function showToast(message, type = "error") {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
}

async function request(path, { method = "GET", body, form, auth = true, toast = true } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  // CHỈ khi chạy dev và chưa có đăng nhập thật: cho phép thử bằng mã người dùng
  // (khớp nhánh tạm "x-user-id" trong server). Gõ trong console:
  //   localStorage.setItem("taskflow.devUserId", "1")
  if (import.meta.env.DEV && !token) {
    try {
      const devId = localStorage.getItem(DEV_USER_KEY);
      if (devId) headers["x-user-id"] = devId;
    } catch {
      /* bỏ qua */
    }
  }

  let payload;
  if (form) {
    payload = form; // FormData: trình duyệt tự đặt Content-Type kèm boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    const message = "Không kết nối được máy chủ. Hãy kiểm tra mạng và thử lại!";
    if (toast) showToast(message);
    throw new ApiError(message, 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* phản hồi không có JSON */
  }

  if (!res.ok) {
    // 401 khi đang có token nghĩa là phiên đã hết hạn
    if (res.status === 401 && auth && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    const message = data?.error || "Có lỗi xảy ra, vui lòng thử lại!";
    if (toast) showToast(message);
    throw new ApiError(message, res.status);
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
  upload: (path, form, options) => request(path, { ...options, method: "POST", form }),
};
