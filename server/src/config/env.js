import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  // Thư mục lưu ảnh đại diện: server/uploads (không phụ thuộc nơi chạy lệnh)
  uploadsDir: path.resolve(__dirname, "../../uploads"),
};

export const isDev = env.nodeEnv === "development";

if (!process.env.DATABASE_URL) {
  console.error("Thiếu DATABASE_URL. Hãy tạo file server/.env từ .env.example.");
  process.exit(1);
}

if (!env.jwtSecret) {
  console.error("Thiếu JWT_SECRET. Hãy thêm JWT_SECRET vào server/.env (xem .env.example).");
  process.exit(1);
}

// Chuỗi mẫu trong .env.example ai cũng đọc được trên GitHub nên không được dùng thật
const SAMPLE_JWT_SECRET = "doi-chuoi-bi-mat-nay";
if (env.jwtSecret === SAMPLE_JWT_SECRET) {
  if (!isDev) {
    console.error("JWT_SECRET đang là giá trị mẫu. Hãy đặt một chuỗi ngẫu nhiên riêng.");
    process.exit(1);
  }
  console.warn("[Cảnh báo] JWT_SECRET đang là giá trị mẫu. Hãy đổi sang chuỗi riêng trong server/.env.");
}
if (!isDev && env.jwtSecret.length < 32) {
  console.error("JWT_SECRET quá ngắn. Hãy dùng chuỗi ngẫu nhiên từ 32 ký tự trở lên.");
  process.exit(1);
}
