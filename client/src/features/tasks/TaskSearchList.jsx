
import { useState, useEffect, useMemo } from 'react';
import TaskSearchBox from './TaskSearchBox.jsx';
import TaskViewToggle from './TaskViewToggle.jsx';
import KanbanBoard from './KanbanBoard.jsx';
import { useDebounce } from './useDebounce.js';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'Chưa thực hiện' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'DONE', label: 'Hoàn thành' },
];

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'Cao' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'LOW', label: 'Thấp' },
];

const DUE_OPTIONS = [
  { value: '', label: 'Tất cả thời hạn' },
  { value: 'overdue', label: 'Quá hạn' },
  { value: 'today', label: 'Hạn hôm nay' },
  { value: 'next7days', label: 'Trong 7 ngày tới' },
  { value: 'none', label: 'Chưa đặt thời hạn' },
  { value: 'range', label: 'Chọn khoảng ngày...' },
];

const DEFAULT_SORT = 'createdAt:desc';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Mới tạo nhất' },
  { value: 'createdAt:asc', label: 'Cũ nhất' },
  { value: 'dueDate:asc', label: 'Thời hạn gần nhất' },
  { value: 'dueDate:desc', label: 'Thời hạn xa nhất' },
  { value: 'priority:desc', label: 'Ưu tiên cao đến thấp' },
  { value: 'priority:asc', label: 'Ưu tiên thấp đến cao' },
];

const STATUS_LABEL = Object.fromEntries(
  STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

const PRIORITY_LABEL = Object.fromEntries(
  PRIORITY_OPTIONS.map((item) => [item.value, item.label]),
);

const STATUS_STYLE = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  DONE: 'bg-emerald-50 text-emerald-700',
};

const PRIORITY_STYLE = {
  HIGH: 'bg-rose-50 text-rose-600',
  MEDIUM: 'bg-amber-50 text-amber-700',
  LOW: 'bg-emerald-50 text-emerald-700',
};

function normalizeMembers(members) {
  if (!Array.isArray(members)) return [];

  return members
    .map((member) => ({
      id: member.user?.id ?? member.userId ?? member.id,
      name: member.user?.name ?? member.name ?? '',
    }))
    .filter((member) => member.id !== undefined && member.id !== null);
}

