import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 1024; // Example breakpoint

export function useDeviceDetection() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Ensure window is defined (client-side)
    if (typeof window !== 'undefined') {
      checkDevice(); // Initial check
      window.addEventListener('resize', checkDevice);
      return () => window.removeEventListener('resize', checkDevice);
    }
  }, []);

  return { isDesktop };
}