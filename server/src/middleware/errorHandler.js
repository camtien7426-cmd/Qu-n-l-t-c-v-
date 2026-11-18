import { isDev } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({ message: "Không tìm thấy đường dẫn yêu cầu." });
}

// Không làm lộ thông tin kỹ thuật nhạy cảm ra ngoài (mục 3.3 của đặc tả)
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." : err.message,
    ...(isDev && { detail: err.message }),
  });
}
