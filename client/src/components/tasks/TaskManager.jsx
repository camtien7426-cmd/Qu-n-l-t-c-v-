import React, { useEffect, useState, useCallback } from "react";
import TaskForm from "./TaskForm.jsx";
import TaskDetailPanel from "./TaskDetailPanel.jsx";
import { taskApi, STATUS_LABEL, PRIORITY_LABEL, PRIORITY_STYLE, formatDate } from "../../lib/taskApi.js";

// Màn hình công việc của một dự án: danh sách + form tạo + khung chi tiết
export default function TaskManager({ projectId, userId }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const role = members.find((m) => m.userId === Number(userId))?.role || null;

  const load = useCallback(async () => {
    if (!projectId || !userId) return;
    setLoading(true);
    setError("");
    try {
      const [projects, list] = await Promise.all([
        fetch("/api/projects").then((r) => r.json()),
        taskApi(`/projects/${projectId}/tasks`, { userId }),
      ]);
      setMembers((Array.isArray(projects) ? projects : []).find((p) => p.id === Number(projectId))?.members || []);
      setTasks(list);
    } catch (err) {
      setTasks([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Danh sách công việc</h3>
        {role === "LEADER" && !showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Tạo công việc</button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <TaskForm
            members={members}
            submitLabel="Tạo công việc"
            onCancel={() => setShowForm(false)}
            onSubmit={async (v) => {
              await taskApi("/tasks", { method: "POST", body: { ...v, projectId: Number(projectId) }, userId });
              setShowForm(false);
              await load();
            }}
          />
        </div>
      )}

      {loading && <p className="text-gray-500">Đang tải...</p>}
      {!loading && error && <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">{error}</p>}
      {!loading && !error && tasks.length === 0 && <p className="text-gray-500">Dự án này chưa có công việc nào.</p>}

      <div className="space-y-2">
        {tasks.map((t) => (
          <button key={t.id} onClick={() => setSelectedId(t.id)} className="w-full text-left border p-3 rounded bg-white hover:bg-blue-50 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{t.title}</p>
              <p className="text-xs text-gray-500">
                {t.assignee?.name || "Chưa giao"} · Hạn: {formatDate(t.dueDate)} · {STATUS_LABEL[t.status]}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {t.subtaskProgress.total > 0 && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{t.subtaskProgress.done}/{t.subtaskProgress.total} việc con</span>
              )}
              <span className={`text-xs font-semibold px-2 py-1 rounded ${PRIORITY_STYLE[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedId && (
        <TaskDetailPanel
          taskId={selectedId}
          userId={Number(userId)}
          role={role}
          members={members}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
