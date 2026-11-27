# Đặc tả định dạng JSON API - TaskFlow

## 1. Quy ước chung
> **Trạng thái triển khai:** Tài liệu bao gồm cả API đã triển khai và đặc tả API dự kiến của nhóm. Các chức năng quản lý dự án nâng cao, giao việc, thời hạn công việc, công việc con, bình luận và thông báo cần tiếp tục hoàn thiện theo phân công. API tạo dự án và tạo công việc hiện trả HTTP 200; mã HTTP 201 là đặc tả mục tiêu.
- **Base URL:** `http://localhost:5000/api`
- **Xác thực (Authentication):** Các API yêu cầu đăng nhập gửi kèm header:
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
*Lưu ý: Không bao giờ trả về các trường `passwordHash`, `resetTokenHash`, `resetTokenExpires`.*

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
*Giá trị `role` trong dự án: `"LEADER"` | `"MEMBER"` (mỗi dự án chỉ có 1 `LEADER`).*

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

### Tạo dự án mới (`POST /api/projects`)
- Quyền hạn: Yêu cầu đăng nhập (`requireAuth`). Người tạo tự động trở thành `LEADER` của dự án.
- Request Body:
  ```json
  {
    "name": "Ứng dụng quản lý tác vụ TaskFlow",
    "description": "Đồ án môn Công nghệ phần mềm",
    "deadline": "2026-12-15T23:59:59.000Z"
  }
  ```
  *(Trường `description` và `deadline` có thể bỏ trống hoặc truyền `null`).*
- Response thành công (`201 Created`):
  ```json
  {
    "message": "Tạo dự án thành công!",
    "project": {
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
        }
      ],
      "_count": {
        "tasks": 0
      }
    }
  }
  ```

### Cập nhật thông tin dự án (`PUT /api/projects/:id`)
- Quyền hạn: Yêu cầu đăng nhập (`requireAuth`), là thành viên dự án (`requireProjectMember`) và phải là Trưởng nhóm (`requireLeader`).
- Request Body (truyền các trường cần sửa; truyền `deadline: null` nếu muốn xóa thời hạn):
  ```json
  {
    "name": "Tên dự án đã cập nhật",
    "description": "Mô tả mới",
    "deadline": "2026-12-20T23:59:59.000Z"
  }
  ```
- Response thành công (`200 OK`):
  ```json
  {
    "message": "Cập nhật dự án thành công!",
    "project": {
      "id": 1,
      "name": "Tên dự án đã cập nhật",
      "description": "Mô tả mới",
      "deadline": "2026-12-20T23:59:59.000Z",
      "createdAt": "2026-11-22T15:10:00.000Z",
      "updatedAt": "2026-11-23T00:15:00.000Z",
      "members": [...],
      "_count": {
        "tasks": 0
      }
    }
  }
  ```

### Thêm thành viên vào dự án (`POST /api/projects/:id/members`)
- Quyền hạn: Yêu cầu đăng nhập (`requireAuth`), là thành viên dự án (`requireProjectMember`) và phải là Trưởng nhóm (`requireLeader`).
- Request Body:
  ```json
  {
    "email": "vanb@example.com"
  }
  ```
- Response thành công (`201 Created`):
  ```json
  {
    "message": "Thêm thành viên thành công!",
    "member": {
      "projectId": 1,
      "userId": 2,
      "role": "MEMBER",
      "joinedAt": "2026-11-23T13:30:00.000Z",
      "user": {
        "id": 2,
        "name": "Trần Văn B",
        "email": "vanb@example.com",
        "avatarUrl": null
      }
    }
  }
  ```
- Mã lỗi:
  - `400`: `{"error": "Email thành viên không được để trống!"}`
  - `401`: `{"error": "Vui lòng đăng nhập để tiếp tục!"}`
  - `403`: `{"error": "Chỉ trưởng nhóm (LEADER) mới có quyền thực hiện thao tác này!"}`
  - `404`: `{"error": "Không tìm thấy người dùng với email này!"}` hoặc `{"error": "Không tìm thấy dự án!"}`
  - `409`: `{"error": "Người dùng này đã là thành viên của dự án!"}`

