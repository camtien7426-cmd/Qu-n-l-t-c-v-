import { PASSWORD_MAX, PASSWORD_MIN, AVATAR_MAX_BYTES, AVATAR_TYPES } from "../config/constants.js";

// Mỗi hàm trả về chuỗi lỗi, hoặc "" nếu hợp lệ.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateName(value) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2) return "Họ tên phải có ít nhất 2 ký tự";
  if (name.length > 100) return "Họ tên không được quá 100 ký tự";
  return "";
}

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return "Hãy nhập email";
  if (!EMAIL_REGEX.test(email)) return "Email chưa đúng định dạng (ví dụ: ten@gmail.com)";
  return "";
}

export function validatePassword(value, label = "Mật khẩu") {
  if (value.length < PASSWORD_MIN) return `${label} phải có ít nhất ${PASSWORD_MIN} ký tự`;
  if (new TextEncoder().encode(value).length > PASSWORD_MAX) return `${label} không được dài quá ${PASSWORD_MAX} ký tự`;
  return "";
}

export function validateConfirm(password, confirm) {
  if (!confirm) return "Hãy nhập lại mật khẩu";
  if (password !== confirm) return "Mật khẩu nhập lại chưa khớp";
  return "";
}

export function validateAvatarFile(file) {
  if (!AVATAR_TYPES.includes(file.type)) return "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP";
  if (file.size > AVATAR_MAX_BYTES) return "Ảnh không được vượt quá 2 MB";
  return "";
}

// Chấm độ mạnh của mật khẩu từ 0 đến 4 để hiển thị thanh gợi ý
export function passwordScore(value) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  else if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += value.length >= 8 ? 1 : 0;
  return Math.min(score, 4);
}
