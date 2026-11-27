import { httpError } from "./httpError.js";

// Giới hạn số lần thử theo khóa (IP + email) để chống dò mật khẩu.
// Lưu trong bộ nhớ, đủ dùng cho một máy chủ nhỏ.
export function createLimiter({ max, windowMs, message }) {
  const hits = new Map();

  const clean = (now) => {
    for (const [key, item] of hits) {
      if (item.resetAt <= now) hits.delete(key);
    }
  };

  return {
    // Gọi trước khi xử lý: ném lỗi 429 nếu đã quá số lần
    check(key) {
      const now = Date.now();
      clean(now);
      const item = hits.get(key);
      if (item && item.count >= max) {
        throw httpError(429, message);
      }
    },
    // Ghi nhận một lần thất bại
    fail(key) {
      const now = Date.now();
      const item = hits.get(key);
      if (!item || item.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
      } else {
        item.count += 1;
      }
    },
    // Xóa bộ đếm khi thành công
    reset(key) {
      hits.delete(key);
    },
  };
}
