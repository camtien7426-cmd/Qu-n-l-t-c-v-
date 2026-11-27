import { prisma } from "../lib/prisma.js";

/**
 * Tự động tìm projectId từ request (hỗ trợ cả route dự án, công việc và bình luận).
 *
 * Thứ tự ưu tiên (quan trọng cho bảo mật): mã trên URL luôn thắng req.body.projectId.
 * Nếu body được ưu tiên, người dùng có thể gửi projectId của dự án mình để thao tác
 * trên công việc/bình luận của dự án khác.
 */
async function resolveProjectId(req) {
  // 1. Route có sẵn projectId trên URL (VD: /projects/:projectId/tasks, /projects/:id)
  if (req.params.projectId !== undefined) {
    return { projectId: Number(req.params.projectId) };
  }
  if (req.baseUrl?.endsWith("/projects") && req.params.id !== undefined) {
    return { projectId: Number(req.params.id) };
  }

  // 2. Route thao tác trên công việc (VD: /tasks/:id hoặc /tasks/:taskId/comments)
  const rawTaskId =
    req.params.taskId ?? (req.path?.startsWith("/tasks") ? req.params.id : undefined);
  if (rawTaskId !== undefined) {
    const taskId = Number(rawTaskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return { error: "Mã công việc không hợp lệ!", status: 400 };
    }
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) {
      return { error: "Không tìm thấy công việc!", status: 404 };
    }
    return { projectId: task.projectId };
  }

  // 3. Route thao tác trên bình luận (VD: /comments/:id)
  const rawCommentId =
    req.params.commentId ?? (req.path?.startsWith("/comments") ? req.params.id : undefined);
  if (rawCommentId !== undefined) {
    const commentId = Number(rawCommentId);
    if (!Number.isInteger(commentId) || commentId <= 0) {
      return { error: "Mã bình luận không hợp lệ!", status: 400 };
    }
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { task: { select: { projectId: true } } },
    });
    if (!comment) {
      return { error: "Không tìm thấy bình luận!", status: 404 };
    }
    return { projectId: comment.task.projectId };
  }

  // 4. Cuối cùng mới dùng body (chỉ khi URL không có mã nào, VD: POST /tasks để tạo mới)
  if (req.body?.projectId !== undefined) {
    return { projectId: Number(req.body.projectId) };
  }

  return { error: "Thiếu mã dự án!", status: 400 };
}

/**
 * Kiểm tra người dùng hiện tại có phải là thành viên dự án (LEADER hoặc MEMBER)
 * Dùng sau middleware xác thực đăng nhập (requireAuth)
 */
export async function requireProjectMember(req, res, next) {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Vui lòng đăng nhập để tiếp tục!" });
    }

    const resolved = await resolveProjectId(req);
    if (resolved.error) {
      return res.status(resolved.status).json({ error: resolved.error });
    }

    const { projectId } = resolved;
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ error: "Mã dự án không hợp lệ!" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy dự án!" });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Bạn không phải là thành viên của dự án này!" });
    }

    // Lưu sẵn để route phía sau dùng lại mà không cần truy vấn lại DB
    req.project = project;
    req.projectMember = membership;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Kiểm tra người dùng hiện tại có phải là Trưởng nhóm (LEADER) của dự án
 */
export async function requireLeader(req, res, next) {
  try {
    if (!req.projectMember) {
      return requireProjectMember(req, res, (err) => {
        // Lỗi hệ thống (VD: mất kết nối DB) phải chuyển tiếp, không được trả 403
        if (err) return next(err);
        if (req.projectMember?.role !== "LEADER") {
          return res
            .status(403)
            .json({ error: "Chỉ trưởng nhóm (LEADER) mới có quyền thực hiện thao tác này!" });
        }
        next();
      });
    }

    if (req.projectMember.role !== "LEADER") {
      return res
        .status(403)
        .json({ error: "Chỉ trưởng nhóm (LEADER) mới có quyền thực hiện thao tác này!" });
    }

    next();
  } catch (err) {
    next(err);
  }
}
