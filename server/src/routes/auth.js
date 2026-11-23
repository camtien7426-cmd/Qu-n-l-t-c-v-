import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// 1. API Đăng ký tài khoản
router.post('/register', async (req, res) => {
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

export default router;