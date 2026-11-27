
// Module gọi API dùng chung cho toàn bộ ứng dụng.
const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
const TOKEN_KEY = "taskflow.token";

export const TOAST_EVENT = "taskflow:toast";
export const SESSION_EXPIRED_EVENT = "taskflow:session-expired";

// Quản lý token đăng nhập.
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

// Gửi thông báo đến ToastProvider.
export function showToast(message, type = "error") {
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { message, type },
    })
  );
}

// Hàm xử lý request dùng chung.
async function request(
  path,
  {
    method = "GET",
    body,
    form,
    auth = true,
    toast = true,
  } = {}
) {
  const headers = {};
  const token = tokenStore.get();

  // Chỉ sử dụng JWT Bearer để xác thực.
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload;

  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: payload,
    });
  } catch {
    const message =
      "Không kết nối được máy chủ. Hãy kiểm tra mạng và thử lại!";

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
    // Xử lý phiên đăng nhập hết hạn.
    if (res.status === 401 && auth && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    const message =
      data?.error || "Có lỗi xảy ra, vui lòng thử lại!";

    if (toast) showToast(message);

    throw new ApiError(message, res.status);
  }

  return data;
}

// Các phương thức gọi API.
export const api = {
  get: (path, options) =>
    request(path, { ...options, method: "GET" }),

  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),

  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),

  delete: (path, options) =>
    request(path, { ...options, method: "DELETE" }),

  upload: (path, form, options) =>
    request(path, { ...options, method: "POST", form }),
};
