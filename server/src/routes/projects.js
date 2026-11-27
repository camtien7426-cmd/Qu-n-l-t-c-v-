import express from 'express';
import { prisma } from '../lib/prisma.js';
import { memberUserSelect } from '../lib/user.js';
import { requireLeader } from '../middleware/projectAuth.js';

const router = express.Router();

// 2. API Lấy danh sách dự án kèm thành viên
router.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
          },
        },
      },
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
    next(error);
  }
});

// 3. API Tạo dự án mới
router.post('/', async (req, res, next) => {
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
    next(error);
  }
});

// 8. API Xóa dự án (xóa luôn thành viên, công việc, thông báo liên quan)

router.delete('/:id', requireLeader, async (req, res, next) => {
  try {
    await prisma.project.delete({
      where: { id: req.project.id },
    });

    res.json({ message: 'Đã xóa dự án!' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Không tìm thấy dự án!',
      });
    }

    next(error);
  }
});


export default router;