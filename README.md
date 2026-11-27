# Xếp Việc

Ứng dụng quản lý công việc kiểu bảng Kanban, thiết kế đơn giản để người ở mọi lứa tuổi đều dùng được ngay. Chỉ gồm **một tệp HTML**, không cần cài đặt, không cần máy chủ.

## Tính năng

- Bảng ba cột: **Cần làm**, **Đang làm**, **Đã xong**
- Kéo thả thẻ việc giữa các cột
- Thêm, sửa, xóa công việc kèm ghi chú
- Ba mức độ quan trọng: Gấp, Vừa, Thong thả (hiển thị bằng màu viền thẻ)
- Đặt hạn hoàn thành, tự cảnh báo khi quá hạn hoặc đến hạn hôm nay
- Bấm vòng tròn trên thẻ để đánh dấu đã xong
- Thanh tiến độ tổng quan
- Tìm kiếm và lọc theo mức độ quan trọng
- Lời chào ngẫu nhiên, đổi theo tình hình công việc (có việc trễ hạn, đã xong hết, làm việc khuya…)
- Nền động dạng cực quang, tự đổi tông màu theo chế độ sáng/tối của thiết bị
- Tự lưu dữ liệu trên trình duyệt (`localStorage`), mở lại vẫn còn
- Tôn trọng cài đặt giảm chuyển động của hệ thống (`prefers-reduced-motion`)

## Công nghệ

- HTML, CSS, JavaScript thuần (không framework, không thư viện)
- Phông chữ [Lexend](https://fonts.google.com/specimen/Lexend) và [Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro) từ Google Fonts

## Chạy trên máy

Cách nhanh nhất: tải về và mở tệp `index.html` bằng trình duyệt.

Hoặc chạy bằng máy chủ cục bộ:

```bash
git clone https://github.com/<ten-ban>/xep-viec.git
cd xep-viec
python3 -m http.server 8000
```

Sau đó mở http://localhost:8000.


## Cấu trúc dự án

```
xep-viec/
├── index.html   # Toàn bộ giao diện, kiểu dáng và logic
├── README.md
└── LICENSE
```

## Tùy chỉnh

- **Màu sắc:** sửa các biến CSS ở đầu thẻ `<style>` (`--b1` đến `--b4` là bốn mảng màu nền, `--accent` là màu nút chính). Có hai bộ biến: sáng và tối.
- **Tên cột:** sửa mảng `COLS` trong phần `<script>`.
- **Lời chào:** sửa các mảng chuỗi trong biến `greet`.
- **Khóa lưu trữ:** dữ liệu nằm ở khóa `xepviec.tasks.v1` trong `localStorage`. Đổi tên khóa nếu bạn muốn bắt đầu với danh sách trống.


## Hướng phát triển

- [ ] Kéo thả bằng cảm ứng trên điện thoại
- [ ] Sao lưu và khôi phục dữ liệu bằng tệp
- [ ] Nhiều bảng dự án
- [ ] Nhãn màu tự đặt
- [ ] Đăng nhập và đồng bộ giữa các thiết bị

Markdown
---

## Hướng dẫn cài đặt & chạy dự án (TaskFlow)

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản `18.x` hoặc `20.x LTS` trở lên.
- **Database**: Đã cài đặt và khởi chạy dịch vụ **PostgreSQL** trên máy.

### 2. Cài đặt thư viện (Dependencies)
Mở 2 cửa sổ Terminal riêng biệt và cài đặt các gói thư viện cho cả Backend lẫn Frontend:

```bash
# Terminal 1 - Cài đặt cho Server
cd server
npm install

# Terminal 2 - Cài đặt cho Client
cd client
npm install
3. Cấu hình biến môi trường (.env)
Tạo một file mới tên là .env nằm bên trong thư mục server/ (server/.env).

    Dán nội dung sau vào file, thay mat_khau_cua_ban bằng mật khẩu tài khoản postgres trên máy bạn, và đổi JWT_SECRET thành một chuỗi bí mật riêng (có thể copy từ server/.env.example):

DATABASE_URL="postgresql://postgres:mat_khau_cua_ban@localhost:5432/taskflow?schema=public"
JWT_SECRET="doi-chuoi-bi-mat-nay-thanh-chuoi-ngau-nhien-dai"
JWT_EXPIRES_IN="1d"

4. Khởi tạo Database (Prisma)
Tại Terminal của thư mục server/, chạy lệnh sau để đồng bộ cấu trúc bảng vào PostgreSQL:

Bash
cd server
npx prisma migrate dev
npx prisma generate
(Nếu dự án có file dữ liệu mẫu, chạy thêm npx prisma db seed để tạo dữ liệu test).

5. Khởi chạy ứng dụng
Chạy song song cả 2 server trên 2 cửa sổ Terminal:

Khởi chạy Backend (Server):

Bash
cd server
npm run dev
Khởi chạy Frontend (Client):

Bash
cd client
npm run dev

## Quy ước chung của nhóm (TaskFlow)

6. Git
Không push thẳng vào `main`. Mỗi người làm trên nhánh `feature/<tên>-<tính-năng>` (ví dụ: `feature/thu-quan-ly-du-an`).
Muốn đưa code vào `main` thì mở **Pull Request** và cần ít nhất **1 người khác duyệt**.
Commit đặt tên theo kiểu `<loại>: <mô tả ngắn>` (`feat`, `fix`, `docs`, `refactor`, `chore`).
Không commit file `.env`, thư mục `node_modules` và `server/uploads`.

7. Cơ sở dữ liệu
Sửa schema bằng `npx prisma migrate dev --name <mô_tả_ngắn>` và commit luôn thư mục migration mới.
Không sửa hay xóa migration cũ. Mỗi người dùng database PostgreSQL riêng trên máy mình.

8. API và code
Dữ liệu trao đổi là JSON; gửi token bằng header `Authorization: Bearer <token>`.
Lỗi luôn trả dạng `{ "error": "thông báo tiếng Việt" }`; mã trạng thái `400`, `401`, `403`, `404`, `409` dùng đúng nghĩa.
Luôn kiểm tra dữ liệu và quyền ở backend; không bao giờ trả `passwordHash` về trình duyệt.
Tên biến, hàm, bảng, file dùng tiếng Anh; giao diện và thông báo lỗi dùng tiếng Việt.
Frontend gọi API qua module `api.js` chung, không viết cứng địa chỉ `http://localhost:5000` trong component.
Mỗi màn hình có đủ 3 trạng thái: **đang tải**, **lỗi**, **không có dữ liệu**. Xóa dữ liệu phải có hộp thoại xác nhận.

9. Điều kiện để mở Pull Request
Chạy được cả `client` và `server`, không có lỗi đỏ trong console.
Đã tự thử luồng chính và ít nhất một trường hợp lỗi (sai quyền, dữ liệu trống, chưa đăng nhập).
Nếu thêm hoặc đổi API thì cập nhật vào `docs/api.md`.