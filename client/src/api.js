// Module gọi API dùng chung: mọi component đều gọi qua đây, không viết cứng địa chỉ máy chủ.
// Trong dev, Vite chuyển /api sang backend (xem vite.config.js). Khi triển khai có thể đặt VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "taskflow.token";

// Token đăng nhập lưu ở localStorage (có bọc try/catch phòng trình duyệt chặn lưu trữ)
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

// Gửi sự kiện này khi token hết hạn / không hợp lệ để AuthContext đưa người dùng về trang đăng nhập
export const SESSION_EXPIRED_EVENT = "taskflow:session-expired";

async function request(path, { method = "GET", body, form, auth = true } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

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
    throw new ApiError("Không kết nối được máy chủ. Hãy kiểm tra mạng và thử lại!", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* phản hồi không có JSON */
  }

  if (!res.ok) {
    // 401 khi đang có token nghĩa là phiên đã hết hạn (khác với sai mật khẩu lúc đăng nhập)
    if (res.status === 401 && auth && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(data?.error || "Có lỗi xảy ra, vui lòng thử lại!", res.status);
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
