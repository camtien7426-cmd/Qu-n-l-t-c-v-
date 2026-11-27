import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Không tìm thấy trang</h1>
      <p className="mt-2 text-slate-500">Đường dẫn bạn truy cập không tồn tại hoặc đã bị đổi.</p>
      <Link to="/" className="mt-8 inline-flex rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700">
        Về trang chủ
      </Link>
    </div>
  );
}
