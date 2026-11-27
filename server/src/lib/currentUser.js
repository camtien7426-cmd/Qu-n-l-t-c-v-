
 // Lấy mã người dùng đã được xác thực bởi requireAuth.
export function getUserId(req) {
  const id = Number(req.user?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Middleware kiểm tra người dùng hiện tại.
export function requireUserId(req, res, next) {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({
      error: "Vui lòng đăng nhập để tiếp tục!",
    });
  }

  req.currentUserId = userId;
  next();
}
