import express from "express";
import { prisma } from "../lib/prisma.js";
import { requireProjectMember, requireLeader } from "../middleware/projectAuth.js";

const router = express.Router();

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

function parseDeadline(rawDeadline) {
  if (rawDeadline === undefined) return { value: undefined };
  if (rawDeadline === null || String(rawDeadline).trim() === "") {
    return { value: null };
  }
  const parsed = new Date(rawDeadline);
  if (Number.isNaN(parsed.getTime())) {
    return { error: "Thời hạn dự án không hợp lệ!" };
  }
  return { value: parsed };
}

// 1. Lấy danh sách dự án CHỈ CỦA NGƯỜI DÙNG HIỆN TẠI THAM GIA (Nhiệm vụ 2)
router.get("/", async (req, res, next) => {
  try {
    const userId = Number(req.user?.id ?? req.user?.userId ?? req.headers["x-user-id"]);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Vui lòng đăng nhập để xem danh sách dự án!" });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: { user: { select: safeUserSelect } },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = projects.map((p) => {
      const myMembership = p.members.find((m) => m.userId === userId);
      return {
        ...p,
        role: myMembership?.role || "MEMBER",
        memberCount: p._count.members,
        taskCount: p._count.tasks,
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// 2. Tạo dự án mới (Nhiệm vụ 1)
router.post("/", async (req, res, next) => {
  try {
    const { name, description, deadline, leaderId } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Tên dự án không được để trống!" });
    }

    const parsedDeadline = parseDeadline(deadline);
    if (parsedDeadline.error) {
      return res.status(400).json({ error: parsedDeadline.error });
    }

    const creatorId = Number(req.user?.id ?? req.user?.userId ?? leaderId);
    if (!Number.isInteger(creatorId) || creatorId <= 0) {
      return res.status(401).json({ error: "Vui lòng đăng nhập để tạo dự án!" });
    }

    const userExists = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!userExists) {
      return res.status(404).json({ error: "Không tìm thấy người dùng tạo dự án!" });
    }

    const project = await prisma.project.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        deadline: parsedDeadline.value ?? null,
        members: {
          create: {
            userId: creatorId,
            role: "LEADER",
          },
        },
      },
      include: {
        members: {
          include: { user: { select: safeUserSelect } },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    res.status(201).json({
      message: "Tạo dự án thành công!",
      project: {
        ...project,
        role: "LEADER",
        memberCount: project._count.members,
        taskCount: project._count.tasks,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 3. Sửa thông tin dự án - Chỉ LEADER (Nhiệm vụ 1)
router.put("/:id", requireProjectMember, requireLeader, async (req, res, next) => {
  try {
    const { name, description, deadline } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ error: "Tên dự án không được để trống!" });
      }
      data.name = String(name).trim();
    }

    if (description !== undefined) {
      data.description = description ? String(description).trim() : null;
    }

    if (deadline !== undefined) {
      const parsedDeadline = parseDeadline(deadline);
      if (parsedDeadline.error) {
        return res.status(400).json({ error: parsedDeadline.error });
      }
      data.deadline = parsedDeadline.value;
    }

    const project = await prisma.project.update({
      where: { id: req.project.id },
      data,
      include: {
        members: {
          include: { user: { select: safeUserSelect } },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    res.json({
      message: "Cập nhật dự án thành công!",
      project: {
        ...project,
        role: "LEADER",
        memberCount: project._count.members,
        taskCount: project._count.tasks,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 4. Xóa dự án - Chỉ LEADER (Nhiệm vụ 3)
router.delete("/:id", requireProjectMember, requireLeader, async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.project.id } });
    res.json({ message: "Đã xóa dự án!" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Không tìm thấy dự án!" });
    }
    next(error);
  }
});

export default router;