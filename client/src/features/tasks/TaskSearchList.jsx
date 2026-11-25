import { useState, useEffect } from 'react';
import TaskSearchBox from './TaskSearchBox.jsx';
import { useDebounce } from './useDebounce.js';

// `loadTasks(projectId, { q })` là hàm gọi API, trả về mảng công việc.
// Truyền từ ngoài vào để sau này nối với api.js của Người 2 mà không sửa file này.
export default function TaskSearchList({ projectId, loadTasks }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    let ignore = false; // bỏ kết quả cũ nếu người dùng đã gõ từ khóa mới

    setLoading(true);
    setError('');
    loadTasks(projectId, { q: debouncedSearch })
      .then((data) => {
        if (!ignore) setTasks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Không tải được danh sách công việc!');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [projectId, debouncedSearch, loadTasks]);

  return (
    <div>
      <div className="mb-4">
        <TaskSearchBox value={search} onChange={setSearch} />
      </div>

      {loading && <p className="text-gray-500">Đang tải...</p>}

      {!loading && error && <p className="text-red-600">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p className="text-gray-500">
          {debouncedSearch
            ? `Không tìm thấy công việc nào khớp với "${debouncedSearch}".`
            : 'Dự án này chưa có công việc nào.'}
        </p>
      )}

      {!loading && !error && tasks.length > 0 && (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="border p-3 rounded bg-white">
              {t.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}