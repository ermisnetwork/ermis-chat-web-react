import { useEffect, useState } from 'react';

export default function useFaviconBadge(unreadChannels) {
  const [visible, setVisible] = useState(true);
  const defaultFavicon = '/favicon.ico'; // Thay bằng favicon gốc
  const badgeFavicon = '/favicon-dot.ico'; // Thay bằng favicon có chấm đỏ

  useEffect(() => {
    if (unreadChannels) {
      const favicon = document.querySelector("link[rel='icon']");
      if (!favicon) return;

      // Cập nhật favicon dựa vào `unreadChannels` và trạng thái nhấp nháy
      favicon.href = unreadChannels.length > 0 && visible ? badgeFavicon : defaultFavicon;
      favicon.type = 'image/x-icon';
    }
  }, [unreadChannels, visible]);

  // Hiệu ứng nhấp nháy với tốc độ tùy chỉnh
  useEffect(() => {
    if (unreadChannels && unreadChannels.length === 0) return;

    const interval = setInterval(() => {
      setVisible(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, [unreadChannels]);
}
