export default function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Trạng thái "đang tải" cho cả màn hình hoặc một khối
export function LoadingBlock({ text = "Đang tải..." }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner className="h-8 w-8 text-brand-600" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <LoadingBlock text="Đang kiểm tra phiên đăng nhập..." />
    </div>
  );
}
