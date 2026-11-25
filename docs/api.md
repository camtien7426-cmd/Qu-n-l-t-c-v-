# Đặc tả định dạng JSON API - TaskFlow

## 1. Quy ước chung
- Base URL:** `http://localhost:5000/api`
- Xác thực (Authentication):** Các API yêu cầu đăng nhập gửi kèm header:
  ```http
  Authorization: Bearer <token>
  ```
- Định dạng thời gian: Chuẩn ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`), ví dụ `"2026-11-25T17:00:00.000Z"`.
- Định dạng phản hồi lỗi chung:
  Mọi lỗi từ API đều trả về HTTP status code tương ứng kèm JSON duy nhất trường `error` bằng tiếng Việt:
  ```json
  {
    "error": "Thông báo lỗi bằng tiếng Việt"
  }
  ```
  | Mã HTTP | Ý nghĩa | Ví dụ thông báo |
  |---|---|---|
  | `400` | Dữ liệu đầu vào không hợp lệ / thiếu trường | `{"error": "Tên dự án không được để trống!"}` |
  | `401` | Chưa đăng nhập hoặc token hết hạn | `{"error": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!"}` |
  | `403` | Không đủ quyền (ví dụ MEMBER thực hiện lệnh của LEADER) | `{"error": "Chỉ trưởng nhóm (LEADER) mới có quyền thực hiện thao tác này!"}` |
  | `404` | Không tìm thấy tài nguyên hoặc sai đường dẫn | `{"error": "Không tìm thấy dự án!"}` |
  | `409` | Xung đột dữ liệu (trùng email, đã là thành viên...) | `{"error": "Người dùng này đã là thành viên của dự án!"}` |
  | `500` | Lỗi xử lý phía máy chủ | `{"error": "Lỗi hệ thống, vui lòng thử lại sau!"}` |

---

## 2. Người dùng (`User`)
Lưu ý: Không bao giờ trả về các trường `passwordHash`, `resetTokenHash`, `resetTokenExpires`.*

### Đối tượng User cơ bản
```json
{
  "id": 1,
  "name": "Nguyễn Thị Anh Thư",
  "email": "anhthu@example.com",
  "avatarUrl": "/uploads/avatar-1.png",
  "createdAt": "2026-11-22T15:00:00.000Z",
  "updatedAt": "2026-11-22T15:00:00.000Z"
}
```

### Phản hồi khi đăng nhập / đăng ký thành công (`POST /api/auth/login`, `POST /api/auth/register`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Nguyễn Thị Anh Thư",
    "email": "anhthu@example.com",
    "avatarUrl": null,
    "createdAt": "2026-11-22T15:00:00.000Z",
    "updatedAt": "2026-11-22T15:00:00.000Z"
  }
}
```

---

## 2b. Xác thực và hồ sơ (`/api/auth`)
Mật khẩu được băm bằng `bcryptjs` (cost 10). Token JWT sống 1 ngày (`JWT_EXPIRES_IN`), trình duyệt lưu ở `localStorage` và gửi qua header `Authorization: Bearer <token>`.

| Phương thức | Đường dẫn | Cần đăng nhập | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | Không | Đăng ký, trả `201` kèm `{ token, user }` |
| POST | `/api/auth/login` | Không | Đăng nhập, trả `{ token, user }` |
| POST | `/api/auth/logout` | Không | Trả `{ "message": "Đã đăng xuất!" }`; trình duyệt tự xóa token |
| GET | `/api/auth/me` | Có | Trả `{ user }` của người đang đăng nhập |
| PATCH | `/api/auth/me` | Có | Sửa họ tên, gửi `{ "name": "..." }`, trả `{ message, user }` |
| POST | `/api/auth/change-password` | Có | Đổi mật khẩu, gửi `{ currentPassword, newPassword }` |
| POST | `/api/auth/avatar` | Có | Tải ảnh đại diện (`multipart/form-data`, trường `avatar`) |
| DELETE | `/api/auth/avatar` | Có | Xóa ảnh đại diện, trả `{ message, user }` |
| POST | `/api/auth/forgot-password` | Không | Tạo liên kết đặt lại mật khẩu, gửi `{ "email": "..." }` |
| POST | `/api/auth/reset-password` | Không | Đặt mật khẩu mới, gửi `{ "token": "...", "password": "..." }` |

Dữ liệu đăng ký / đăng nhập:

```json
{ "name": "Nguyễn Thị Cẩm Tiên", "email": "tien@example.com", "password": "matkhau123" }
```

- `name`: 2 đến 100 ký tự. `email`: đúng định dạng, không phân biệt hoa thường. `password`: 6 đến 72 ký tự.
- Đăng nhập sai email hoặc mật khẩu đều trả cùng một thông báo `401`; sai quá 10 lần trong 15 phút trả `429`.

**Ảnh đại diện:** chỉ nhận JPG, PNG, WebP (kiểm tra nội dung thật của file), tối đa 2 MB. File lưu ở `server/uploads`, `avatarUrl` có dạng `/uploads/avatar-<userId>-<thời gian>.png`. Tải ảnh mới thì ảnh cũ bị xóa. Chưa có ảnh (`avatarUrl = null`) thì giao diện hiện chữ cái đầu của tên.

**Đặt lại mật khẩu:**
- `forgot-password` luôn trả cùng một thông báo dù email có tồn tại hay không.
- Token ngẫu nhiên 32 byte, database chỉ lưu bản băm SHA-256 (`resetTokenHash`), hạn 15 phút (`resetTokenExpires`), dùng một lần.
- Ở môi trường dev (`NODE_ENV=development`) liên kết được in ra console của server và trả thêm trường `devResetLink`:

```json
{
  "message": "Nếu email đã đăng ký, liên kết đặt lại mật khẩu đã được tạo. Liên kết có hiệu lực trong 15 phút.",
  "devResetLink": "http://localhost:5173/reset-password?token=..."
}
```

- Lỗi: `400` dữ liệu sai hoặc token hết hạn / đã dùng, `401` sai thông tin đăng nhập hoặc chưa đăng nhập, `409` email đã đăng ký, `429` thử quá nhiều lần.

**Bảo vệ API:** middleware `requireAuth` chặn mọi đường dẫn `/api/projects`, `/api/tasks`, `/api/comments`, `/api/notifications`, `/api/stats`. Chưa gửi token trả `401`; token sai hoặc hết hạn trả `401` kèm `"Phiên đăng nhập không hợp lệ hoặc đã hết hạn!"`. Sau middleware, `req.user` chứa `{ id, name, email, avatarUrl, createdAt, updatedAt }`.

---

## 3. Dự án (`Project` & `ProjectMember`)
Giá trị `role` trong dự án: `"LEADER"` | `"MEMBER"` (mỗi dự án chỉ có 1 `LEADER`).*

### Danh sách dự án (`GET /api/projects`)
```json
[
  {
    "id": 1,
    "name": "Ứng dụng quản lý tác vụ TaskFlow",
    "description": "Đồ án môn Công nghệ phần mềm",
    "deadline": "2026-12-15T23:59:59.000Z",
    "role": "LEADER",
    "memberCount": 4,
    "taskCount": 12,
    "createdAt": "2026-11-22T15:10:00.000Z",
    "updatedAt": "2026-11-22T15:10:00.000Z"
  }
]
```

### Chi tiết dự án & danh sách thành viên (`GET /api/projects/:id`)
```json
{
  "id": 1,
  "name": "Ứng dụng quản lý tác vụ TaskFlow",
  "description": "Đồ án môn Công nghệ phần mềm",
  "deadline": "2026-12-15T23:59:59.000Z",
  "createdAt": "2026-11-22T15:10:00.000Z",
  "updatedAt": "2026-11-22T15:10:00.000Z",
  "members": [
    {
      "projectId": 1,
      "userId": 1,
      "role": "LEADER",
      "joinedAt": "2026-11-22T15:10:00.000Z",
      "user": {
        "id": 1,
        "name": "Nguyễn Thị Anh Thư",
        "email": "anhthu@example.com",
        "avatarUrl": null
      }
    },
    {
      "projectId": 1,
      "userId": 2,
      "role": "MEMBER",
      "joinedAt": "2026-11-22T15:20:00.000Z",
      "user": {
        "id": 2,
        "name": "Trần Văn B",
        "email": "vanb@example.com",
        "avatarUrl": null
      }
    }
  ]
}
```

---

## 4. Công việc (`Task`)
- Trạng thái (`status`): `"TODO"` | `"IN_PROGRESS"` | `"DONE"`
- Độ ưu tiên (`priority`): `"LOW"` | `"MEDIUM"` | `"HIGH"`
- Phân cấp (`parentId`): `null` là công việc chính; khác `null` là công việc con (tối đa 1 cấp).

### Đối tượng Task (kèm người được giao & công việc con)
```json
{
  "id": 10,
  "title": "Xây dựng API quản lý dự án",
  "description": "Hoàn thiện CRUD dự án và phân quyền LEADER/MEMBER",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2026-11-28T17:00:00.000Z",
  "projectId": 1,
  "assigneeId": 1,
  "parentId": null,
  "createdAt": "2026-11-22T16:00:00.000Z",
  "updatedAt": "2026-11-22T16:05:00.000Z",
  "assignee": {
    "id": 1,
    "name": "Nguyễn Thị Anh Thư",
    "email": "anhthu@example.com",
    "avatarUrl": null
  },
  "subtasks": [
    {
      "id": 11,
      "title": "Viết API thêm thành viên vào dự án",
      "description": null,
      "status": "TODO",
      "priority": "MEDIUM",
      "dueDate": "2026-11-26T17:00:00.000Z",
      "projectId": 1,
      "assigneeId": 2,
      "parentId": 10,
      "createdAt": "2026-11-22T16:10:00.000Z",
      "updatedAt": "2026-11-22T16:10:00.000Z",
      "assignee": { "id": 2, "name": "Trần Văn B", "email": "vanb@example.com", "avatarUrl": null }
    }
  ],
"subtaskProgress": { "done": 0, "total": 1 }
}


