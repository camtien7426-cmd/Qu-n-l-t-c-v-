
import { useDroppable } from '@dnd-kit/core';

const COLUMN_STYLES = {
  TODO: {
    dot: 'bg-slate-400',
    count: 'bg-slate-100 text-slate-600',
  },
  IN_PROGRESS: {
    dot: 'bg-blue-500',
    count: 'bg-blue-50 text-blue-700',
  },
  DONE: {
    dot: 'bg-emerald-500',
    count: 'bg-emerald-50 text-emerald-700',
  },
};

export default function KanbanColumn({
  status,
  title,
  tasks = [],
  children,
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: {
      type: 'column',
      status,
    },
  });

  const styles = COLUMN_STYLES[status] || COLUMN_STYLES.TODO;

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title}, ${tasks.length} công việc`}
      className={`min-h-64 min-w-0 rounded-2xl border p-3 transition-all duration-200 sm:p-4 ${
        isOver
          ? 'border-indigo-400 bg-indigo-50/80 shadow-md shadow-indigo-100'
          : 'border-slate-200 bg-slate-50/80'
      }`}
    >
      {/* Tiêu đề cột */}
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`}
          />

          <h2 className="truncate text-sm font-bold text-slate-800">
            {title}
          </h2>
        </div>

        <span
          className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold ${styles.count}`}
          aria-label={`${tasks.length} công việc`}
        >
          {tasks.length}
        </span>
      </header>

      {/* Khu vực chứa công việc */}
      <div className="min-h-40 space-y-3">
        {tasks.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-6 text-center">
            <span className="mb-2 text-2xl text-slate-300">
              +
            </span>

            <p className="text-sm font-medium text-slate-500">
              Chưa có công việc
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Kéo công việc vào đây
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}