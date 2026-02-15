'use client';

import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Play, Pause, X, Clock } from 'lucide-react';

export function RestTimer() {
  const { restTimer, workoutSettings, startRestTimer, pauseRestTimer, resumeRestTimer, stopRestTimer, tickRestTimer } = useWorkoutStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tick the timer every second
  useEffect(() => {
    if (!restTimer.isActive) return;

    const interval = setInterval(() => {
      tickRestTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isActive, tickRestTimer]);

  // Play sound when timer reaches 0
  useEffect(() => {
    if (restTimer.seconds === 0 && workoutSettings.restTimerSound) {
      // Play beep sound (browser default)
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Fallback to vibration if sound fails
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        });
      }
      // Also vibrate on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [restTimer.seconds, workoutSettings.restTimerSound]);

  // Don't show if timer has never been started
  if (restTimer.seconds === 0 && !restTimer.isActive && restTimer.startedAt === null) {
    return null;
  }

  const progress = (restTimer.seconds / restTimer.targetSeconds) * 100;
  const minutes = Math.floor(restTimer.seconds / 60);
  const seconds = restTimer.seconds % 60;
  const isFinished = restTimer.seconds === 0;

  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      {/* Audio element for beep sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2W86+ahUhEKUKXi8LdjHAU2kNbyzHkrBSp6yfPejj0IEV+16+ylUxEJTaLh8rtvIQUqgM3y2ogzBxllu+voo1IRA06i4fK7bhkFKn/M8tuHMQcacLvs6KFREgxNn+Dyu24ZBSh+zfLaiTIHGm+66+ihUBMMTp/h8rptGAUngMzy2YgwBxtwuuznoksSC06g4fK6bRkFJ4DN8tmHLwcdbLvs56JKEQ1PouDyuW0YBSd/y/LYiC4HHm267Oah" type="audio/wav" />
      </audio>

      {/* Floating Rest Timer Overlay */}
      <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className={`card-elevated p-4 sm:p-6 ${isFinished ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-white dark:bg-slate-800'}`}>
          <div className="flex flex-col items-center gap-4">
            {/* Close button */}
            <button
              onClick={stopRestTimer}
              className="absolute top-2 right-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Timer schließen"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Circular Timer Display */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg className="transform -rotate-90 w-full h-full">
                {/* Background circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="54"
                  className={isFinished ? 'stroke-white/30' : 'stroke-slate-200 dark:stroke-slate-700'}
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="54"
                  className={isFinished ? 'stroke-white' : 'stroke-gradient-500'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>

              {/* Timer text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isFinished ? (
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">Fertig!</div>
                    <div className="text-sm opacity-90">Bereit für nächsten Satz</div>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl sm:text-4xl font-bold font-mono">
                      {minutes}:{seconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pause
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Control buttons */}
            {!isFinished && (
              <div className="flex items-center gap-2">
                {restTimer.isActive ? (
                  <button
                    onClick={pauseRestTimer}
                    className="btn-icon bg-orange-500 hover:bg-orange-600 text-white"
                    aria-label="Timer pausieren"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={resumeRestTimer}
                    className="btn-icon bg-green-500 hover:bg-green-600 text-white"
                    aria-label="Timer fortsetzen"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Quick time adjustment buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => startRestTimer(60)}
                className="btn-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs"
              >
                60s
              </button>
              <button
                onClick={() => startRestTimer(90)}
                className="btn-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs"
              >
                90s
              </button>
              <button
                onClick={() => startRestTimer(120)}
                className="btn-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs"
              >
                2m
              </button>
              <button
                onClick={() => startRestTimer(180)}
                className="btn-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs"
              >
                3m
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
