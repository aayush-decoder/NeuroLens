import { useCallback, useRef, useState } from 'react';

export function useScrollVelocity() {
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const [velocity, setVelocity] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    const now = Date.now();
    const currentY = window.scrollY;
    const dt = now - lastScrollTime.current;

    if (dt > 0) {
      const v = Math.abs(currentY - lastScrollY.current) / dt;
      setVelocity(v);
    }

    lastScrollY.current = currentY;
    lastScrollTime.current = now;
    setIsScrolling(true);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
      setIsScrolling(false);
      setVelocity(0);
    }, 500);
  }, []);

  return { velocity, isScrolling, handleScroll };
}
