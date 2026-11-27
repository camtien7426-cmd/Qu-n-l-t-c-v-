
import { useDraggable } from '@dnd-kit/core';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'Chưa thực hiện' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'DONE', label: 'Hoàn thành' },
];

const PRIORITY_LABELS = {
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
};

const PRIORITY_STYLES = {
  HIGH: 'bg-rose-50 text-rose-600 ring-rose-100',
  MEDIUM: 'bg-amber-50 text-amber-600 ring-amber-100',
  LOW: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
};

function formatDate(value) {
  if (!value) return 'Chưa đặt';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Chưa đặt';

  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function canUpdateTask(task, currentUser, role) {
  if (role === 'LEADER') return true;

  return (
    role === 'MEMBER' &&
    currentUser?.id != null &&
    task.assigneeId != null &&
    String(task.assigneeId) === String(currentUser.id)
  );
}

export default function KanbanCard({
  task,
  currentUser,
  role,
  onStatusChange,
  isUpdating = false,
}) {
  const hasPermission = canUpdateTask(task, currentUser, role);
  const dragDisabled = !hasPermission || isUpdating;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { task },
    disabled: dragDisabled,
  });

  const dueTime = task.dueDate
    ? new Date(task.dueDate).getTime()
    : null;

  const overdue =
    dueTime != null &&
    !Number.isNaN(dueTime) &&
    task.status !== 'DONE' &&
    dueTime < Date.now();

  const progress = task.subtaskProgress;

  const permissionMessage =
    role === 'MEMBER'
      ? 'Bạn chỉ có thể đổi trạng thái công việc được giao cho mình.'
      : 'Bạn không có quyền đổi trạng thái công việc này.';

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.35 : 1,
  };

  const priorityStyle =
    PRIORITY_STYLES[task.priority] || 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 ${
        isDragging
          ? 'shadow-lg'
          : 'hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md'
      }`}
    >
      {/* Tiêu đề và nút kéo thả */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-sm font-semibold leading-5 text-slate-800">
          {task.title}
        </h3>

        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={dragDisabled}
          title={
            dragDisabled
              ? isUpdating
                ? 'Đang cập nhật trạng thái'
                : permissionMessage
              : 'Kéo thẻ sang cột khác'
          }
          aria-label={
            dragDisabled
              ? permissionMessage
              : `Kéo công việc ${task.title}`
          }
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg transition-colors ${
            dragDisabled
              ? 'cursor-not-allowed text-slate-300'
              : 'cursor-grab text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing'
          }`}
        >
          ⠿
        </button>
      </div>

      {/* Nhãn ưu tiên và hạn hoàn thành */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${priorityStyle}`}
        >
          <span>●</span>
          {PRIORITY_LABELS[task.priority] || task.priority || 'Chưa rõ'}
        </span>

        {overdue && (
          <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600">
            Quá hạn
          </span>
        )}
      </div>

      {/* Hạn công việc */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={overdue ? 'text-rose-500' : 'text-slate-400'}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>

        <span className={overdue ? 'font-medium text-rose-600' : 'text-slate-500'}>
          Hạn: {formatDate(task.dueDate)}
        </span>
      </div>

      {/* Người thực hiện */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
          {task.assignee?.name
            ? task.assignee.name.charAt(0).toUpperCase()
            : '?'}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-700">
            {task.assignee?.name || 'Chưa giao'}
          </p>
          <p className="text-[11px] text-slate-400">
            Người thực hiện
          </p>
        </div>
      </div>

      {/* Tiến độ công việc con */}
      {progress?.total > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Công việc con</span>

            <span className="font-semibold text-slate-700">
              {progress.done || 0}/{progress.total}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  ((progress.done || 0) / progress.total) * 100,
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Đổi trạng thái */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <label
          htmlFor={`task-status-${task.id}`}
          className="mb-1.5 block text-xs font-medium text-slate-500"
        >
          Trạng thái
        </label>

        <select
          id={`task-status-${task.id}`}
          value={task.status}
          disabled={!hasPermission || isUpdating}
          title={!hasPermission ? permissionMessage : undefined}
          onChange={(event) =>
            onStatusChange?.(task.id, event.target.value)
          }
          className={`w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none transition-colors ${
            !hasPermission || isUpdating
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
          }`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {!hasPermission && (
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {permissionMessage}
          </p>
        )}

        {isUpdating && (
          <p className="mt-2 text-xs text-indigo-500">
            Đang cập nhật...
          </p>
        )}
      </div>
    </article>
  );
}