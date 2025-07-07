import { useEffect, useState } from 'react';
import { Snackbar, Alert, Button, Stack } from '@mui/material';
import { LocalStorageKey } from '../constants/localStorage-const';

function AutoUpdate() {
  const [open, setOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  useEffect(() => {
    const storedVersion = window.localStorage.getItem(LocalStorageKey.AppVersion);

    const checkForUpdate = async () => {
      try {
        const response = await fetch('/version.json?t=' + new Date().getTime()); // Tránh cache
        const data = await response.json();

        // Chỉ hiển thị thông báo nếu có phiên bản mới
        if (storedVersion && storedVersion !== data.version) {
          setNewVersion(data.version);
          setOpen(true); // Hiển thị thông báo
        }

        // Lưu phiên bản mới vào localStorage
        window.localStorage.setItem(LocalStorageKey.AppVersion, data.version);
      } catch (error) {
        console.error('⚠️ Lỗi khi lấy version.json:', error);
      }
    };

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 300000); // Kiểm tra mỗi 5 phút

    return () => clearInterval(interval);
  }, []);

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }} // Góc trên bên trái
      autoHideDuration={null} // Không tự động ẩn
      sx={{ top: '0px !important', left: '100px !important' }}
    >
      <Alert severity="info">
        🚀 A new version ({newVersion}) is available!
        <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: '10px' }}>
          {' '}
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => window.location.reload()}
            sx={{ textTransform: 'initial' }}
          >
            Refresh Now
          </Button>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

export default AutoUpdate;
