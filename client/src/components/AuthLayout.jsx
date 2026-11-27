import Logo from "./Logo.jsx";
import { APP_NAME } from "../config/constants.js";
import { CheckIcon } from "./Icons.jsx";

const FEATURES = [
  "Chia dự án thành công việc và công việc con",
  "Giao việc cho từng thành viên, theo dõi hạn chót",
  "Bình luận và nhận thông báo ngay trong nhóm",
];

// Khung chung cho các trang đăng nhập / đăng ký / quên mật khẩu:
// bên trái là phần giới thiệu (ẩn trên điện thoại), bên phải là biểu mẫu.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Cột giới thiệu */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Làm việc nhóm gọn gàng, <span className="text-brand-200">không bỏ sót việc nào.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((text) => (
              <li key={text} className="flex items-start gap-3 text-brand-50">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>

          {/* Thẻ minh họa bảng công việc */}
          <div className="mt-10 w-72 animate-float rounded-2xl bg-white/95 p-4 text-slate-800 shadow-2xl" aria-hidden="true">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Thiết kế trang đăng nhập</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-600">Cao</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>3/4 công việc con</span>
              <span>Hạn 27/11</span>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-brand-200">© {new Date().getFullYear()} {APP_NAME} · Đồ án môn Lập trình Web</p>
      </aside>

      {/* Cột biểu mẫu */}
      <main className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="card p-7 sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
            </div>
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}