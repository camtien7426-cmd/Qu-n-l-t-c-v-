import express from "express";
import { prisma } from "../lib/prisma.js";
import { requireProjectMember, requireLeader } from "../middleware/projectAuth.js";

const router = express.Router();

// Chỉ trả về các trường an toàn của User, không lộ passwordHash hay token đặt lại mật khẩu
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

// Kiểm tra và chuẩn hóa trường thời hạn (deadline)
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

// 1. Lấy danh sách dự án CHỈ CỦA NGƯỜI DÙNG HIỆN TẠI THAM GIA
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
          orderBy: { joinedAt: "asc" },
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

// 2. Lấy chi tiết một dự án & danh sách thành viên (Chỉ thành viên dự án mới được xem)
router.get("/:id", requireProjectMember, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.project.id },
      include: {
        members: {
          include: { user: { select: safeUserSelect } },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy dự án!" });
    }

    res.json({
      ...project,
      role: req.projectMember.role,
      memberCount: project._count.members,
      taskCount: project._count.tasks,
    });
  } catch (error) {
    next(error);
  }
});

// 3. Tạo dự án mới (Người tạo tự động trở thành LEADER)
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

    const creatorId = Number(
      req.user?.id ?? req.user?.userId ?? req.headers["x-user-id"] ?? leaderId
    );
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

// 4. Cập nhật thông tin dự án (Chỉ LEADER)
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

// 5. Xóa dự án (Chỉ LEADER)
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

// 6. Thêm thành viên vào dự án theo email (Chỉ LEADER)
router.post("/:id/members", requireProjectMember, requireLeader, async (req, res, next) => {
  try {
    const rawEmail = req.body?.email;
    const normalizedEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email thành viên không được để trống!" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: safeUserSelect,
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng với email này!" });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: req.project.id,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({ error: "Người dùng này đã là thành viên của dự án!" });
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: req.project.id,
        userId: targetUser.id,
        role: "MEMBER",
      },
      include: {
        user: { select: safeUserSelect },
      },
    });

    res.status(201).json({
      message: "Thêm thành viên thành công!",
      member: newMember,
    });
  } catch (error) {
    next(error);
  }
});

// 7. Xóa thành viên khỏi dự án (Chỉ LEADER, không được xóa chính LEADER)
router.delete(
  "/:id/members/:userId",
  requireProjectMember,
  requireLeader,
  async (req, res, next) => {
    try {
      const targetUserId = Number(req.params.userId);
      if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
        return res.status(400).json({ error: "ID thành viên không hợp lệ!" });
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: req.project.id,
            userId: targetUserId,
          },
        },
      });

      if (!membership) {
        return res.status(404).json({ error: "Thành viên không thuộc dự án này!" });
      }

      if (membership.role === "LEADER") {
        return res.status(400).json({ error: "Không thể xóa trưởng nhóm khỏi dự án!" });
      }

      await prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: req.project.id,
            userId: targetUserId,
          },
        },
      });

      res.json({ message: "Đã loại thành viên khỏi dự án!" });
    } catch (error) {
      next(error);
    }
  }
);

// 8. Chuyển quyền trưởng nhóm cho thành viên khác (Chỉ LEADER)
router.patch(
  "/:id/transfer-leader",
  requireProjectMember,
  requireLeader,
  async (req, res, next) => {
    try {
      const newLeaderId = Number(req.body?.newLeaderId);
      if (!Number.isInteger(newLeaderId) || newLeaderId <= 0) {
        return res.status(400).json({ error: "Vui lòng chọn thành viên nhận quyền hợp lệ!" });
      }

      if (newLeaderId === req.projectMember.userId) {
        return res.status(400).json({ error: "Bạn đã là trưởng nhóm của dự án này!" });
      }

      const targetMembership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: req.project.id,
            userId: newLeaderId,
          },
        },
        include: {
          user: { select: safeUserSelect },
        },
      });

      if (!targetMembership) {
        return res
          .status(404)
          .json({ error: "Người được chuyển quyền phải là thành viên của dự án!" });
      }

      // Dùng transaction để đảm bảo dự án luôn có đúng 1 LEADER
      await prisma.$transaction([
        prisma.projectMember.update({
          where: {
            projectId_userId: {
              projectId: req.project.id,
              userId: req.projectMember.userId,
            },
          },
          data: { role: "MEMBER" },
        }),
        prisma.projectMember.update({
          where: {
            projectId_userId: {
              projectId: req.project.id,
              userId: newLeaderId,
            },
          },
          data: { role: "LEADER" },
        }),
      ]);

      res.json({
        message: `Đã chuyển quyền trưởng nhóm cho ${targetMembership.user.name}!`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 9. Tự rời khỏi dự án (LEADER không thể rời nếu chưa chuyển quyền)
router.delete("/:id/leave", requireProjectMember, async (req, res, next) => {
  try {
    if (req.projectMember.role === "LEADER") {
      return res.status(400).json({
        error: "Trưởng nhóm không thể rời dự án khi chưa chuyển quyền cho thành viên khác!",
      });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: req.project.id,
          userId: req.projectMember.userId,
        },
      },
    });

    res.json({ message: "Bạn đã rời khỏi dự án!" });
  } catch (error) {
    next(error);
  }
});

export default router;