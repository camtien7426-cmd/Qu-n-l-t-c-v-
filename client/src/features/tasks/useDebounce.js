import { useState, useEffect } from 'react';

// Trả về `value` sau khi người dùng ngừng gõ `delay` ms,
// để không gọi API mỗi lần bấm một phím.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // gõ tiếp thì hủy hẹn giờ cũ
  }, [value, delay]);

  return debounced;
}