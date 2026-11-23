import React, { useState, useEffect } from "react";
import { APP_NAME } from "./config/constants.js";
import { apiRequest } from "./api.js";

const STATUS_LABEL = {
  TODO: "Chưa thực hiện",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn thành",
};

function formatDateVi(isoString) {
  if (!isoString) return "Chưa đặt thời hạn";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Không hợp lệ";
  return date.toLocaleDateString("vi-VN");
}

function App() {
  const [tab, setTab] = useState("home");

  // State Đăng ký
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // State Dự án (Tạo mới & Danh sách)
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [leaderId, setLeaderId] = useState(() => localStorage.getItem("currentUserId") || "1");

  // State Sửa dự án
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // State Công việc (Task)
  const [selectedProjectId, setSelectedProjectId] = useState("1");
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");

  // Lưu User ID đang thao tác vào localStorage để test phân quyền LEADER / MEMBER
  useEffect(() => {
    if (leaderId) {
      localStorage.setItem("currentUserId", String(leaderId));
    } else {
      localStorage.removeItem("currentUserId");
    }
  }, [leaderId]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    setProjectsError("");
    try {
      const data = await apiRequest("/projects");
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      setSelectedProjectId((current) =>
        list.some((p) => String(p.id) === String(current))
          ? current
          : list.length > 0
          ? String(list[0].id)
          : ""
      );
    } catch (err) {
      setProjectsError(err.message);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchTasks = async (projId) => {
    if (!projId) return;
    try {
      const data = await apiRequest(`/projects/${projId}/tasks`);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === "projects" || tab === "tasks") {
      fetchProjects();
    }
    if (tab === "tasks" && selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [tab, selectedProjectId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setAuthMsg(`Đăng ký thành công! User ID của bạn là: ${data.user.id} (${data.user.email})`);
      setLeaderId(String(data.user.id));
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setAuthMsg(`Lỗi: ${err.message}`);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          deadline: projectDeadline ? `${projectDeadline}T23:59:59.000Z` : null,
          leaderId,
        }),
      });
      setProjectName("");
      setProjectDesc("");
      setProjectDeadline("");
      fetchProjects();
    } catch (err) {
      alert("Lỗi tạo dự án: " + err.message);
    }
  };

  // Mở khung sửa dự án với dữ liệu hiện tại
  const openEditModal = (project) => {
    setEditingProject(project);
    setEditName(project.name || "");
    setEditDesc(project.description || "");
    setEditDeadline(project.deadline ? project.deadline.slice(0, 10) : "");
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    setEditSubmitting(true);
    try {
      await apiRequest(`/projects/${editingProject.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          deadline: editDeadline ? `${editDeadline}T23:59:59.000Z` : null,
        }),
      });
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      alert("Lỗi cập nhật dự án: " + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert("Hãy tạo và chọn một dự án trước khi thêm công việc.");
      return;
    }
    try {
      await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          priority: taskPriority,
          projectId: selectedProjectId,
        }),
      });
      setTaskTitle("");
      fetchTasks(selectedProjectId);
    } catch (err) {
      alert("Lỗi thêm công việc: " + err.message);
    }
  };

  const handleChangeStatus = async (taskId, status) => {
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchTasks(selectedProjectId);
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Bạn có chắc muốn xóa công việc này?")) return;
    try {
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      fetchTasks(selectedProjectId);
    } catch (err) {
      alert("Lỗi xóa công việc: " + err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Xóa dự án sẽ xóa toàn bộ công việc bên trong. Bạn có chắc không?")) return;
    try {
      await apiRequest(`/projects/${projectId}`, { method: "DELETE" });
      if (String(projectId) === String(selectedProjectId)) setSelectedProjectId("");
      fetchProjects();
    } catch (err) {
      alert("Lỗi xóa dự án: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-1">{APP_NAME}</h1>
        <p className="text-gray-600 mb-2">Quản lý công việc và dự án nhóm cho sinh viên</p>
        <p className="text-sm font-medium text-green-600 mb-6">
          Kết nối backend và cơ sở dữ liệu: thành công
        </p>

        {/* Thanh điều hướng */}
        <div className="flex flex-wrap gap-3 mb-6 border-b pb-4">
          <button
            onClick={() => setTab("home")}
            className={`px-4 py-2 rounded font-medium ${
              tab === "home" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setTab("register")}
            className={`px-4 py-2 rounded font-medium ${
              tab === "register" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            1. Đăng ký thành viên
          </button>
          <button
            onClick={() => setTab("projects")}
            className={`px-4 py-2 rounded font-medium ${
              tab === "projects" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            2. Quản lý Dự án
          </button>
          <button
            onClick={() => setTab("tasks")}
            className={`px-4 py-2 rounded font-medium ${
              tab === "tasks" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            3. Quản lý Công việc (Task)
          </button>
        </div>

        {/* Tab Tổng quan */}
        {tab === "home" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Hệ thống quản lý công việc nhóm {APP_NAME}</h2>
            <p className="text-gray-600">
              Kiến trúc: React (Vite) + Node.js (Express) + PostgreSQL (Prisma ORM - 6 bảng).
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>
                <strong>Chức năng 1:</strong> Đăng ký tài khoản người dùng (Lưu bảng <code>User</code>).
              </li>
              <li>
                <strong>Chức năng 2:</strong> Tạo, sửa và xem danh sách dự án kèm thời hạn & phân quyền Trưởng nhóm.
              </li>
              <li>
                <strong>Chức năng 3:</strong> Thêm và xem công việc theo từng dự án (Lưu bảng <code>Task</code>).
              </li>
              <li>
                <strong>Chức năng 4:</strong> Sửa trạng thái công việc và xóa công việc / dự án.
              </li>
            </ul>
          </div>
        )}

        {/* Tab Đăng ký */}
        {tab === "register" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Đăng ký tài khoản mới</h2>
            <form onSubmit={handleRegister} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: nguyenvana@gmail.com"
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
              >
                Đăng ký
              </button>
            </form>
            {authMsg && (
              <div className="mt-4 p-3 bg-green-50 border border-green-300 text-green-800 rounded">
                {authMsg}
              </div>
            )}
          </div>
        )}

        {/* Tab Dự án */}
        {tab === "projects" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tạo Dự án mới</h2>
            <form
              onSubmit={handleCreateProject}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded border"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên dự án <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="VD: Đồ án Web"
                  className="w-full border p-2 rounded bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thời hạn dự án (Deadline):</label>
                <input
                  type="date"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  className="w-full border p-2 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả:</label>
                <input
                  type="text"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Mô tả ngắn..."
                  className="w-full border p-2 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  User ID đang thao tác (Trưởng nhóm):
                </label>
                <input
                  type="number"
                  min="1"
                  value={leaderId}
                  onChange={(e) => setLeaderId(e.target.value)}
                  className="w-full border p-2 rounded bg-white"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 font-medium"
                >
                  Tạo dự án
                </button>
              </div>
            </form>

            {/* Khung Sửa dự án (hiện khi bấm nút Sửa) */}
            {editingProject && (
              <div className="mb-8 bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-yellow-900">
                    Sửa thông tin dự án #{editingProject.id}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Đóng ✕
                  </button>
                </div>
                <form onSubmit={handleUpdateProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tên dự án <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border p-2 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Thời hạn dự án (Deadline):</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="w-full border p-2 rounded bg-white"
                      />
                      {editDeadline && (
                        <button
                          type="button"
                          onClick={() => setEditDeadline("")}
                          className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                          title="Xóa thời hạn"
                        >
                          Xóa hạn
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Mô tả:</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Mô tả ngắn..."
                      className="w-full border p-2 rounded bg-white"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                      {editSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-3">Danh sách Dự án:</h3>

            {/* 3 trạng thái chuẩn: Đang tải / Lỗi / Trống */}
            {projectsLoading && (
              <p className="text-blue-600 py-4">Đang tải danh sách dự án...</p>
            )}

            {!projectsLoading && projectsError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded mb-4">
                Lỗi tải dữ liệu: {projectsError}
              </div>
            )}

            {!projectsLoading && !projectsError && projects.length === 0 && (
              <p className="text-gray-500">
                Chưa có dự án nào. Hãy tạo tài khoản trước rồi dùng ID đó để tạo dự án.
              </p>
            )}

            {!projectsLoading && !projectsError && projects.length > 0 && (
              <div className="space-y-3">
                {projects.map((p) => {
                  const leader = p.members?.find((m) => m.role === "LEADER");
                  const isOverdue = p.deadline && new Date(p.deadline) < new Date();
                  return (
                    <div
                      key={p.id}
                      className="border p-4 rounded bg-white shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                    >
                      <div>
                        <h4 className="font-bold text-lg text-blue-700">
                          #{p.id} - {p.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {p.description || "Không có mô tả"}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5">
                          <span>
                            Trưởng nhóm:{" "}
                            <strong className="text-gray-700">
                              {leader?.user?.name || "N/A"} (ID: {leader?.userId ?? "?"})
                            </strong>
                          </span>
                          <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                            Thời hạn:{" "}
                            <strong className={isOverdue ? "text-red-600" : "text-gray-700"}>
                              {formatDateVi(p.deadline)}
                              {isOverdue ? " (Quá hạn)" : ""}
                            </strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          {p._count?.tasks || 0} công việc
                        </span>
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded hover:bg-amber-200 font-medium"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-medium"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Công việc */}
        {tab === "tasks" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Quản lý Công việc theo Dự án</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Chọn Dự án:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="border p-2 rounded w-full max-w-xs bg-white"
              >
                {projects.length === 0 && <option value="">(Chưa có dự án nào)</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <form
              onSubmit={handleCreateTask}
              className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded border"
            >
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Nhập tên công việc cần làm..."
                className="flex-1 border p-2 rounded min-w-[200px]"
                required
              />
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="border p-2 rounded bg-white"
              >
                <option value="LOW">Ưu tiên: Thấp</option>
                <option value="MEDIUM">Ưu tiên: Trung bình</option>
                <option value="HIGH">Ưu tiên: Cao</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
              >
                Thêm Task
              </button>
            </form>

            <h3 className="text-lg font-semibold mb-3">Danh sách Công việc:</h3>
            <div className="space-y-2">
              {tasks.length === 0 && (
                <p className="text-gray-500">Dự án này chưa có công việc nào.</p>
              )}
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="border p-3 rounded flex justify-between items-center bg-white"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={t.status}
                      onChange={(e) => handleChangeStatus(t.id, e.target.value)}
                      className="border p-1 rounded text-xs bg-white"
                    >
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        t.priority === "HIGH"
                          ? "bg-red-100 text-red-700"
                          : t.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-medium"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;