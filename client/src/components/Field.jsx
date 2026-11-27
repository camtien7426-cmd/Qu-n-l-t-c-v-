import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons.jsx";

// Ô nhập có nhãn, biểu tượng bên trái và dòng báo lỗi bên dưới.
export function TextField({ label, icon: IconComp, error, hint, className = "", ...props }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        {IconComp && (
          <IconComp className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`input ${IconComp ? "pl-11" : ""} ${error ? "input-error" : ""}`}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Ô mật khẩu có nút hiện / ẩn
export function PasswordField({ label, error, hint, className = "", ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        >
          <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`input pl-11 pr-12 ${error ? "input-error" : ""}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        >
          {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
