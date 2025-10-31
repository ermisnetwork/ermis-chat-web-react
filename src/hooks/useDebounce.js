import { useCallback, useRef } from 'react';

/**
 * Custom hook để debounce một function
 * @param {Function} callback - Function cần debounce
 * @param {number} delay - Thời gian delay (ms)
 * @returns {Function} - Debounced function
 */
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
};

export default useDebounce;
