import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};

export const isDev = env.nodeEnv === "development";

if (!process.env.DATABASE_URL) {
  console.error("Thiếu DATABASE_URL. Hãy tạo file server/.env từ .env.example.");
  process.exit(1);
}
