import { Link } from "react-router-dom";

// Trang giữ chỗ cho phần của thành viên khác (để các liên kết không bị 404 trước khi gộp code).
export default function PlaceholderPage({ title, owner }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">Trang này đang được phát triển{owner ? ` (${owner})` : ""}.</p>
      <Link to="/" className="mt-5 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        Về trang chủ
      </Link>
    </div>
  );
}
