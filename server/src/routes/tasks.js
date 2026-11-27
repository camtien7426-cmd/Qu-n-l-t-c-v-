import express from 'express';
import { prisma } from '../lib/prisma.js';
import { memberUserSelect } from '../lib/user.js';
import { requireProjectMember, requireLeader } from '../middleware/projectAuth.js';

const router = express.Router();

const VALID_STATUS = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITY = ['LOW', 'MEDIUM', 'HIGH'];

// 4. API Lấy danh sách công việc của dự án
router.get('/projects/:projectId/tasks', requireProjectMember, async (req, res, next) => {
  try {
    const projectId = req.project.id;
    const tasks = await prisma.task.findMany({
      where: { projectId, parentId: null },
      include: {
        subtasks: true,
        assignee: { select: memberUserSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// 5. API Tạo công việc mới

router.post('/tasks', requireLeader, async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        projectId: req.project.id,
      },
    });

    res.json({
      message: 'Thêm công việc thành công!',
      task,
    });
  } catch (error) {
    next(error);
  }
});

// 6. API Đổi trạng thái / sửa công việc
router.patch('/tasks/:id', requireProjectMember, async (req, res, next) => {
  try {
    const id = 	Number(req.params.id);

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Không tìm thấy công việc!',
      });

    }

    // Kiểm tra quyền của MEMBER
    if (req.projectMember.role === 'MEMBER') {
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({
          error: 'Bạn chỉ được cập nhật công việc được giao cho mình!',
        });
      }

      const fields = Object.keys(req.body);

      if (
        fields.length !== 1 ||
        fields[0] !== 'status'
      ) {
        return res.status(403).json({
          error: 'Thành viên chỉ được thay đổi trạng thái công việc!',
        });
      }
    }

    const { status, title, priority } = req.body;
    const data = {};
    if (status !== undefined) {
      if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ!' });
      data.status = status;
    }
    if (priority !== undefined) {
      if (!VALID_PRIORITY.includes(priority)) return res.status(400).json({ error: 'Mức ưu tiên không hợp lệ!' });
      data.priority = priority;
    }
    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ error: 'Tên công việc không được để trống!' });
      data.title = String(title).trim();
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data,
    });

    res.json({
      message: 'Cập nhật công việc thành công!',
      task: updatedTask,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Không tìm thấy công việc!',
      });
    }

    next(error);
  }
});


// 7. API Xóa công việc (xóa luôn công việc con và bình luận nhờ onDelete: Cascade)

router.delete('/tasks/:id', requireLeader, async (req, res, next) => {
  try {
    await prisma.task.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: 'Đã xóa công việc!' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Không tìm thấy công việc!',
      });
    }

    next(error);
  }
});


export default router;