```
### Danh sách API công việc

Tạm thời gửi header `X-User-Id: <id>` thay cho `Authorization` cho đến khi có đăng nhập thật.

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/projects/:projectId/tasks` | Thành viên dự án | Danh sách công việc chính (kèm `subtasks`, `subtaskProgress`), mới nhất trước |
| POST | `/api/tasks` | `LEADER` | Tạo công việc, trả `201` kèm Task |
| GET | `/api/tasks/:id` | Thành viên dự án | Chi tiết một công việc |
| PATCH | `/api/tasks/:id` | `LEADER`: mọi trường; `MEMBER`: chỉ `status` của việc được giao cho mình | Sửa công việc, trả Task |
| DELETE | `/api/tasks/:id` | `LEADER` | Xóa kèm công việc con và bình luận, trả `{ "message": "Đã xóa công việc." }` |
| POST | `/api/tasks/:id/subtasks` | `LEADER` | Tạo công việc con (chỉ 1 cấp), trả `201` kèm Task con (không có `subtasks`) |

Dữ liệu gửi lên khi tạo hoặc sửa (khi sửa chỉ cần gửi trường muốn đổi):

```json
{
  "projectId": 1,
  "title": "Thiết kế trang đăng nhập",
  "description": null,
  "assigneeId": 2,
  "dueDate": "2026-11-28",
  "priority": "HIGH",
  "status": "TODO"
}
```

