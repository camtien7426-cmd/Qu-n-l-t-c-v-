import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { tempAuth } from "../middleware/tempAuth.js";
import { notifyTaskAssigned } from "../lib/notifications.js";

const router = Router();
// TODO: đổi `auth` thành requireAuth của Người 1 (gắn từng route để không chặn các API khác dưới /api)
const auth = tempAuth;

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const userSelect = { id: true, name: true, email: true, avatarUrl: true };
const taskInclude = {
  assignee: { select: userSelect },
  subtasks: { include: { assignee: { select: userSelect } }, orderBy: { createdAt: "asc" } },
};

// Thêm trường subtaskProgress = { done, total } vào công việc cha
function withProgress(task) {
  const subs = task.subtasks || [];
  return { ...task, subtaskProgress: { done: subs.filter((s) => s.status === "DONE").length, total: subs.length } };
}

function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Lấy vai trò của người dùng trong dự án (null nếu không phải thành viên)
// TODO: thay bằng requireProjectMember / requireLeader của Người 3 khi có
async function getRole(projectId, userId) {
  const m = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
  return m ? m.role : null;
}

async function loadTask(id) {
  if (!id) throw fail(404, "Không tìm thấy công việc.");
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) throw fail(404, "Không tìm thấy công việc.");
  return task;
}

// Kiểm tra và chuẩn hóa dữ liệu đầu vào. partial=true khi sửa (chỉ kiểm tra trường có gửi lên)
async function parseFields(body, projectId, partial) {
  const data = {};
  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (!title) throw fail(400, "Tiêu đề công việc không được để trống.");
    if (title.length > 200) throw fail(400, "Tiêu đề tối đa 200 ký tự.");
    data.title = title;
  }
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) throw fail(400, "Mức ưu tiên không hợp lệ.");
    data.priority = body.priority;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) throw fail(400, "Trạng thái không hợp lệ.");
    data.status = body.status;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === "") data.dueDate = null;
    else {
      const d = new Date(body.dueDate);
      if (isNaN(d)) throw fail(400, "Thời hạn không hợp lệ.");
      data.dueDate = d;
    }
  }
  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null || body.assigneeId === "") data.assigneeId = null;
    else {
      const aid = parseInt(body.assigneeId);
      if (!aid || (await getRole(projectId, aid)) === null) throw fail(400, "Người thực hiện phải là thành viên của dự án.");
      data.assigneeId = aid;
    }
  }
  return data;
}

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Danh sách công việc chính của dự án (kèm công việc con và tiến độ). Người 5 sẽ mở rộng tìm kiếm/lọc/phân trang.
router.get("/projects/:projectId/tasks", auth, wrap(async (req, res) => {
  const projectId = parseInt(req.params.projectId);
  if ((await getRole(projectId, req.user.id)) === null) throw fail(403, "Bạn không thuộc dự án này.");
  const tasks = await prisma.task.findMany({
    where: { projectId, parentId: null },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(tasks.map(withProgress));
}));

// Tạo công việc (chỉ LEADER)
router.post("/tasks", auth, wrap(async (req, res) => {
  const projectId = parseInt(req.body.projectId);
  if (!projectId) throw fail(400, "Thiếu projectId.");
  const role = await getRole(projectId, req.user.id);
  if (role === null) throw fail(403, "Bạn không thuộc dự án này.");
  if (role !== "LEADER") throw fail(403, "Chỉ trưởng nhóm mới được tạo công việc.");
  const data = await parseFields(req.body, projectId, false);
  const task = await prisma.task.create({ data: { ...data, projectId }, include: taskInclude });
  await notifyTaskAssigned(task, req.user.id);
  res.status(201).json(withProgress(task));
}));

// Xem chi tiết một công việc
router.get("/tasks/:id", auth, wrap(async (req, res) => {
  const task = await loadTask(parseInt(req.params.id));
  if ((await getRole(task.projectId, req.user.id)) === null) throw fail(403, "Bạn không thuộc dự án này.");
  res.json(withProgress(task));
}));

// Sửa công việc: LEADER sửa mọi trường; MEMBER chỉ đổi trạng thái việc được giao cho mình
router.patch("/tasks/:id", auth, wrap(async (req, res) => {
  const task = await loadTask(parseInt(req.params.id));
  const role = await getRole(task.projectId, req.user.id);
  if (role === null) throw fail(403, "Bạn không thuộc dự án này.");

  let data;
  if (role === "LEADER") {
    data = await parseFields(req.body, task.projectId, true);
  } else {
    const keys = Object.keys(req.body);
    if (keys.some((k) => k !== "status")) throw fail(403, "Thành viên chỉ được đổi trạng thái công việc.");
    if (task.assigneeId !== req.user.id) throw fail(403, "Bạn chỉ được đổi trạng thái việc được giao cho mình.");
    data = await parseFields(req.body, task.projectId, true);
  }

  const updated = await prisma.task.update({ where: { id: task.id }, data, include: taskInclude });
  if (data.assigneeId && data.assigneeId !== task.assigneeId) await notifyTaskAssigned(updated, req.user.id);
  res.json(withProgress(updated));
}));

// Xóa công việc (chỉ LEADER; công việc con và bình luận bị xóa theo nhờ onDelete: Cascade)
router.delete("/tasks/:id", auth, wrap(async (req, res) => {
  const task = await loadTask(parseInt(req.params.id));
  const role = await getRole(task.projectId, req.user.id);
  if (role === null) throw fail(403, "Bạn không thuộc dự án này.");
  if (role !== "LEADER") throw fail(403, "Chỉ trưởng nhóm mới được xóa công việc.");
  await prisma.task.delete({ where: { id: task.id } });
  res.json({ message: "Đã xóa công việc." });
}));

// Tạo công việc con (chỉ 1 cấp, chỉ LEADER)
router.post("/tasks/:id/subtasks", auth, wrap(async (req, res) => {
  const parent = await loadTask(parseInt(req.params.id));
  if (parent.parentId) throw fail(400, "Công việc con không thể có công việc con.");
  const role = await getRole(parent.projectId, req.user.id);
  if (role === null) throw fail(403, "Bạn không thuộc dự án này.");
  if (role !== "LEADER") throw fail(403, "Chỉ trưởng nhóm mới được tạo công việc con.");
  const data = await parseFields(req.body, parent.projectId, false);
  const sub = await prisma.task.create({
    data: { ...data, projectId: parent.projectId, parentId: parent.id },
    include: { assignee: { select: userSelect } },
  });
  await notifyTaskAssigned(sub, req.user.id);
  res.status(201).json(sub);
}));

// Trả lỗi đúng định dạng { error: "..." } của nhóm
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
});

export default router;
