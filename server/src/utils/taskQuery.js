// Biến query string (?q=...) thành điều kiện `where` của Prisma.
// Sau này thêm lọc, sắp xếp, phân trang vào chính file này.
const MAX_SEARCH_LENGTH = 200; // bằng độ dài tối đa của title

export function buildTaskListQuery(query) {
  const where = {};

  // Tìm theo tiêu đề
  if (query.q !== undefined) {
    // query.q là mảng nếu URL có ?q=a&q=b, nên phải kiểm tra kiểu
    if (typeof query.q !== "string") {
      return { error: "Từ khóa tìm kiếm không hợp lệ!" };
    }
    const q = query.q.trim();
    if (q.length > MAX_SEARCH_LENGTH) {
      return { error: `Từ khóa tìm kiếm tối đa ${MAX_SEARCH_LENGTH} ký tự!` };
    }
    if (q) {
      // contains = LIKE '%q%'; insensitive = không phân biệt hoa/thường
      where.title = { contains: q, mode: "insensitive" };
    }
  }

  return { where };
}