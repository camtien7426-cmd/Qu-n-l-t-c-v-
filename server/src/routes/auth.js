import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import multer from "multer";

import { prisma } from "../lib/prisma.js";
import { env, isDev } from "../config/env.js";
import { signToken } from "../lib/token.js";
import { httpError, asyncHandler } from "../lib/httpError.js";
import { publicUserSelect } from "../lib/user.js";
import { createLimiter } from "../lib/rateLimit.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Hằng số và hàm kiểm tra dữ liệu                                     */
/* ------------------------------------------------------------------ */

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_MINUTES = 15;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Băm giả để thời gian phản hồi khi email không tồn tại gần giống khi sai mật khẩu
const DUMMY_HASH = bcrypt.hashSync("taskflow-dummy-password", BCRYPT_ROUNDS);

const loginLimiter = createLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút!",
});
const forgotLimiter = createLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 15 phút!",
});

const asString = (value) => (typeof value === "string" ? value : "");

function cleanName(value) {
  const name = asString(value).trim().replace(/\s+/g, " ");
  if (name.length < 2) throw httpError(400, "Họ tên phải có ít nhất 2 ký tự!");
  if (name.length > 100) throw httpError(400, "Họ tên không được quá 100 ký tự!");
  return name;
}

function cleanEmail(value) {
  const email = asString(value).trim().toLowerCase();
  if (!email) throw httpError(400, "Email không được để trống!");
  if (email.length > 255 || !EMAIL_REGEX.test(email)) {
    throw httpError(400, "Email không hợp lệ!");
  }
  return email;
}

function cleanPassword(value, label = "Mật khẩu") {
  const password = asString(value);
  if (password.length < 6) throw httpError(400, `${label} phải có ít nhất 6 ký tự!`);
  // bcrypt chỉ dùng 72 byte đầu, nên chặn sớm để tránh hiểu nhầm
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw httpError(400, `${label} không được dài quá 72 ký tự!`);
  }
  return password;
}

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const limiterKey = (req, email) => `${req.ip}|${email}`;

/* ------------------------------------------------------------------ */
/* Đăng ký, đăng nhập, đăng xuất                                       */
/* ------------------------------------------------------------------ */

// POST /api/auth/register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const name = cleanName(req.body?.name);
    const email = cleanEmail(req.body?.email);
    const password = cleanPassword(req.body?.password);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw httpError(409, "Email này đã được đăng ký!");

    let user;
    try {
      user = await prisma.user.create({
        data: { name, email, passwordHash: await hashPassword(password) },
        select: publicUserSelect,
      });
    } catch (err) {
      // Hai người đăng ký cùng email cùng lúc: ràng buộc UNIQUE của database bắt được
      if (err.code === "P2002") throw httpError(409, "Email này đã được đăng ký!");
      throw err;
    }

    res.status(201).json({ token: signToken(user.id), user });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body?.email);
    const password = asString(req.body?.password);
    if (!password) throw httpError(400, "Mật khẩu không được để trống!");

    const key = limiterKey(req, email);
    loginLimiter.check(key);

    const found = await prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, found ? found.passwordHash : DUMMY_HASH);

    if (!found || !ok) {
      loginLimiter.fail(key);
      throw httpError(401, "Email hoặc mật khẩu không đúng!");
    }

    loginLimiter.reset(key);
    const user = await prisma.user.findUnique({
      where: { id: found.id },
      select: publicUserSelect,
    });
    res.json({ token: signToken(user.id), user });
  })
);

// POST /api/auth/logout
// JWT không lưu trên máy chủ nên đăng xuất thật sự là việc xóa token ở trình duyệt.
// API này có để giao diện gọi cho đủ luồng và để sau này có thể thêm danh sách thu hồi token.
router.post("/logout", (req, res) => {
  res.json({ message: "Đã đăng xuất!" });
});

/* ------------------------------------------------------------------ */
/* Quên mật khẩu và đặt lại mật khẩu                                   */
/* ------------------------------------------------------------------ */

// POST /api/auth/forgot-password
// Luôn trả cùng một thông báo dù email có tồn tại hay không (không lộ email nào đã đăng ký).
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body?.email);

    const key = limiterKey(req, email);
    forgotLimiter.check(key);
    forgotLimiter.fail(key);

    const response = {
      message: "Nếu email đã đăng ký, liên kết đặt lại mật khẩu đã được tạo. Liên kết có hiệu lực trong 15 phút.",
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Token ngẫu nhiên gửi cho người dùng; database chỉ lưu bản băm SHA-256 của nó
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: sha256(token),
          resetTokenExpires: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
        },
      });

      const link = `${env.clientOrigin}/reset-password?token=${token}`;
      if (isDev) {
        // Môi trường dev chưa có dịch vụ gửi email: in ra console và trả về để thử nhanh
        console.log(`[Đặt lại mật khẩu] ${email}: ${link}`);
        response.devResetLink = link;
      }
      // Môi trường thật: gửi `link` qua email tại đây
    }

    res.json(response);
  })
);

