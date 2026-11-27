import { useState } from "react";

const SIZES = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-28 w-28 text-4xl",
};

// Mỗi người có một màu nền cố định theo tên
const GRADIENTS = [
  "from-brand-400 to-brand-700",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
  "from-violet-400 to-purple-600",
  "from-sky-400 to-cyan-600",
];

// Chữ cái đầu của TÊN (từ cuối cùng), ví dụ "Nguyễn Thị Cẩm Tiên" -> "T"
export function getInitial(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] || "?";
  return last.charAt(0).toLocaleUpperCase("vi-VN");
}

function gradientFor(name = "") {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

// Có ảnh thì hiện ảnh; chưa có (hoặc ảnh lỗi) thì hiện chữ cái đầu của tên
export default function Avatar({ name, src, size = "md", className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white ring-2 ring-white ${SIZES[size]} ${showImage ? "bg-slate-200" : `bg-gradient-to-br ${gradientFor(name)}`} ${className}`}
      role="img"
      aria-label={`Ảnh đại diện của ${name || "người dùng"}`}
    >
      {showImage ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        <span aria-hidden="true">{getInitial(name)}</span>
      )}
    </span>
  );
}
