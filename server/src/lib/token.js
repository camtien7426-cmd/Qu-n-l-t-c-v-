import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Cố định thuật toán ký để token luôn là HS256 (không cho phép thuật toán khác khi kiểm tra)
const ALGORITHM = "HS256";

// Token chỉ chứa id người dùng; hạn dùng lấy từ JWT_EXPIRES_IN (mặc định 1 ngày)
export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwtExpiresIn,
  });
}

// Trả về payload nếu hợp lệ, ném lỗi nếu sai chữ ký hoặc hết hạn
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] });
}
