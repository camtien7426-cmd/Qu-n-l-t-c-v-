import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/requireAuth.js";

import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import commentRoutes from "./routes/comments.js";
import notificationRoutes from "./routes/notifications.js";
import statsRoutes from "./routes/stats.js";

const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use("/uploads", express.static(env.uploadsDir));

// Chặn người chưa đăng nhập ở một chỗ duy nhất cho mọi API cần bảo vệ (cả nhóm dùng chung).
// /api/health và /api/auth tự quản lý quyền truy cập của chúng nên không nằm trong danh sách này.
app.use(
  ["/api/projects", "/api/tasks", "/api/comments", "/api/notifications", "/api/stats"],
  requireAuth
);

// Gắn các route theo tính năng
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);

// Bắt lỗi sai đường dẫn API (404)
app.use((req, res) => {
  res.status(404).json({ error: "Không tìm thấy đường dẫn API!" });
});

// Middleware xử lý lỗi tập trung (khớp với next(err) trong health.js)
app.use((err, req, res, next) => {
  console.error(err);

  // Bắt lỗi gửi sai định dạng JSON từ express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Dữ liệu JSON gửi lên không hợp lệ!" });
  }

  const status = err.status || 500;
  const message =
    status === 500
      ? "Lỗi máy chủ nội bộ!"
      : err.message || "Yêu cầu không hợp lệ!";

  res.status(status).json({ error: message });
});

export default app;