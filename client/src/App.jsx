import React, { useState, useEffect } from 'react';

const STATUS_LABEL = {
  TODO: 'Chưa thực hiện',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
};

function App() {
  const [tab, setTab] = useState('home'); // 'home', 'register', 'projects', 'tasks'

  // State Đăng ký
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMsg, setAuthMsg] = useState('');

  // State Dự án
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [leaderId, setLeaderId] = useState('1');

  // State Công việc (Task)
  const [selectedProjectId, setSelectedProjectId] = useState('1');
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      // Nếu dự án đang chọn không còn tồn tại (hoặc chưa chọn) thì chọn dự án đầu tiên
      setSelectedProjectId((current) =>
        list.some((p) => String(p.id) === String(current))
          ? current
          : list.length > 0
          ? String(list[0].id)
          : ''
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async (projId) => {
    if (!projId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projId}/tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === 'projects' || tab === 'tasks') {
      fetchProjects();
    }
    if (tab === 'tasks' && selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [tab, selectedProjectId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setAuthMsg(`Đăng ký thành công! User ID của bạn là: ${data.user.id} (${data.user.email})`);
      setName('');
      setEmail('');
      setPassword('');
    } else {
      setAuthMsg(`Lỗi: ${data.error}`);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName, description: projectDesc, leaderId }),
    });
    if (res.ok) {
      setProjectName('');
      setProjectDesc('');
      fetchProjects();
    } else {
      const err = await res.json();
      alert('Lỗi tạo dự án (kiểm tra lại User ID trưởng nhóm): ' + err.error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Hãy tạo và chọn một dự án trước khi thêm công việc.');
      return;
    }
    const res = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskTitle,
        priority: taskPriority,
        projectId: selectedProjectId,
      }),
    });
    if (res.ok) {
      setTaskTitle('');
      fetchTasks(selectedProjectId);
    } else {
      const err = await res.json();
      alert('Lỗi thêm công việc: ' + err.error);
    }
  };

  const handleChangeStatus = async (taskId, status) => {
    const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchTasks(selectedProjectId);
    } else {
      const err = await res.json();
      alert('Lỗi cập nhật: ' + err.error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
    const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTasks(selectedProjectId);
    } else {
      const err = await res.json();
      alert('Lỗi xóa công việc: ' + err.error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Xóa dự án sẽ xóa toàn bộ công việc bên trong. Bạn có chắc không?')) return;
    const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, { method: 'DELETE' });
    if (res.ok) {
      if (String(projectId) === String(selectedProjectId)) setSelectedProjectId('');
      fetchProjects();
    } else {
      const err = await res.json();
      alert('Lỗi xóa dự án: ' + err.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-1">TaskFlow</h1>
        <p className="text-gray-600 mb-2">Quản lý công việc và dự án nhóm cho sinh viên</p>
        <p className="text-sm font-medium text-green-600 mb-6">Kết nối backend và cơ sở dữ liệu: thành công</p>

        {/* Thanh điều hướng */}
        <div className="flex flex-wrap gap-3 mb-6 border-b pb-4">
          <button onClick={() => setTab('home')} className={`px-4 py-2 rounded font-medium ${tab === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
            Tổng quan
          </button>
          <button onClick={() => setTab('register')} className={`px-4 py-2 rounded font-medium ${tab === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
            1. Đăng ký thành viên
          </button>
          <button onClick={() => setTab('projects')} className={`px-4 py-2 rounded font-medium ${tab === 'projects' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
            2. Quản lý Dự án
          </button>
          <button onClick={() => setTab('tasks')} className={`px-4 py-2 rounded font-medium ${tab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
            3. Quản lý Công việc (Task)
          </button>
        </div>

        {/* Tab Tổng quan */}
        {tab === 'home' && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Báo cáo tiến độ lần 1 - Hệ thống TaskFlow</h2>
            <p className="text-gray-600">Kiến trúc: React (Vite) + Node.js (Express) + PostgreSQL (Prisma ORM - 6 bảng).</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Chức năng 1:</strong> Đăng ký tài khoản người dùng (Lưu bảng <code>User</code>).</li>
              <li><strong>Chức năng 2:</strong> Tạo và xem danh sách dự án kèm phân quyền Trưởng nhóm (Lưu bảng <code>Project</code> & <code>ProjectMember</code>).</li>
              <li><strong>Chức năng 3:</strong> Thêm và xem công việc theo từng dự án (Lưu bảng <code>Task</code>).</li>
              <li><strong>Chức năng 4:</strong> Sửa trạng thái công việc và xóa công việc / dự án (cập nhật, xóa bảng <code>Task</code>, <code>Project</code>).</li>
            </ul>
          </div>
        )}

        {/* Tab Đăng ký */}
        {tab === 'register' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Đăng ký tài khoản mới</h2>
            <form onSubmit={handleRegister} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Họ và tên:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nguyễn Văn A" className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="VD: nguyenvana@gmail.com" className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" className="w-full border p-2 rounded" required />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Đăng ký</button>
            </form>
            {authMsg && <div className="mt-4 p-3 bg-green-50 border border-green-300 text-green-800 rounded">{authMsg}</div>}
          </div>
        )}

        {/* Tab Dự án */}
        {tab === 'projects' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tạo Dự án mới</h2>
            <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded border">
              <div>
                <label className="block text-sm font-medium mb-1">Tên dự án:</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="VD: Đồ án Web" className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả:</label>
                <input type="text" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="Mô tả ngắn..." className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID Trưởng nhóm (Leader):</label>
                <input type="number" value={leaderId} onChange={(e) => setLeaderId(e.target.value)} className="w-full border p-2 rounded" required />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700">Tạo dự án</button>
              </div>
            </form>

            <h3 className="text-lg font-semibold mb-3">Danh sách Dự án trong Database:</h3>
            <div className="space-y-3">
              {projects.length === 0 && <p className="text-gray-500">Chưa có dự án nào. Hãy tạo tài khoản trước rồi dùng ID đó để tạo dự án.</p>}
              {projects.map((p) => (
                <div key={p.id} className="border p-4 rounded bg-white shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg text-blue-700">#{p.id} - {p.name}</h4>
                    <p className="text-sm text-gray-600">{p.description || 'Không có mô tả'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Trưởng nhóm: {p.members?.find((m) => m.role === 'LEADER')?.user?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {p._count?.tasks || 0} công việc
                    </span>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
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

        {/* Tab Công việc */}
        {tab === 'tasks' && (
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
                  <option key={p.id} value={p.id}>#{p.id} - {p.name}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded border">
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
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Thêm Task</button>
            </form>

            <h3 className="text-lg font-semibold mb-3">Danh sách Công việc:</h3>
            <div className="space-y-2">
              {tasks.length === 0 && <p className="text-gray-500">Dự án này chưa có công việc nào.</p>}
              {tasks.map((t) => (
                <div key={t.id} className="border p-3 rounded flex justify-between items-center bg-white">
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
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      t.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                      t.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
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