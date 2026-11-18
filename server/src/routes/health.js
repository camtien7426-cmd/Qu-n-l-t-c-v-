import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Kiểm tra server và kết nối PostgreSQL
router.get("/", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ server: "ok", database: "ok" });
  } catch (err) {
    err.status = 503;
    err.message = "Không kết nối được cơ sở dữ liệu.";
    next(err);
  }
});

export default router;