function toggleItem(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function formatDate(value) {
  if (!value) return 'Chưa đặt thời hạn';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Chưa đặt thời hạn';

  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
        active
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function FilterSelect({ label, id, value, onChange, children }) {
  return (
    <div className="min-w-0 flex-1">
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {children}
      </select>
    </div>
  );
}

function EmptyState({ filtered }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-400">
        {filtered ? '⌕' : '✓'}
      </div>

      <h3 className="text-base font-semibold text-slate-800">
        {filtered ? 'Không tìm thấy công việc' : 'Chưa có công việc nào'}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {filtered
          ? 'Thử thay đổi từ khóa hoặc bộ lọc để tìm công việc phù hợp.'
          : 'Các công việc của dự án sẽ xuất hiện tại đây.'}
      </p>
    </div>
  );
}

export default function TaskSearchList({
  projectId,
  loadTasks,
  members = [],
  currentUser,
  role,
  changeTaskStatus,
}) {
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [showFilters, setShowFilters] = useState(false);

  const [status, setStatus] = useState([]);
  const [priority, setPriority] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [due, setDue] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState('');

  const memberList = useMemo(
    () => normalizeMembers(members),
    [members],
  );

  const rangeError =
    due === 'range' && dueFrom && dueTo && dueFrom > dueTo
      ? 'Ngày bắt đầu phải trước ngày kết thúc!'
      : '';

  const paramsKey = useMemo(() => {
    const params = {};

    if (debouncedSearch.trim()) {
      params.q = debouncedSearch.trim();
    }

    if (status.length > 0) {
      params.status = status.join(',');
    }

    if (priority.length > 0) {
      params.priority = priority.join(',');
    }

    if (assigneeId) {
      params.assigneeId = assigneeId;
    }

    if (due === 'range') {
      if (dueFrom) params.dueFrom = dueFrom;
      if (dueTo) params.dueTo = dueTo;
    } else if (due) {
      params.due = due;
    }

    if (sort !== DEFAULT_SORT) {
      const [sortBy, order] = sort.split(':');
      params.sortBy = sortBy;
      params.order = order;
    }

    return JSON.stringify(params);
  }, [
    debouncedSearch,
    status,
    priority,
    assigneeId,
    due,
    dueFrom,
    dueTo,
    sort,
  ]);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    if (rangeError) {
      setLoading(false);
      return undefined;
    }

    let ignore = false;

    setLoading(true);
    setError('');

    const params = JSON.parse(paramsKey);

    if (view === 'kanban') {
      params.limit = 100;
    }

    Promise.resolve()
      .then(() => loadTasks(projectId, params))
      .then((data) => {
        if (!ignore) {
          setTasks(Array.isArray(data) ? data : []);
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(
            requestError?.message ||
              'Không tải được danh sách công việc!',
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [projectId, paramsKey, loadTasks, rangeError, view]);

  const activeFilterCount =
    (status.length > 0 ? 1 : 0) +
    (priority.length > 0 ? 1 : 0) +
    (assigneeId ? 1 : 0) +
    (due && (due !== 'range' || dueFrom || dueTo) ? 1 : 0);

  const hasAnyCondition =
    activeFilterCount > 0 || Boolean(debouncedSearch.trim());

  function clearFilters() {
    setStatus([]);
    setPriority([]);
    setAssigneeId('');
    setDue('');
    setDueFrom('');
    setDueTo('');
  }

  function handleDueChange(value) {
    setDue(value);

    if (value !== 'range') {
      setDueFrom('');
      setDueTo('');
    }
  }

  const now = Date.now();

  const todoCount = tasks.filter(
    (task) => task.status === 'TODO',
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === 'IN_PROGRESS',
  ).length;

  const doneCount = tasks.filter(
    (task) => task.status === 'DONE',
  ).length;

  return (
    <div className="space-y-5">
      {/* Thanh công cụ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <TaskSearchBox
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <span className="hidden whitespace-nowrap text-xs font-medium text-slate-500 sm:block">
                Sắp xếp:
              </span>

              <select
                id="task-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:flex-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                showFilters || activeFilterCount > 0
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>☷</span>
              Bộ lọc

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <TaskViewToggle
              view={view}
              onChange={setView}
            />
          </div>
        </div>
      </section>

      {/* Bộ lọc */}
      {showFilters && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-slate-800">
                Bộ lọc công việc
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Tìm công việc theo điều kiện mong muốn.
              </p>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trạng thái
            </p>

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  active={status.includes(option.value)}
                  onClick={() =>
                    setStatus((current) =>
                      toggleItem(current, option.value),
                    )
                  }
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mức độ ưu tiên
            </p>

            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  active={priority.includes(option.value)}
                  onClick={() =>
                    setPriority((current) =>
                      toggleItem(current, option.value),
                    )
                  }
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Người thực hiện"
              id="filter-assignee"
              value={assigneeId}
              onChange={(event) =>
                setAssigneeId(event.target.value)
              }
            >
              <option value="">Tất cả thành viên</option>
              <option value="unassigned">Chưa giao cho ai</option>

              {memberList.map((member) => (
                <option
                  key={member.id}
                  value={String(member.id)}
                >
                  {member.name || `Thành viên #${member.id}`}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Thời hạn"
              id="filter-due"
              value={due}
              onChange={(event) =>
                handleDueChange(event.target.value)
              }
            >
              {DUE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>

            {due === 'range' && (
              <>
                <div>
                  <label
                    htmlFor="filter-due-from"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Từ ngày
                  </label>

                  <input
                    id="filter-due-from"
                    type="date"
                    value={dueFrom}
                    onChange={(event) =>
                      setDueFrom(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-due-to"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Đến ngày
                  </label>

                  <input
                    id="filter-due-to"
                    type="date"
                    value={dueTo}
                    onChange={(event) =>
                      setDueTo(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </>
            )}
          </div>

          {rangeError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {rangeError}
            </p>
          )}
        </section>
      )}

      {/* Thống kê nhanh */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Tổng công việc
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {tasks.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Công việc tìm thấy
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Chưa thực hiện
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-600">
            {todoCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Đang chờ xử lý
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600">
            Đang thực hiện
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {inProgressCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Đang được xử lý
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-emerald-600">
            Hoàn thành
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {doneCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Đã hoàn tất
          </p>
        </div>
      </section>

      {/* Tiêu đề kết quả */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-slate-800">
            {view === 'list' ? 'Danh sách công việc' : 'Bảng Kanban'}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Đang cập nhật dữ liệu...'
              : `${tasks.length} công việc được hiển thị`}
          </p>
        </div>
      </div>

      {/* Đang tải */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            Đang tải công việc...
          </div>
        </div>
      )}

      {/* Lỗi khoảng ngày */}
      {!loading && rangeError && (
        <p className="text-sm text-rose-600">{rangeError}</p>
      )}

      {/* Lỗi tải dữ liệu */}
      {!loading && !rangeError && error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {/* Chế độ Kanban */}
      {!loading && !rangeError && !error && view === 'kanban' && (
        <KanbanBoard
          tasks={tasks}
          onTasksChange={setTasks}
          currentUser={currentUser}
          role={role}
          changeTaskStatus={changeTaskStatus}
        />
      )}

      {/* Không có dữ liệu */}
      {!loading &&
        !rangeError &&
        !error &&
        view === 'list' &&
        tasks.length === 0 && (
          <EmptyState filtered={hasAnyCondition} />
        )}

      {/* Danh sách công việc */}
      {!loading &&
        !rangeError &&
        !error &&
        view === 'list' &&
        tasks.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <div className="col-span-5">Công việc</div>
              <div className="col-span-2">Trạng thái</div>
              <div className="col-span-2">Ưu tiên</div>
              <div className="col-span-3">Thời hạn</div>
            </div>

            <ul className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const dueTime = task.dueDate
                  ? new Date(task.dueDate).getTime()
                  : null;

                const overdue =
                  dueTime != null &&
                  !Number.isNaN(dueTime) &&
                  task.status !== 'DONE' &&
                  dueTime < now;

                return (
                  <li
                    key={task.id}
                    className="grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-4"
                  >
                    <div className="min-w-0 md:col-span-5">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                            task.status === 'DONE'
                              ? 'bg-emerald-500'
                              : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-500'
                                : 'bg-slate-300'
                          }`}
                        />

                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-800">
                            {task.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Người thực hiện:{' '}
                            {task.assignee?.name || 'Chưa giao'}
                          </p>

                          {task.subtaskProgress?.total > 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              Công việc con: {task.subtaskProgress.done || 0}/
                              {task.subtaskProgress.total}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                          STATUS_STYLE[task.status] ||
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_LABEL[task.status] || task.status}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                          PRIORITY_STYLE[task.priority] ||
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {PRIORITY_LABEL[task.priority] ||
                          task.priority ||
                          'Chưa rõ'}
                      </span>
                    </div>

                    <div className="md:col-span-3">
                      <p
                        className={`text-sm ${
                          overdue
                            ? 'font-semibold text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {formatDate(task.dueDate)}

                        {overdue && (
                          <span className="ml-2 text-xs">
                            Quá hạn
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
    </div>
  );
}