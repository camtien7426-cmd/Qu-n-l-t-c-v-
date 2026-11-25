import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/token.js";
import { httpError, asyncHandler } from "../lib/httpError.js";
import { publicUserSelect } from "../lib/user.js";

const INVALID_SESSION = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!";

// Chặn người chưa đăng nhập. Thành công thì gắn req.user (không có passwordHash).
// Đọc lại người dùng từ database để tài khoản đã bị xóa không còn dùng được token cũ.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw httpError(401, "Bạn cần đăng nhập để thực hiện thao tác này!");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw httpError(401, INVALID_SESSION);
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) throw httpError(401, INVALID_SESSION);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) throw httpError(401, INVALID_SESSION);

  req.user = user;
  next();
});