### Xóa thành viên khỏi dự án (`DELETE /api/projects/:id/members/:userId`)
- Quyền hạn: Yêu cầu đăng nhập (`requireAuth`), là thành viên dự án (`requireProjectMember`) và phải là Trưởng nhóm (`requireLeader`).
- Response thành công (`200 OK`):
  ```json
  {
    "message": "Đã loại thành viên khỏi dự án!"
  }
  ```
- Mã lỗi:
  - `400`: `{"error": "Không thể xóa trưởng nhóm khỏi dự án!"}`
  - `401`: `{"error": "Vui lòng đăng nhập để tiếp tục!"}`
  - `403`: `{"error": "Chỉ trưởng nhóm (LEADER) mới có quyền thực hiện thao tác này!"}`
  - `404`: `{"error": "Thành viên không thuộc dự án này!"}` hoặc `{"error": "Không tìm thấy dự án!"}`

### Chuyển quyền trưởng nhóm (`PATCH /api/projects/:id/transfer-leader`)
- Quyền hạn: Yêu cầu đăng nhập (`requireAuth`), là thành viên dự án (`requireProjectMember`) và phải là Trưởng nhóm (`requireLeader`).
- Request Body:
  ```json
  {
    "newLeaderId": 2
  }
  ```
- Response thành công (`200 OK`):
  ```json
  {
    "message": "Đã chuyển quyền trưởng nhóm cho Trần Văn B!"
  }
  ```
- Mã lỗi:
  - `400`: `{"error": "Vui lòng chọn thành viên nhận quyền hợp lệ!"}` hoặc `{"error": "Bạn đã là trưởng nhóm của dự án này!"}`
  - `401`: `{"error": "Vui lòng đăng nhập để tiếp tục!"}`
  - `403`: `{"error": "Chỉ trưởng nhóm (LEADER) mới có quyền thực hiện thao tác này!"}`
  - `404`: `{"error": "Người được chuyển quyền phải là thành viên của dự án!"}`

### Rời khỏi dự án (`DELETE /api/projects/:id/leave`)
- Quyền hạn: Yêu cầu đăng nhập (`requireAuth`) và là thành viên dự án (`requireProjectMember`). Trưởng nhóm (`LEADER`) không được rời dự án khi chưa chuyển quyền.
- Response thành công (`200 OK`):
  ```json
  {
    "message": "Bạn đã rời khỏi dự án!"
  }
  ```
- Mã lỗi:
  - `400`: `{"error": "Trưởng nhóm không thể rời dự án khi chưa chuyển quyền cho thành viên khác!"}`
  - `401`: `{"error": "Vui lòng đăng nhập để tiếp tục!"}`
  - `403`: `{"error": "Bạn không phải là thành viên của dự án này!"}`

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

Tất cả API công việc yêu cầu xác thực JWT qua header `Authorization: Bearer <token>`. Không hỗ trợ xác thực bằng ID người dùng do client cung cấp.

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

---

## 6. Middleware phân quyền dự án dùng chung
*File khai báo:* `server/src/middleware/projectAuth.js`

Gồm 2 hàm kiểm tra quyền theo từng dự án (`requireProjectMember` và `requireLeader`). **Lưu ý:** Luôn đặt sau middleware xác thực đăng nhập (`requireAuth`) để có sẵn `req.user`. Middleware xác định người dùng từ `req.user.id` sau khi JWT đã được xác thực.

### Cách hoạt động
**`requireProjectMember`**: Kiểm tra người dùng hiện tại có nằm trong bảng `ProjectMember` của dự án hay không (`LEADER` hoặc `MEMBER`). Hàm tự động tìm `projectId` theo thứ tự ưu tiên sau (mã trên URL luôn thắng `req.body`):
  1. `req.params.projectId` (ví dụ: `/api/projects/:projectId/tasks`)
  2. `req.params.id` trên route `/api/projects/:id`
  3. `taskId` hoặc `id` trên route công việc (ví dụ: `/api/tasks/:id`, `/api/tasks/:taskId/comments`)
  4. `commentId` hoặc `id` trên route bình luận (ví dụ: `/api/comments/:id`)
  5. `req.body.projectId`, chỉ khi URL không có mã nào ở trên (ví dụ: `POST /api/tasks`)

  Sau khi kiểm tra hợp lệ, middleware gắn sẵn `req.project` và `req.projectMember` để controller phía sau dùng lại.

