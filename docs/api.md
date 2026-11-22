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
      "updatedAt": "2026-11-22T16:10:00.000Z"
    }
  ]
}
```

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