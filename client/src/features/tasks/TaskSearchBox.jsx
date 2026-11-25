export default function TaskSearchBox({ value, onChange }) {
  return (
    <div className="relative w-full max-w-xs">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm công việc theo tiêu đề..."
        maxLength={200}
        className="w-full border p-2 pr-8 rounded"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa từ khóa"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          ×
        </button>
      )}
    </div>
  );
}