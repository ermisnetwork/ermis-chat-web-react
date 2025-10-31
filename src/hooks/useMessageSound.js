import { useCallback, useRef } from 'react';
import { Howl } from 'howler';

const useMessageSound = () => {
  const soundRef = useRef(null);

  // Khởi tạo Howler sound object
  const initializeSound = useCallback(() => {
    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: ['/new_message.mp3'],
        volume: 0.7,
        preload: true,
        onloaderror: (id, error) => {
          console.warn('Không thể load file âm thanh:', error);
        },
        onplayerror: (id, error) => {
          console.warn('Không thể phát âm thanh:', error);
          // Thử phát lại
          soundRef.current?.once('unlock', () => {
            soundRef.current?.play();
          });
        },
      });
    }
  }, []);

  // Phát âm thanh tin nhắn
  const playMessageSoundInternal = useCallback(() => {
    try {
      initializeSound();

      if (soundRef.current) {
        // Dừng âm thanh hiện tại nếu đang phát và phát lại
        if (soundRef.current.playing()) {
          soundRef.current.stop();
        }
        soundRef.current.play();
      }
    } catch (error) {
      console.warn('Lỗi khi phát âm thanh tin nhắn:', error);
    }
  }, [initializeSound]);

  // Phát âm thanh tin nhắn mới (để tương thích với code cũ)
  const playNewMessageSound = useCallback(() => {
    playMessageSoundInternal();
  }, [playMessageSoundInternal]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }
  }, []);

  return {
    playNewMessageSound,
    cleanup,
  };
};

export default useMessageSound;