- `title`: bắt buộc khi tạo, tối đa 200 ký tự.
- `assigneeId`: phải là thành viên của dự án, hoặc `null` nếu chưa giao.
- `dueDate`: `"YYYY-MM-DD"` hoặc ISO 8601, `null` nếu không đặt.
- Công việc cha có thêm `"subtaskProgress": { "done": 1, "total": 3 }`; mỗi công việc con trong `subtasks` có thêm `assignee`.
- Lỗi: `400` dữ liệu sai, `401` chưa đăng nhập, `403` không đủ quyền, `404` không tìm thấy.

---

## 5. Thông báo (`Notification`)
- Loại thông báo (`type`):`"TASK_ASSIGNED"` | `"NEW_COMMENT"` | `"DUE_SOON"` | `"OVERDUE"`

### Danh sách thông báo của người dùng (`GET /api/notifications`)
```json
[
  {
    "id": 5,
    "type": "TASK_ASSIGNED",
    "message": "Bạn đã được giao công việc \"Xây dựng API quản lý dự án\"",
    "isRead": false,
    "userId": 1,
    "projectId": 1,
    "taskId": 10,
    "createdAt": "2026-11-22T16:00:00.000Z"
  },
  {
    "id": 6,
    "type": "DUE_SOON",
    "message": "Công việc \"Viết API thêm thành viên\" sắp đến hạn trong 48 giờ",
    "isRead": true,
    "userId": 1,
    "projectId": 1,
    "taskId": 11,
    "createdAt": "2026-11-24T17:00:00.000Z"
  }
]
```