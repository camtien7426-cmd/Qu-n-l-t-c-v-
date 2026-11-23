// TẠM THỜI: gửi header X-User-Id để giả lập đăng nhập. Khi Người 2 xong api.js (tự gắn token) thì thay file này bằng api.js.
export async function taskApi(path, { method = "GET", body, userId } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-User-Id": String(userId || "") },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
  return data;
}

export const STATUS_LABEL = { TODO: "Chưa thực hiện", IN_PROGRESS: "Đang thực hiện", DONE: "Hoàn thành" };
export const PRIORITY_LABEL = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao" };
export const PRIORITY_STYLE = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};
export const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
export const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "Chưa đặt");
