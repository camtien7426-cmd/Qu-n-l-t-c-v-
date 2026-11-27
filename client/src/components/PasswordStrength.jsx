import { passwordScore } from "../utils/validators.js";

const LEVELS = [
  { label: "", bar: "bg-slate-200", text: "text-slate-400" },
  { label: "Yếu", bar: "bg-rose-500", text: "text-rose-600" },
  { label: "Tạm được", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Khá", bar: "bg-lime-500", text: "text-lime-600" },
  { label: "Mạnh", bar: "bg-emerald-500", text: "text-emerald-600" },
];

// Thanh gợi ý độ mạnh mật khẩu 4 nấc
export default function PasswordStrength({ value }) {
  if (!value) return null;
  const score = passwordScore(value);
  const level = LEVELS[score];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= score ? level.bar : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`mt-1 text-xs font-medium ${level.text}`}>Độ mạnh mật khẩu: {level.label}</p>
    </div>
  );
}
