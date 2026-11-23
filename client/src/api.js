const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("currentUserId");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    // Header tạm dùng để test phân quyền trước khi bên Auth gộp xong JWT token
    ...(currentUserId && { "x-user-id": currentUserId }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Đã xảy ra lỗi khi kết nối máy chủ!");
  }

  return data;
}