
import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import KanbanCard from './KanbanCard.jsx';
import KanbanColumn from './KanbanColumn.jsx';

const COLUMNS = [
  {
    status: 'TODO',
    title: 'Chưa thực hiện',
  },
  {
    status: 'IN_PROGRESS',
    title: 'Đang thực hiện',
  },
  {
    status: 'DONE',
    title: 'Hoàn thành',
  },
];

function sameId(first, second) {
  return String(first) === String(second);
}

function getTaskPermission(task, currentUser, role) {
  if (role === 'LEADER') return true;

  return (
    role === 'MEMBER' &&
    currentUser?.id != null &&
    task.assigneeId != null &&
    sameId(task.assigneeId, currentUser.id)
  );
}

export default function KanbanBoard({
  tasks = [],
  currentUser,
  role,
  changeTaskStatus,
  onTasksChange,
}) {
  const [boardTasks, setBoardTasks] = useState(tasks);
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState('');

  const tasksRef = useRef(tasks);
  const updatingIdsRef = useRef(new Set());

  useEffect(() => {
    const nextTasks = Array.isArray(tasks) ? tasks : [];

    tasksRef.current = nextTasks;
    setBoardTasks(nextTasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function saveTasks(nextTasks) {
    tasksRef.current = nextTasks;
    setBoardTasks(nextTasks);
    onTasksChange?.(nextTasks);
  }

  async function handleStatusChange(taskId, nextStatus) {
    const currentTask = tasksRef.current.find(
      (task) => sameId(task.id, taskId),
    );

    if (!currentTask || currentTask.status === nextStatus) return;

    if (updatingIdsRef.current.has(String(taskId))) return;

    if (!getTaskPermission(currentTask, currentUser, role)) {
      setError('Bạn không có quyền đổi trạng thái công việc này.');
      return;
    }

    const previousStatus = currentTask.status;

    const nextTasks = tasksRef.current.map((task) =>
      sameId(task.id, taskId)
        ? { ...task, status: nextStatus }
        : task,
    );

    updatingIdsRef.current.add(String(taskId));
    setUpdatingIds(new Set(updatingIdsRef.current));

    setError('');
    saveTasks(nextTasks);

    try {
      if (typeof changeTaskStatus !== 'function') {
        throw new Error(
          'Chưa cấu hình hàm cập nhật trạng thái công việc.',
        );
      }

      await changeTaskStatus(taskId, nextStatus);
    } catch (requestError) {
      const rollbackTasks = tasksRef.current.map((task) =>
        sameId(task.id, taskId)
          ? { ...task, status: previousStatus }
          : task,
      );

      saveTasks(rollbackTasks);

      setError(
        requestError?.message ||
          'Không thể cập nhật trạng thái công việc.',
      );
    } finally {
      updatingIdsRef.current.delete(String(taskId));
      setUpdatingIds(new Set(updatingIdsRef.current));
    }
  }

  function handleDragStart(event) {
    const task = tasksRef.current.find(
      (item) => sameId(item.id, event.active.id),
    );

    setActiveTask(task || null);
  }

  function handleDragEnd(event) {
    setActiveTask(null);

    const { active, over } = event;

    if (!over) return;

    const task = tasksRef.current.find(
      (item) => sameId(item.id, active.id),
    );

    if (!task) return;

    const overData = over.data.current;

    const targetStatus =
      overData?.type === 'column'
        ? overData.status
        : overData?.task?.status;

    if (!targetStatus || targetStatus === task.status) return;

    void handleStatusChange(task.id, targetStatus);
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  // Tính tiến độ hoàn thành
  const totalTasks = boardTasks.length;

  const completedTasks = boardTasks.filter(
    (task) => task.status === 'DONE',
  ).length;

  const progress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Tổng quan tiến độ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Bảng công việc
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi tiến độ công việc theo từng trạng thái.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">
                Tiến độ hoàn thành
              </p>

              <p className="text-xl font-bold text-emerald-600">
                {progress}%
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Đã hoàn thành {completedTasks}/{totalTasks} công việc
        </p>
      </section>

      {/* Thông báo lỗi */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <div className="flex items-start gap-2">
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Đóng thông báo lỗi"
            className="rounded-md px-2 font-semibold hover:bg-rose-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Bảng Kanban */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnTasks = boardTasks.filter(
              (task) => task.status === column.status,
            );

            return (
              <div
                key={column.status}
                className="min-w-0"
              >
                <KanbanColumn
                  status={column.status}
                  title={column.title}
                  tasks={columnTasks}
                >
                  {columnTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      role={role}
                      onStatusChange={handleStatusChange}
                      isUpdating={updatingIds.has(String(task.id))}
                    />
                  ))}
                </KanbanColumn>
              </div>
            );
          })}
        </div>

        {/* Xem trước khi kéo công việc */}
        <DragOverlay>
          {activeTask ? (
            <div className="w-full max-w-sm rounded-xl border border-indigo-200 bg-white p-4 shadow-xl shadow-slate-300/50">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />

                <span className="text-xs font-medium text-indigo-600">
                  Đang di chuyển công việc
                </span>
              </div>

              <p className="break-words font-semibold text-slate-800">
                {activeTask.title}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Người thực hiện:{' '}
                {activeTask.assignee?.name || 'Chưa giao'}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}