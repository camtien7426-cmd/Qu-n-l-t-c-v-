import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import tasksRouter from './routes/tasks.js';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Công việc và công việc con (Người 4). Đặt trước các route cũ nên được ưu tiên.
app.use('/api', tasksRouter);

// Kiểm tra kết nối
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 1. API Đăng ký tài khoản
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại!' });
    }
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password,
      },
    });
    res.json({ message: 'Đăng ký thành công!', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. API Lấy danh sách dự án kèm thành viên
app.get('/api/projects', async (req, res) => {
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
app.post('/api/projects', async (req, res) => {
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

// 4. API Lấy danh sách công việc của dự án
app.get('/api/projects/:projectId/tasks', async (req, res) => {
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
app.post('/api/tasks', async (req, res) => {
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
const VALID_STATUS = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITY = ['LOW', 'MEDIUM', 'HIGH'];

app.patch('/api/tasks/:id', async (req, res) => {
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
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Đã xóa công việc!' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy công việc!' });
    res.status(500).json({ error: error.message });
  }
});

// 8. API Xóa dự án (xóa luôn thành viên, công việc, thông báo liên quan)
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Đã xóa dự án!' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy dự án!' });
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TaskFlow server đang chạy tại http://localhost:${PORT}`);
});