**`requireLeader`**: Kiểm tra vai trò của thành viên trong dự án phải là `"LEADER"`. Nếu thiếu quyền sẽ trả về mã `403` kèm `{ "error": "Chỉ trưởng nhóm (LEADER) mới có quyền thực hiện thao tác này!" }`.

### Ví dụ áp dụng trong các file Route
```javascript
import { requireProjectMember, requireLeader } from "../middleware/projectAuth.js";

// 1. Thao tác dành cho mọi thành viên dự án (LEADER & MEMBER)
router.get("/projects/:projectId/tasks", requireAuth, requireProjectMember, ...);

router.patch("/tasks/:id", requireAuth, requireProjectMember, ...);
router.post("/tasks/:taskId/comments", requireAuth, requireProjectMember, ...);

// 2. Thao tác chỉ dành cho Trưởng nhóm (LEADER)
router.put("/projects/:id", requireAuth, requireProjectMember, requireLeader, ...);
router.delete("/projects/:id", requireAuth, requireProjectMember, requireLeader, ...);
router.post("/tasks", requireAuth, requireLeader, ...);
```


---

## Thống kê (`/api/stats`) — Người 2

*Tất cả API yêu cầu đăng nhập. Quy ước: chỉ tính **công việc chính** (không tính công việc con); "quá hạn" = có hạn đã qua và chưa hoàn thành.*

### Bảng điều khiển (`GET /api/stats/dashboard`)
Tổng hợp trong các dự án mà người dùng tham gia.
```json
{ "total": 14, "todo": 4, "inProgress": 5, "done": 5, "overdue": 2 }
```

### Dự án gần đây (`GET /api/stats/recent-projects`)
Tối đa 5 dự án mới cập nhật gần nhất.
```json
[
  {
    "id": 1,
    "name": "Ứng dụng quản lý tác vụ TaskFlow",
    "description": null,
    "deadline": "2026-12-15T23:59:59.000Z",
    "updatedAt": "2026-11-25T08:00:00.000Z",
    "role": "LEADER",
    "taskCount": 10,
    "doneCount": 4,
    "overdueCount": 2,
    "completionPercent": 40
  }
]
```

### Việc sắp đến hạn (`GET /api/stats/upcoming-tasks`)
Việc chưa hoàn thành có hạn trong 48 giờ tới, sắp xếp theo hạn tăng dần (tối đa 20).
```json
[
  {
    "id": 7,
    "title": "Nộp báo cáo tuần 3",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2026-11-26T09:00:00.000Z",
    "project": { "id": 1, "name": "Ứng dụng quản lý tác vụ TaskFlow" },
    "assignee": { "id": 2, "name": "Trần Văn B" }
  }
]
```

### Thống kê một dự án (`GET /api/stats/projects/:projectId`)
- Quyền: thành viên dự án (`403` nếu không phải thành viên, `404` nếu không có dự án).
```json
{
  "project": { "id": 1, "name": "Ứng dụng quản lý tác vụ TaskFlow", "deadline": null },
  "myRole": "LEADER",
  "total": 10,
  "byStatus": { "TODO": 3, "IN_PROGRESS": 3, "DONE": 4 },
  "completionPercent": 40,
  "overdue": 2
}
```

### Tiến độ từng thành viên (`GET /api/stats/projects/:projectId/members`)
- Quyền: **chỉ trưởng nhóm** (`403` với thành viên thường). Tính theo công việc chính được giao cho từng người.
```json
[
  {
    "user": { "id": 1, "name": "Nguyễn Thị Anh Thư", "email": "anhthu@example.com", "avatarUrl": null },
    "role": "LEADER",
    "total": 4,
    "todo": 1,
    "inProgress": 1,
    "done": 2,
    "overdue": 1,
    "completionPercent": 50
  }
]
```
