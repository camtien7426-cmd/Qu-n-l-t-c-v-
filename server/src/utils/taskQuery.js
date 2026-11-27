// Biến query string của GET /api/projects/:projectId/tasks thành các tham số Prisma.
//
// Hỗ trợ (đều tùy chọn):
//   Tìm kiếm : q
//   Lọc      : status, priority, assigneeId, due, dueFrom, dueTo
//   Sắp xếp  : sortBy, order
//   Phân trang: page, limit
//
// Thông tin phân trang nằm ở header phản hồi (xem setPaginationHeaders).

const MAX_SEARCH_LENGTH = 200; // bằng độ dài tối đa của title

const VALID_STATUS = ["TODO", "IN_PROGRESS", "DONE"];
const VALID_PRIORITY = ["LOW", "MEDIUM", "HIGH"];

const SORT_FIELDS = ["createdAt", "dueDate", "priority"];
const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_ORDER = "desc";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const DUE_PRESETS = ["overdue", "today", "next7days", "none"];

// Việt Nam UTC+7, không có giờ mùa hè
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Lấy giá trị chuỗi từ query; undefined nếu không có, null nếu sai kiểu (mảng/object). */
function readString(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  return value.trim();
}

/** Số nguyên dương từ chuỗi; null nếu không hợp lệ. */
function parsePositiveInt(raw) {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Đọc danh sách giá trị enum cách nhau dấu phẩy, VD "TODO,IN_PROGRESS". */
function parseEnumList(raw, validValues) {
  const items = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (items.length === 0 || items.some((v) => !validValues.includes(v))) return null;
  return items;
}

/**
 * Đọc ngày "YYYY-MM-DD" hoặc ISO 8601. Cùng cách hiểu với lúc lưu dueDate
 * (new Date("YYYY-MM-DD") = 00:00 UTC). Với dueTo dạng chỉ-ngày thì lấy hết ngày đó.
 */
function parseDate(raw, { endOfDay = false } = {}) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay && DATE_ONLY_RE.test(raw)) {
    return new Date(date.getTime() + DAY_MS - 1);
  }
  return date;
}

/** Mốc 00:00 hôm nay theo giờ Việt Nam, trả về dạng Date (UTC). */
function startOfTodayVN(now) {
  const vnNow = now.getTime() + VN_OFFSET_MS;
  return new Date(Math.floor(vnNow / DAY_MS) * DAY_MS - VN_OFFSET_MS);
}

/** Điều kiện thời hạn theo lựa chọn nhanh ?due=... */
function buildDuePreset(preset, now) {
  const todayStart = startOfTodayVN(now);
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);

  switch (preset) {
    case "overdue":
      // Quá hạn: đã qua hạn và chưa hoàn thành
      return { dueDate: { lt: now }, status: { not: "DONE" } };
    case "today":
      return { dueDate: { gte: todayStart, lt: tomorrowStart } };
    case "next7days":
      return { dueDate: { gte: now, lt: new Date(now.getTime() + 7 * DAY_MS) } };
    case "none":
      return { dueDate: null };
    default:
      return {};
  }
}

/**
 * @param {object} query  req.query
 * @returns {{ error: string }
 *   | { where, orderBy, skip, take, pagination: { page, limit } }}
 */
