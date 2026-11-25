// Các thành phần nhỏ dùng chung: đang tải / lỗi / không có dữ liệu / avatar / thanh tiến độ
// (quy ước nhóm: mỗi màn hình có đủ 3 trạng thái đang tải, lỗi, không có dữ liệu)

export function Loading({ text = "Đang tải..." }) {
  return (
    <div className="flex items-center gap-3 py-6 text-sm text-gray-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
      {text}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{message || "Có lỗi xảy ra, vui lòng thử lại!"}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded bg-white px-3 py-1 font-medium text-red-700 shadow-sm hover:bg-red-100">
          Thử lại
        </button>
      )}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">{children}</p>;
}

export function Avatar({ name = "?", src, size = 32 }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (src) {
    return <img src={src} alt={name} style={style} className="rounded-full object-cover" />;
  }
  return (
    <span style={style} className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-semibold text-white" aria-label={name}>
      {initial}
    </span>
  );
}

export function ProgressBar({ percent, tone = "brand" }) {
  const value = Math.max(0, Math.min(100, percent));
  const color = tone === "green" || value === 100 ? "bg-green-500" : "bg-brand-600";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN");
}

export const STATUS_LABEL = { TODO: "Chưa thực hiện", IN_PROGRESS: "Đang thực hiện", DONE: "Hoàn thành" };
export const PRIORITY_LABEL = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao" };
