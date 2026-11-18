# TaskFlow

Website quản lý công việc và dự án nhóm cho sinh viên.
Công nghệ: React + Vite + Tailwind CSS, Node.js + Express, PostgreSQL + Prisma.

## Cấu trúc

```
taskflow/
├── client/   # Frontend (React + Vite)
└── server/   # Backend (Express + Prisma)
```

## Chạy thử (bước 1)

Yêu cầu: Node.js >= 18.11 và PostgreSQL đã cài sẵn.

### 1. Tạo database

Dùng pgAdmin hoặc psql:

```sql
CREATE DATABASE taskflow;
```

### 2. Chạy backend

```bash
cd server
cp .env.example .env        # Windows: copy .env.example .env
# Mở .env, sửa DATABASE_URL (user, mật khẩu, tên database) cho đúng máy bạn
npm install
npx prisma migrate dev --name init
npm run dev
```

Kiểm tra: mở http://localhost:5000/api/health, kết quả đúng là
`{"server":"ok","database":"ok"}`.

### 3. Chạy frontend

Mở terminal thứ hai:

```bash
cd client
npm install
npm run dev
```

Mở http://localhost:5173, sẽ thấy "TaskFlow" và dòng
"Kết nối backend và cơ sở dữ liệu: thành công".

### Xem dữ liệu trong database (tùy chọn)

```bash
cd server
npm run prisma:studio
```
