import express from "express";
import { prisma } from "../lib/prisma.js";
import { requireUserId } from "../lib/currentUser.js";
import { requireProjectMember, requireLeader } from "../middleware/projectAuth.js";

const router = express.Router();

const HOURS_48 = 48 * 60 * 60 * 1000;

// Quy ước thống kê: chỉ tính công việc chính (parentId = null), KHÔNG tính công việc con.
// "Quá hạn" = có hạn đã qua và chưa hoàn thành.
const MAIN_TASKS = { parentId: null };

function overdueWhere(now) {
  return { ...MAIN_TASKS, status: { not: "DONE" }, dueDate: { lt: now } };
}

function percent(done, total) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Đếm theo trạng thái cho một điều kiện lọc bất kỳ
async function countByStatus(where, now) {
  const [grouped, overdue] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], where: { ...MAIN_TASKS, ...where }, _count: { _all: true } }),
    prisma.task.count({ where: { ...overdueWhere(now), ...where } }),
  ]);
  const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const row of grouped) byStatus[row.status] = row._count._all;
  const total = byStatus.TODO + byStatus.IN_PROGRESS + byStatus.DONE;
  return { total, byStatus, overdue, completionPercent: percent(byStatus.DONE, total) };
}

// ---------------------------------------------------------------------------
// Bảng điều khiển (trang chủ sau khi đăng nhập)
// ---------------------------------------------------------------------------

// GET /api/stats/dashboard — tổng số việc, đang làm, hoàn thành, quá hạn (trong các dự án của tôi)
router.get("/dashboard", requireUserId, async (req, res, next) => {
  try {
    const where = { project: { members: { some: { userId: req.currentUserId } } } };
    const { total, byStatus, overdue } = await countByStatus(where, new Date());
    res.json({
      total,
      todo: byStatus.TODO,
      inProgress: byStatus.IN_PROGRESS,
      done: byStatus.DONE,
      overdue,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/recent-projects — 5 dự án gần đây (mới cập nhật) kèm tiến độ
router.get("/recent-projects", requireUserId, async (req, res, next) => {
  try {
    const now = new Date();
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: req.currentUserId } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { members: { where: { userId: req.currentUserId }, select: { role: true } } },
    });

    const result = await Promise.all(
      projects.map(async (p) => {
        const stats = await countByStatus({ projectId: p.id }, now);
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          deadline: p.deadline,
          updatedAt: p.updatedAt,
          role: p.members[0]?.role ?? "MEMBER",
          taskCount: stats.total,
          doneCount: stats.byStatus.DONE,
          overdueCount: stats.overdue,
          completionPercent: stats.completionPercent,
        };
      })
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/upcoming-tasks — việc chưa xong có hạn trong 48 giờ tới
router.get("/upcoming-tasks", requireUserId, async (req, res, next) => {
  try {
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        ...MAIN_TASKS,
        status: { not: "DONE" },
        dueDate: { gte: now, lte: new Date(now.getTime() + HOURS_48) },
        project: { members: { some: { userId: req.currentUserId } } },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Thống kê theo dự án
// ---------------------------------------------------------------------------

// GET /api/stats/projects/:projectId — biểu đồ tròn theo trạng thái, tỷ lệ hoàn thành, số việc quá hạn
router.get("/projects/:projectId", requireUserId, requireProjectMember, async (req, res, next) => {
  try {
    const stats = await countByStatus({ projectId: req.project.id }, new Date());
    res.json({
      project: { id: req.project.id, name: req.project.name, deadline: req.project.deadline },
      myRole: req.projectMember.role,
      total: stats.total,
      byStatus: stats.byStatus,
      completionPercent: stats.completionPercent,
      overdue: stats.overdue,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/projects/:projectId/members — tiến độ từng thành viên (CHỈ trưởng nhóm xem)
router.get("/projects/:projectId/members", requireUserId, requireLeader, async (req, res, next) => {
  try {
    const now = new Date();
    const projectId = req.project.id;

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    const result = await Promise.all(
      members.map(async (m) => {
        // Chỉ tính công việc chính được giao cho thành viên, không tính công việc con
        const stats = await countByStatus({ projectId, assigneeId: m.userId }, now);
        return {
          user: m.user,
          role: m.role,
          total: stats.total,
          todo: stats.byStatus.TODO,
          inProgress: stats.byStatus.IN_PROGRESS,
          done: stats.byStatus.DONE,
          overdue: stats.overdue,
          completionPercent: stats.completionPercent,
        };
      })
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
