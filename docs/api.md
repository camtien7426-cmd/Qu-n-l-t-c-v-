# Đặc tả định dạng JSON API - TaskFlow

## 1. Quy ước chung
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

Tạm thời gửi header `X-User-Id: <id>` thay cho `Authorization` cho đến khi có đăng nhập thật.

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/projects/:projectId/tasks` | Thành viên dự án | Danh sách công việc chính (kèm `subtasks`, `subtaskProgress`), mới nhất trước. Query tùy chọn: `q` (tìm theo tiêu đề, không phân biệt hoa thường, tối đa 200 ký tự; sai kiểu hoặc quá dài trả `400`) |
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

Gồm 2 hàm kiểm tra quyền theo từng dự án (`requireProjectMember` và `requireLeader`). **Lưu ý:** Luôn đặt sau middleware xác thực đăng nhập (`requireAuth`) để có sẵn `req.user`. Trong lúc chưa có `requireAuth`, middleware tạm đọc header `X-User-Id`.

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
router.post("/tasks", requireAuth, requireProjectMember, ...);
router.patch("/tasks/:id", requireAuth, requireProjectMember, ...);
router.post("/tasks/:taskId/comments", requireAuth, requireProjectMember, ...);

// 2. Thao tác chỉ dành cho Trưởng nhóm (LEADER)
router.put("/projects/:id", requireAuth, requireProjectMember, requireLeader, ...);
router.delete("/projects/:id", requireAuth, requireProjectMember, requireLeader, ...);
```
