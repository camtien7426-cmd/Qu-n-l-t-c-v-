import { AlertIcon, CheckCircleIcon, InfoIcon } from "./Icons.jsx";

const STYLES = {
  error: { box: "border-rose-200 bg-rose-50 text-rose-800", icon: AlertIcon, color: "text-rose-500" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircleIcon, color: "text-emerald-500" },
  info: { box: "border-brand-200 bg-brand-50 text-brand-900", icon: InfoIcon, color: "text-brand-500" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: AlertIcon, color: "text-amber-500" },
};

export default function Alert({ type = "info", children, className = "" }) {
  if (!children) return null;
  const { box, icon: IconComp, color } = STYLES[type];
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${box} ${className}`}
    >
      <IconComp className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
