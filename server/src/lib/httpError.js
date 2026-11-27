// Tạo lỗi có mã HTTP. Middleware lỗi trong app.js sẽ trả { error: "..." }.
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Bọc route async để lỗi được chuyển sang next(err) (Express 4 không tự làm việc này)
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