export function buildTaskListQuery(query) {
  const where = {};
  // Các điều kiện cùng nằm trên một trường (VD status) được gom lại để không ghi đè nhau
  const and = [];

  // ---------- Tìm theo tiêu đề ----------
  const q = readString(query.q);
  if (q === null) return { error: "Từ khóa tìm kiếm không hợp lệ!" };
  if (q !== undefined) {
    if (q.length > MAX_SEARCH_LENGTH) {
      return { error: `Từ khóa tìm kiếm tối đa ${MAX_SEARCH_LENGTH} ký tự!` };
    }
    if (q) {
      // contains = LIKE '%q%'; insensitive = không phân biệt hoa/thường
      where.title = { contains: q, mode: "insensitive" };
    }
  }

  // ---------- Lọc theo trạng thái ----------
  const status = readString(query.status);
  if (status === null) return { error: "Trạng thái lọc không hợp lệ!" };
  if (status) {
    const list = parseEnumList(status, VALID_STATUS);
    if (!list) return { error: "Trạng thái lọc không hợp lệ!" };
    and.push({ status: { in: list } });
  }

  // ---------- Lọc theo mức ưu tiên ----------
  const priority = readString(query.priority);
  if (priority === null) return { error: "Mức ưu tiên lọc không hợp lệ!" };
  if (priority) {
    const list = parseEnumList(priority, VALID_PRIORITY);
    if (!list) return { error: "Mức ưu tiên lọc không hợp lệ!" };
    and.push({ priority: { in: list } });
  }

  // ---------- Lọc theo người thực hiện ----------
  // assigneeId=<số> hoặc assigneeId=unassigned (chưa giao cho ai)
  const assigneeId = readString(query.assigneeId);
  if (assigneeId === null) return { error: "Người thực hiện lọc không hợp lệ!" };
  if (assigneeId) {
    if (assigneeId.toLowerCase() === "unassigned") {
      where.assigneeId = null;
    } else {
      const id = parsePositiveInt(assigneeId);
      if (id === null) return { error: "Người thực hiện lọc không hợp lệ!" };
      where.assigneeId = id;
    }
  }

  // ---------- Lọc theo thời hạn ----------
  const due = readString(query.due);
  if (due === null) return { error: "Bộ lọc thời hạn không hợp lệ!" };
  if (due) {
    const preset = due.toLowerCase();
    if (!DUE_PRESETS.includes(preset)) {
      return { error: "Bộ lọc thời hạn không hợp lệ!" };
    }
    and.push(buildDuePreset(preset, new Date()));
  }

  const dueFromRaw = readString(query.dueFrom);
  const dueToRaw = readString(query.dueTo);
  if (dueFromRaw === null || dueToRaw === null) {
    return { error: "Khoảng thời hạn không hợp lệ!" };
  }
  if (dueFromRaw || dueToRaw) {
    const range = {};
    if (dueFromRaw) {
      const from = parseDate(dueFromRaw);
      if (!from) return { error: "Ngày bắt đầu của khoảng thời hạn không hợp lệ!" };
      range.gte = from;
    }
    if (dueToRaw) {
      const to = parseDate(dueToRaw, { endOfDay: true });
      if (!to) return { error: "Ngày kết thúc của khoảng thời hạn không hợp lệ!" };
      range.lte = to;
    }
    if (range.gte && range.lte && range.gte > range.lte) {
      return { error: "Ngày bắt đầu phải trước ngày kết thúc!" };
    }
    and.push({ dueDate: range });
  }

  if (and.length > 0) where.AND = and;

  // ---------- Sắp xếp ----------
  const sortByRaw = readString(query.sortBy);
  const orderRaw = readString(query.order);
  if (sortByRaw === null || (sortByRaw && !SORT_FIELDS.includes(sortByRaw))) {
    return { error: "Trường sắp xếp không hợp lệ (createdAt, dueDate hoặc priority)!" };
  }
  if (orderRaw === null || (orderRaw && !["asc", "desc"].includes(orderRaw.toLowerCase()))) {
    return { error: "Thứ tự sắp xếp không hợp lệ (asc hoặc desc)!" };
  }
  const sortBy = sortByRaw || DEFAULT_SORT_BY;
  const order = orderRaw ? orderRaw.toLowerCase() : DEFAULT_ORDER;

  // Việc không có thời hạn luôn xếp cuối, bất kể asc hay desc.
  // priority là enum PostgreSQL nên sắp theo thứ tự khai báo: LOW < MEDIUM < HIGH.
  const primarySort =
    sortBy === "dueDate" ? { dueDate: { sort: order, nulls: "last" } } : { [sortBy]: order };
  // id làm khóa phụ để thứ tự ổn định, tránh trùng/mất thẻ khi chuyển trang
  const orderBy = [primarySort, { id: order }];

  // ---------- Phân trang ----------
  const pageRaw = readString(query.page);
  const limitRaw = readString(query.limit);
  if (pageRaw === null || limitRaw === null) {
    return { error: "Thông tin phân trang không hợp lệ!" };
  }

  let page = DEFAULT_PAGE;
  if (pageRaw) {
    page = parsePositiveInt(pageRaw);
    if (page === null) return { error: "Số trang phải là số nguyên dương!" };
  }

  let limit = DEFAULT_LIMIT;
  if (limitRaw) {
    limit = parsePositiveInt(limitRaw);
    if (limit === null) return { error: "Số công việc mỗi trang phải là số nguyên dương!" };
    if (limit > MAX_LIMIT) {
      return { error: `Số công việc mỗi trang tối đa ${MAX_LIMIT}!` };
    }
  }

  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) return { error: "Số trang quá lớn!" };

  return { where, orderBy, skip, take: limit, pagination: { page, limit } };
}

/**
 * Gắn thông tin phân trang vào header phản hồi (body vẫn là mảng Task).
 * Frontend đọc: X-Total-Count, X-Page, X-Limit, X-Total-Pages.
 */
export function setPaginationHeaders(res, { page, limit }, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.set({
    "X-Total-Count": String(total),
    "X-Page": String(page),
    "X-Limit": String(limit),
    "X-Total-Pages": String(totalPages),
  
    "Access-Control-Expose-Headers": "X-Total-Count, X-Page, X-Limit, X-Total-Pages",
  });
}