import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Returns true when window width is <= 768px.
 * Includes resize listener for orientation changes.
 */
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId = null;

    const handleResize = () => {
      // Debounce resize events
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= breakpoint);
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // Check on mount in case SSR value differs
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
