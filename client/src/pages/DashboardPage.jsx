import { Link } from "react-router-dom";
import { useApi } from "../useApi.js";
import { Empty, ErrorBox, Loading, ProgressBar, formatDateTime, PRIORITY_LABEL, STATUS_LABEL } from "../components/Common.jsx";

const CARDS = [
  { key: "total", label: "Tổng số việc", color: "text-gray-900", bar: "bg-gray-400" },
  { key: "inProgress", label: "Đang làm", color: "text-brand-600", bar: "bg-brand-500" },
  { key: "done", label: "Hoàn thành", color: "text-green-600", bar: "bg-green-500" },
  { key: "overdue", label: "Quá hạn", color: "text-red-600", bar: "bg-red-500" },
];

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function StatCards() {
  const { data, loading, error, reload } = useApi("/stats/dashboard");
  if (loading) return <Loading text="Đang tải số liệu..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map((c) => (
        <div key={c.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={`h-1 ${c.bar}`} />
          <div className="p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`mt-1 text-3xl font-extrabold ${c.color}`}>{data[c.key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentProjects() {
  const { data, loading, error, reload } = useApi("/stats/recent-projects");
  return (
    <Section title="Dự án gần đây">
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <Empty>Bạn chưa tham gia dự án nào.</Empty>}
      {data && data.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {data.map((p) => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}`} className="block rounded-md px-2 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-semibold text-brand-700">{p.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {p.doneCount}/{p.taskCount} việc
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar percent={p.completionPercent} />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-gray-600">{p.completionPercent}%</span>
                </div>
                {p.overdueCount > 0 && <p className="mt-1 text-xs font-medium text-red-600">{p.overdueCount} việc quá hạn</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function UpcomingTasks() {
  const { data, loading, error, reload } = useApi("/stats/upcoming-tasks");
  return (
    <Section title="Việc sắp đến hạn (trong 48 giờ)">
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <Empty>Không có việc nào sắp đến hạn. Tuyệt vời!</Empty>}
      {data && data.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {data.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3 px-2 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{t.title}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  <Link to={`/projects/${t.project.id}`} className="hover:underline">
                    {t.project.name}
                  </Link>
                  {" · "}
                  {STATUS_LABEL[t.status]} · Ưu tiên {PRIORITY_LABEL[t.priority].toLowerCase()}
                </p>
              </div>
              <span className="shrink-0 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Hạn {formatDateTime(t.dueDate)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// Trang chủ sau khi đăng nhập: bảng điều khiển
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
      <StatCards />
      <div className="grid gap-5 lg:grid-cols-2">
        <RecentProjects />
        <UpcomingTasks />
      </div>
    </div>
  );
}
