import express from 'express';
import { prisma } from '../lib/prisma.js';
import { memberUserSelect } from '../lib/user.js';

const router = express.Router();

// 2. API Lấy danh sách dự án kèm thành viên
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: { user: { select: memberUserSelect } },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. API Tạo dự án mới
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: req.user.id, // trưởng nhóm luôn là người đang đăng nhập
            role: 'LEADER',
          },
        },
      },
      include: {
        members: { include: { user: { select: memberUserSelect } } },
      },
    });
    res.json({ message: 'Tạo dự án thành công!', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. API Xóa dự án (xóa luôn thành viên, công việc, thông báo liên quan)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Đã xóa dự án!' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy dự án!' });
    res.status(500).json({ error: error.message });
  }
});

export default router;