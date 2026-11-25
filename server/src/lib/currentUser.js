// Lấy mã người dùng hiện tại cho các API thống kê.
// Ưu tiên req.user (do requireAuth của phần Đăng nhập gắn vào).
// TODO: bỏ nhánh header "x-user-id" khi nhánh Bao-mat đã được gộp vào main (giống projectAuth.js).
export function getUserId(req) {
  const id = Number(req.user?.id ?? req.user?.userId ?? req.headers["x-user-id"]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Middleware: chưa đăng nhập thì trả 401
export function requireUserId(req, res, next) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Vui lòng đăng nhập để tiếp tục!" });
  }
  req.currentUserId = userId;
  next();
}
