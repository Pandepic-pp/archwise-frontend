import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseTimerResult {
  elapsed: number;
  remaining: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
}

export function useTimer(
  totalSeconds: number = 0,
  initialElapsed: number = 0,
  onWarn5Min?: () => void,
  onWarn1Min?: () => void,
): UseTimerResult {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onWarn5Ref = useRef(onWarn5Min);
  const onWarn1Ref = useRef(onWarn1Min);
  onWarn5Ref.current = onWarn5Min;
  onWarn1Ref.current = onWarn1Min;
  // Pre-mark warnings as fired if initial state is already past their threshold
  const warn5Fired = useRef(Math.max(0, totalSeconds - initialElapsed) <= 300);
  const warn1Fired = useRef(Math.max(0, totalSeconds - initialElapsed) <= 60);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          const remaining = Math.max(0, totalSeconds - next);
          if (!warn5Fired.current && remaining <= 300) {
            warn5Fired.current = true;
            onWarn5Ref.current?.();
          }
          if (!warn1Fired.current && remaining <= 60) {
            warn1Fired.current = true;
            onWarn1Ref.current?.();
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalSeconds]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
  }, []);

  const remaining = Math.max(0, totalSeconds - elapsed);

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return { elapsed, remaining, isRunning, start, pause, reset, formatTime };
}

/** Countdown-only hook (for follow-up read timer) */
export function useCountdown(seconds: number, onExpire?: () => void): {
  remaining: number;
  isExpired: boolean;
  start: () => void;
} {
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const start = useCallback(() => {
    setRemaining(seconds);
    setIsRunning(true);
  }, [seconds]);

  return useMemo(() => ({
    remaining,
    isExpired: remaining === 0,
    start,
  }), [remaining, start]);
}
