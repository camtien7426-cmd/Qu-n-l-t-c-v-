// Chỉ những trường được phép gửi về trình duyệt.
// KHÔNG BAO GIỜ thêm passwordHash, resetTokenHash, resetTokenExpires vào đây.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

// Dùng khi include thành viên / người được giao trong các API khác
export const memberUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};
