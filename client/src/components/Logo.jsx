import { Link } from "react-router-dom";
import { APP_NAME } from "../config/constants.js";

// Biểu tượng + tên ứng dụng. `light` dùng trên nền tối/gradient.
export function LogoMark({ className = "h-9 w-9" }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow ${className}`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5.5 12.5 4.2 4.2L18.5 8" />
      </svg>
    </span>
  );
}

export default function Logo({ to = "/", light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30">
      <LogoMark />
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>{APP_NAME}</span>
    </Link>
  );
}
