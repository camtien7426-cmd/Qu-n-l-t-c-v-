// TẠM THỜI: giả lập đăng nhập bằng header "X-User-Id" cho đến khi Người 1 xong requireAuth (JWT).
// Khi có requireAuth: trong routes/tasks.js thay `tempAuth` bằng `requireAuth` (cùng gán req.user = { id }).
import { prisma } from "../lib/prisma.js";

export async function tempAuth(req, res, next) {
  try {
    const id = parseInt(req.get("x-user-id"));
    if (!id) return res.status(401).json({ error: "Bạn chưa đăng nhập." });
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!user) return res.status(401).json({ error: "Người dùng không tồn tại." });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
