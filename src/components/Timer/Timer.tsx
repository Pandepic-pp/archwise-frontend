import { useEffect } from 'react';
import { useTimer } from '../../hooks/useTimer';

interface Props {
  totalMinutes: number;
  /** Seconds already elapsed (restored from DB on refresh) */
  initialElapsedSeconds?: number;
  autoStart?: boolean;
  onExpire?: () => void;
  onWarn5Min?: () => void;
  onWarn1Min?: () => void;
  className?: string;
}

export default function Timer({ totalMinutes, initialElapsedSeconds = 0, autoStart = false, onExpire, onWarn5Min, onWarn1Min, className = '' }: Props) {
  const totalSecs = totalMinutes * 60;
  const { elapsed, remaining, isRunning, start, formatTime } = useTimer(totalSecs, initialElapsedSeconds, onWarn5Min, onWarn1Min);

  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  useEffect(() => {
    if (remaining === 0 && isRunning) onExpire?.();
  }, [remaining, isRunning, onExpire]);

  const pct = totalSecs > 0 ? ((totalSecs - remaining) / totalSecs) * 100 : 0;
  const urgency = remaining < 300 ? 'text-red-400' : remaining < 600 ? 'text-yellow-400' : 'text-green-400';
  const ringColor = remaining < 300 ? 'stroke-red-500' : remaining < 600 ? 'stroke-yellow-500' : 'stroke-green-500';

  const r = 26;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circular progress */}
      <div className="relative h-16 w-16">
        <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1e2640" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            className={`transition-all duration-1000 ${ringColor}`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-mono font-semibold ${urgency}`}>
          {formatTime(remaining)}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wide">Time Remaining</span>
        <span className={`text-lg font-mono font-bold ${urgency}`}>{formatTime(remaining)}</span>
        <span className="text-xs text-gray-600">Elapsed: {formatTime(elapsed)}</span>
      </div>
    </div>
  );
}
