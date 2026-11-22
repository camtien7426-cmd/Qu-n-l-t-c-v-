import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

const VALID_STATUS = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITY = ['LOW', 'MEDIUM', 'HIGH'];

// 4. API Lấy danh sách công việc của dự án
router.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const tasks = await prisma.task.findMany({
      where: { projectId, parentId: null },
      include: { subtasks: true, assignee: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. API Tạo công việc mới
router.post('/tasks', async (req, res) => {
  try {
    const { title, description, priority, projectId } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        projectId: parseInt(projectId),
      },
    });
    res.json({ message: 'Thêm công việc thành công!', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. API Đổi trạng thái / sửa công việc
router.patch('/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
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
    const task = await prisma.task.update({ where: { id }, data });
    res.json({ message: 'Cập nhật công việc thành công!', task });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy công việc!' });
    res.status(500).json({ error: error.message });
  }
});

// 7. API Xóa công việc (xóa luôn công việc con và bình luận nhờ onDelete: Cascade)
router.delete('/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Đã xóa công việc!' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy công việc!' });
    res.status(500).json({ error: error.message });
  }
});

export default router;