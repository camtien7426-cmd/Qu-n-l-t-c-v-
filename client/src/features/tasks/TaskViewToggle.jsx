
const VIEW_OPTIONS = [
  { value: 'list', label: 'Danh sách' },
  { value: 'kanban', label: 'Kanban' },
];

/** Nút chuyển giữa dạng danh sách và dạng Kanban. */
export default function TaskViewToggle({ view, onChange }) {
  return (
    <div
      className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-100 p-1"
      aria-label="Chọn kiểu hiển thị công việc"
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = view === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
            }`}
          >
            {option.value === 'list' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 6h13" />
                <path d="M8 12h13" />
                <path d="M8 18h13" />
                <path d="M3 6h.01" />
                <path d="M3 12h.01" />
                <path d="M3 18h.01" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="5" height="16" rx="1" />
                <rect x="10" y="4" width="5" height="10" rx="1" />
                <rect x="17" y="4" width="5" height="13" rx="1" />
              </svg>
            )}

            {option.label}
          </button>
        );
      })}
    </div>
  );
}
