import { Link } from "react-router-dom";
import { APP_NAME } from "../config/constants.js";

const FEATURES = [
  { title: "Quản lý dự án nhóm", text: "Tạo dự án, mời thành viên và phân quyền trưởng nhóm rõ ràng." },
  { title: "Theo dõi công việc", text: "Giao việc, đặt hạn, đổi trạng thái và bình luận ngay trên từng công việc." },
  { title: "Thống kê trực quan", text: "Biểu đồ trạng thái, tỷ lệ hoàn thành và việc quá hạn trong một màn hình." },
];

// Trang giới thiệu cho khách chưa đăng nhập
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="text-xl font-bold text-brand-600">{APP_NAME}</span>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
            Đăng nhập
          </Link>
          <Link to="/register" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Đăng ký
          </Link>
        </nav>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Quản lý công việc nhóm, gọn gàng và rõ ràng</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-600 sm:text-lg">
            {APP_NAME} giúp sinh viên và nhóm nhỏ chia việc, theo dõi tiến độ và không bỏ lỡ hạn nộp.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="w-full rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-brand-700 sm:w-auto">
              Đăng ký miễn phí
            </Link>
            <Link to="/login" className="w-full rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto">
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{f.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} {APP_NAME}</footer>
    </div>
  );
}
