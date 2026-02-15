'use client';

import { useEffect, useState, useCallback } from 'react';

interface CircularTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  size?: number;
  strokeWidth?: number;
  autoStart?: boolean;
  showControls?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary: { stroke: 'stroke-primary-500', bg: 'bg-primary-500/10', text: 'text-primary-600' },
  success: { stroke: 'stroke-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  warning: { stroke: 'stroke-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  danger: { stroke: 'stroke-red-500', bg: 'bg-red-500/10', text: 'text-red-600' },
};

export function CircularTimer({
  duration,
  onComplete,
  size = 200,
  strokeWidth = 8,
  autoStart = true,
  showControls = true,
  color = 'primary',
}: CircularTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = timeLeft / duration;
  const strokeDashoffset = circumference * (1 - progress);

  const colors = colorMap[color];

  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsRunning(false);
    setIsComplete(false);
  }, [duration]);

  const toggle = useCallback(() => {
    if (isComplete) {
      reset();
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  }, [isComplete, isRunning, reset]);

  const addTime = useCallback((seconds: number) => {
    setTimeLeft(prev => Math.max(0, prev + seconds));
  }, []);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsComplete(true);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer Ring */}
      <div 
        className={`circular-timer ${isComplete ? 'animate-success-pop' : ''}`} 
        style={{ width: size, height: size }}
      >
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Circle */}
          <circle
            className="circular-timer-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          {/* Progress Circle */}
          <circle
            className={`circular-timer-progress ${colors.stroke} ${isRunning ? 'animate-timer-pulse' : ''}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: isRunning ? `drop-shadow(0 0 10px currentColor)` : 'none',
            }}
          />
        </svg>
        
        {/* Center Content */}
        <div className="circular-timer-text">
          <span className={`text-4xl font-bold ${colors.text} ${isComplete ? 'animate-success-pop' : ''}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-slate-500 mt-1">
            {isComplete ? '✓ Fertig!' : isRunning ? 'Pause' : 'Bereit'}
          </span>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-3">
          {/* -30s Button */}
          <button
            onClick={() => addTime(-30)}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 
                       font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all 
                       active:scale-95 disabled:opacity-50"
            disabled={timeLeft <= 30}
          >
            -30
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={toggle}
            className={`w-14 h-14 rounded-full ${colors.bg} ${colors.text} 
                       flex items-center justify-center transition-all hover:scale-105 
                       active:scale-95 ripple-effect`}
          >
            {isComplete ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : isRunning ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5.14v14.72a1 1 0 001.5.87l11-7.36a1 1 0 000-1.74l-11-7.36a1 1 0 00-1.5.87z" />
              </svg>
            )}
          </button>

          {/* +30s Button */}
          <button
            onClick={() => addTime(30)}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 
                       font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            +30
          </button>
        </div>
      )}

      {/* Quick Time Buttons */}
      {showControls && (
        <div className="flex items-center gap-2">
          {[60, 90, 120, 180].map((seconds) => (
            <button
              key={seconds}
              onClick={() => {
                setTimeLeft(seconds);
                setIsComplete(false);
                setIsRunning(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95
                         ${timeLeft === seconds && isRunning
                           ? `${colors.bg} ${colors.text}`
                           : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                         }`}
            >
              {seconds < 60 ? `${seconds}s` : `${seconds / 60}min`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Mini version for inline use
export function MiniTimer({ 
  duration, 
  onComplete,
  className = '' 
}: { 
  duration: number; 
  onComplete?: () => void;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const progress = (timeLeft / duration) * 100;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            className="stroke-slate-200 dark:stroke-slate-700"
            fill="none"
            strokeWidth="3"
            cx="16"
            cy="16"
            r="12"
          />
          <circle
            className="stroke-primary-500 transition-all duration-1000"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            cx="16"
            cy="16"
            r="12"
            strokeDasharray={75.4}
            strokeDashoffset={75.4 * (1 - progress / 100)}
          />
        </svg>
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </span>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {isRunning ? (
          <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5.14v14.72a1 1 0 001.5.87l11-7.36a1 1 0 000-1.74l-11-7.36a1 1 0 00-1.5.87z" />
          </svg>
        )}
      </button>
    </div>
  );
}
