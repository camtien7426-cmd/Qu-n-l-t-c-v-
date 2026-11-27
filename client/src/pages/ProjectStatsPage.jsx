import { Link, useParams } from "react-router-dom";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useApi } from "../useApi.js";
import { Avatar, Empty, ErrorBox, Loading, ProgressBar, formatDate } from "../components/Common.jsx";

const PIE = [
  { key: "TODO", name: "Chưa thực hiện", color: "#9ca3af" },
  { key: "IN_PROGRESS", name: "Đang thực hiện", color: "#3b82f6" },
  { key: "DONE", name: "Hoàn thành", color: "#22c55e" },
];

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function OverviewCards({ stats }) {
  const pieData = PIE.map((s) => ({ name: s.name, value: stats.byStatus[s.key], color: s.color })).filter((d) => d.value > 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Công việc theo trạng thái">
        {stats.total === 0 ? (
          <Empty>Dự án chưa có công việc nào để thống kê.</Empty>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={2} label={({ value }) => value}>
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} việc`, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="space-y-5">
        <Card title="Tỷ lệ hoàn thành">
          <div className="flex items-end justify-between">
            <span className="text-4xl font-extrabold text-brand-600">{stats.completionPercent}%</span>
            <span className="text-sm text-gray-500">
              {stats.byStatus.DONE}/{stats.total} việc hoàn thành
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar percent={stats.completionPercent} />
          </div>
        </Card>
        <Card title="Việc quá hạn">
          <p className={`text-4xl font-extrabold ${stats.overdue > 0 ? "text-red-600" : "text-green-600"}`}>{stats.overdue}</p>
          <p className="mt-1 text-sm text-gray-500">{stats.overdue > 0 ? "Việc đã qua hạn mà chưa hoàn thành." : "Không có việc nào quá hạn."}</p>
        </Card>
      </div>
    </div>
  );
}

// Tiến độ từng thành viên: chỉ trưởng nhóm xem; không tính công việc con
function MemberProgress({ projectId }) {
  const { data, loading, error, reload } = useApi(`/stats/projects/${projectId}/members`);
  return (
    <Card title="Tiến độ từng thành viên">
      <p className="mb-3 text-xs text-gray-500">Chỉ trưởng nhóm xem được. Tính theo công việc chính được giao, không tính công việc con.</p>
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <Empty>Dự án chưa có thành viên.</Empty>}
      {data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-2 pr-3 font-semibold">Thành viên</th>
                <th className="px-2 py-2 text-center font-semibold">Được giao</th>
                <th className="px-2 py-2 text-center font-semibold">Đang làm</th>
                <th className="px-2 py-2 text-center font-semibold">Hoàn thành</th>
                <th className="px-2 py-2 text-center font-semibold">Quá hạn</th>
                <th className="w-44 py-2 pl-3 font-semibold">Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((m) => (
                <tr key={m.user.id}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={m.user.name} src={m.user.avatarUrl} size={28} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{m.user.name}</p>
                        <p className="text-xs text-gray-500">{m.role === "LEADER" ? "Trưởng nhóm" : "Thành viên"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">{m.total}</td>
                  <td className="px-2 py-3 text-center">{m.inProgress}</td>
                  <td className="px-2 py-3 text-center text-green-700">{m.done}</td>
                  <td className={`px-2 py-3 text-center ${m.overdue > 0 ? "font-semibold text-red-600" : ""}`}>{m.overdue}</td>
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar percent={m.completionPercent} />
                      </div>
                      <span className="w-9 text-right text-xs font-medium text-gray-600">{m.completionPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// Thống kê một dự án: biểu đồ tròn, thanh tỷ lệ hoàn thành, số việc quá hạn, tiến độ thành viên
export default function ProjectStatsPage() {
  const { projectId } = useParams();
  const { data, loading, error, reload } = useApi(`/stats/projects/${projectId}`);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <nav className="text-sm text-gray-500">
        <Link to="/" className="hover:underline">
          Bảng điều khiển
        </Link>
        {" / "}
        <span>Thống kê dự án</span>
      </nav>

      {loading && <Loading text="Đang tải thống kê..." />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.project.name}</h1>
            {data.project.deadline && <p className="mt-1 text-sm text-gray-500">Hạn dự án: {formatDate(data.project.deadline)}</p>}
          </div>
          <OverviewCards stats={data} />
          {data.myRole === "LEADER" && <MemberProgress projectId={projectId} />}
        </>
      )}
    </div>
  );
}
