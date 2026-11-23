import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// 2. API Lấy danh sách dự án kèm thành viên
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: { user: true },
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
    const { name, description, leaderId } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: parseInt(leaderId),
            role: 'LEADER',
          },
        },
      },
      include: {
        members: { include: { user: true } },
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