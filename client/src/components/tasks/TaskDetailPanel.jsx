import React, { useEffect, useState } from "react";
import TaskForm from "./TaskForm.jsx";
import { taskApi, STATUS_LABEL, PRIORITY_LABEL, PRIORITY_STYLE, formatDate } from "../../lib/taskApi.js";

// Khung chi tiết bên phải (kiểu Jira): xem, sửa, xóa, đổi trạng thái và quản lý công việc con
export default function TaskDetailPanel({ taskId, userId, role, members, onClose, onChanged }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const isLeader = role === "LEADER";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setTask(await taskApi(`/tasks/${taskId}`, { userId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [taskId, userId]);

  const run = async (fn) => {
    try {
      setError("");
      await fn();
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const update = (id, body) => run(() => taskApi(`/tasks/${id}`, { method: "PATCH", body, userId }));
  const remove = (id, isSub) => {
    if (!window.confirm(isSub ? "Xóa công việc con này?" : "Xóa công việc này? Công việc con và bình luận cũng bị xóa.")) return;
    run(async () => {
      await taskApi(`/tasks/${id}`, { method: "DELETE", userId });
      if (!isSub) { onChanged(); onClose(); }
    });
  };

  const canChangeStatus = (t) => isLeader || t.assigneeId === userId;

  return (
    <aside className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white shadow-2xl border-l p-5 overflow-y-auto z-50">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Chi tiết công việc</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-black text-xl leading-none" aria-label="Đóng">×</button>
      </div>

      {loading && !task && <p className="text-gray-500">Đang tải...</p>}
      {error && <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</p>}

      {task && !editing && (
        <div className="space-y-4">
          <h4 className="text-xl font-bold">{task.title}</h4>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className={`px-2 py-1 rounded font-semibold ${PRIORITY_STYLE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
            {canChangeStatus(task) ? (
              <select value={task.status} onChange={(e) => update(task.id, { status: e.target.value })} className="border p-1 rounded bg-white">
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : (
              <span className="px-2 py-1 rounded bg-gray-200">{STATUS_LABEL[task.status]}</span>
            )}
          </div>
          <dl className="text-sm grid grid-cols-3 gap-y-2">
            <dt className="text-gray-500">Người thực hiện</dt><dd className="col-span-2">{task.assignee?.name || "Chưa giao"}</dd>
            <dt className="text-gray-500">Thời hạn</dt><dd className="col-span-2">{formatDate(task.dueDate)}</dd>
            <dt className="text-gray-500">Mô tả</dt><dd className="col-span-2 whitespace-pre-wrap">{task.description || "Không có mô tả"}</dd>
          </dl>
          {isLeader && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Sửa</button>
              <button onClick={() => remove(task.id, false)} className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm">Xóa</button>
            </div>
          )}

          <hr />
          <div>
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-semibold">
                Công việc con <span className="text-sm font-normal text-gray-500">({task.subtaskProgress.done}/{task.subtaskProgress.total} hoàn thành)</span>
              </h5>
              {isLeader && !addingSub && <button onClick={() => setAddingSub(true)} className="text-sm text-blue-600 hover:underline">+ Thêm</button>}
            </div>
            {task.subtaskProgress.total > 0 && (
              <div className="h-2 bg-gray-200 rounded mb-3">
                <div className="h-2 bg-green-500 rounded" style={{ width: `${(task.subtaskProgress.done / task.subtaskProgress.total) * 100}%` }} />
              </div>
            )}
            {addingSub && (
              <div className="mb-3">
                <TaskForm
                  simple
                  members={members}
                  submitLabel="Thêm công việc con"
                  onCancel={() => setAddingSub(false)}
                  onSubmit={async (v) => {
                    await taskApi(`/tasks/${task.id}/subtasks`, { method: "POST", body: { title: v.title, assigneeId: v.assigneeId, dueDate: v.dueDate }, userId });
                    setAddingSub(false);
                    await load();
                    onChanged();
                  }}
                />
              </div>
            )}
            {task.subtasks.length === 0 && !addingSub && <p className="text-sm text-gray-500">Chưa có công việc con.</p>}
            <ul className="space-y-2">
              {task.subtasks.map((s) => (
                <li key={s.id} className="border rounded p-2 text-sm flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className={`font-medium ${s.status === "DONE" ? "line-through text-gray-400" : ""}`}>{s.title}</p>
                    <p className="text-xs text-gray-500">{s.assignee?.name || "Chưa giao"} · {formatDate(s.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canChangeStatus(s) ? (
                      <select value={s.status} onChange={(e) => update(s.id, { status: e.target.value })} className="border p-1 rounded bg-white text-xs">
                        {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{STATUS_LABEL[s.status]}</span>
                    )}
                    {isLeader && <button onClick={() => remove(s.id, true)} className="text-red-600 hover:underline text-xs">Xóa</button>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {task && editing && (
        <TaskForm
          initial={task}
          members={members}
          submitLabel="Lưu thay đổi"
          onCancel={() => setEditing(false)}
          onSubmit={async (v) => {
            await taskApi(`/tasks/${task.id}`, { method: "PATCH", body: v, userId });
            setEditing(false);
            await load();
            onChanged();
          }}
        />
      )}
    </aside>
  );
}
