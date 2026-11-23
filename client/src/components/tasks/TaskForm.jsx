import React, { useState } from "react";
import { PRIORITY_LABEL, toDateInput } from "../../lib/taskApi.js";

// Form dùng cho cả tạo mới và sửa (truyền initial khi sửa). members: danh sách thành viên dự án.
export default function TaskForm({ initial, members, submitLabel = "Lưu", onSubmit, onCancel, simple = false }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ? String(initial.assigneeId) : "");
  const [dueDate, setDueDate] = useState(toDateInput(initial?.dueDate));
  const [priority, setPriority] = useState(initial?.priority || "MEDIUM");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Vui lòng nhập tiêu đề.");
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        dueDate: dueDate || null,
        priority,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-3 bg-gray-50 p-4 rounded border">
      <div>
        <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="w-full border p-2 rounded" placeholder="VD: Thiết kế trang đăng nhập" />
      </div>
      {!simple && (
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border p-2 rounded" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Người thực hiện</label>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full border p-2 rounded bg-white">
            <option value="">Chưa giao</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.user?.name || `Người dùng #${m.userId}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Thời hạn</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        {!simple && (
          <div>
            <label className="block text-sm font-medium mb-1">Mức ưu tiên</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border p-2 rounded bg-white">
              {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Đang lưu..." : submitLabel}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Hủy</button>}
      </div>
    </form>
  );
}