// POST /api/auth/reset-password  { token, password }
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const token = asString(req.body?.token).trim();
    const password = cleanPassword(req.body?.password, "Mật khẩu mới");
    const invalid = httpError(400, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!");
    if (!token) throw invalid;

    const user = await prisma.user.findFirst({
      where: { resetTokenHash: sha256(token), resetTokenExpires: { gt: new Date() } },
    });
    if (!user) throw invalid;

    // Đổi mật khẩu và vô hiệu hóa token trong cùng một thao tác
    const passwordHash = await hashPassword(password);

    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        resetTokenHash: user.resetTokenHash,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpires: null,
      },
    });

    if (result.count !== 1) {
      throw invalid;
    }

    res.json({
      message: "Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.",
    });
  })
);

/* ------------------------------------------------------------------ */
/* Hồ sơ cá nhân (cần đăng nhập)                                      */
/* ------------------------------------------------------------------ */

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/me  { name }
router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const name = cleanName(req.body?.name);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: publicUserSelect,
    });
    res.json({ message: "Đã cập nhật hồ sơ!", user });
  })
);



// POST /api/auth/change-password  { currentPassword, newPassword }
router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = asString(req.body?.currentPassword);
    const newPassword = cleanPassword(req.body?.newPassword, "Mật khẩu mới");
    if (!currentPassword) throw httpError(400, "Hãy nhập mật khẩu hiện tại!");

    const key = `change|${req.user.id}`;
    loginLimiter.check(key);

    const full = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await bcrypt.compare(currentPassword, full.passwordHash))) {
      loginLimiter.fail(key);
      throw httpError(400, "Mật khẩu hiện tại không đúng!");
    }
    if (currentPassword === newPassword) {
      throw httpError(400, "Mật khẩu mới phải khác mật khẩu hiện tại!");
    }

    loginLimiter.reset(key);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    res.json({ message: "Đã đổi mật khẩu!" });
  })
);

/* ------------------------------------------------------------------ */
/* Ảnh đại diện: JPG / PNG / WebP, tối đa 2 MB                         */
/* ------------------------------------------------------------------ */

// Nhận file vào bộ nhớ để kiểm tra nội dung thật trước khi ghi ra đĩa
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
});

// Đọc "chữ ký" đầu file để biết đúng định dạng, không tin vào đuôi file hay Content-Type
function detectImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

function receiveAvatar(req, res, next) {
  upload.single("avatar")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(httpError(400, "Ảnh không được vượt quá 2 MB!"));
      }
      return next(httpError(400, "Tệp tải lên không hợp lệ!"));
    }
    next(err);
  });
}

// Xóa file avatar cũ, chỉ trong thư mục uploads và chỉ file do hệ thống tạo
async function removeAvatarFile(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatar-")) return;
  const file = path.join(env.uploadsDir, path.basename(avatarUrl));
  await fs.unlink(file).catch(() => {});
}

// POST /api/auth/avatar  (multipart/form-data, trường "avatar")
router.post(
  "/avatar",
  requireAuth,
  receiveAvatar,
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, "Hãy chọn một ảnh để tải lên!");

    const ext = detectImageType(req.file.buffer);
    if (!ext) throw httpError(400, "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP!");

    await fs.mkdir(env.uploadsDir, { recursive: true });
    const fileName = `avatar-${req.user.id}-${Date.now()}.${ext}`;
    await fs.writeFile(path.join(env.uploadsDir, fileName), req.file.buffer);

    const oldUrl = req.user.avatarUrl;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: `/uploads/${fileName}` },
      select: publicUserSelect,
    });
    await removeAvatarFile(oldUrl);

    res.json({ message: "Đã cập nhật ảnh đại diện!", user });
  })
);

// DELETE /api/auth/avatar  (quay về chữ cái đầu của tên)
router.delete(
  "/avatar",
  requireAuth,
  asyncHandler(async (req, res) => {
    const oldUrl = req.user.avatarUrl;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      select: publicUserSelect,
    });
    await removeAvatarFile(oldUrl);
    res.json({ message: "Đã xóa ảnh đại diện!", user });
  })
);

export default router;
