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

