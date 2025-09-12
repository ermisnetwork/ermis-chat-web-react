import { useEffect } from 'react';
import { LocalStorageKey } from '../constants/localStorage-const';

function AutoUpdate() {
  useEffect(() => {
    const storedVersion = window.localStorage.getItem(LocalStorageKey.AppVersion);

    const checkForUpdate = async () => {
      try {
        const response = await fetch('/version.json?t=' + new Date().getTime()); // Tránh cache
        const data = await response.json();

        // Nếu có phiên bản mới thì reload lại trang
        if (storedVersion && storedVersion !== data.version) {
          window.localStorage.setItem(LocalStorageKey.AppVersion, data.version);
          window.location.reload();
        } else {
          // Lưu phiên bản hiện tại vào localStorage nếu chưa có
          window.localStorage.setItem(LocalStorageKey.AppVersion, data.version);
        }
      } catch (error) {
        console.error('⚠️ Lỗi khi lấy version.json:', error);
      }
    };

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 300000); // Kiểm tra mỗi 5 phút

    return () => clearInterval(interval);
  }, []);

  // Không cần render gì cả vì sẽ tự động reload khi có phiên bản mới
  return null;
}

export default AutoUpdate;
