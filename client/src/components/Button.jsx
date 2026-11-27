import Spinner from "./Spinner.jsx";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-glow hover:bg-brand-700 focus-visible:ring-brand-500/40 disabled:shadow-none",
  secondary:
    "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400/30",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500/40",
  ghost:
    "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400/30",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  full = false,
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${full ? "w-full" : ""} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
