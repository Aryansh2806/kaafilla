import { useCallback, useEffect, useRef, useState } from 'react';

// Counts down from `seconds`; exposes mm:ss, expired flag, and reset (resend).
export function useOTPTimer(seconds = 60) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setLeft(seconds);
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => {
      setLeft((n) => {
        if (n <= 1 && ref.current) clearInterval(ref.current);
        return Math.max(0, n - 1);
      });
    }, 1000);
  }, [seconds]);

  useEffect(() => {
    start();
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [start]);

  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return { left, mmss, expired: left === 0, reset: start };
}
