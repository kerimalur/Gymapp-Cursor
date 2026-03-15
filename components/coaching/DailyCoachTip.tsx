'use client';

import { getDailyCoachTip } from '@/lib/coachingEngine';
import { WorkoutSession } from '@/types';
import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';

interface DailyCoachTipProps {
  workoutSessions: WorkoutSession[];
}

const categoryIcons: Record<string, string> = {
  nutrition: '🥗',
  recovery: '💤',
  motivation: '🔥',
  technique: '🎯',
};

export function DailyCoachTip({ workoutSessions }: DailyCoachTipProps) {
  const tip = useMemo(() => {
    const lastSession = workoutSessions.length > 0
      ? new Date(workoutSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0].startTime)
      : null;
    return getDailyCoachTip(workoutSessions, lastSession);
  }, [workoutSessions]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(225,14%,10%)] to-[hsl(225,14%,12%)] border border-[hsl(225,10%,18%)] p-4">
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-cyan-400/5 to-transparent pointer-events-none" />
      
      <div className="flex items-start gap-3 relative">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-400/20 flex items-center justify-center shrink-0">
          <span className="text-base">{categoryIcons[tip.category] || '💡'}</span>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-wider mb-1">
            Tipp des Tages
          </p>
          <p className="text-sm text-[hsl(var(--fg-secondary))] leading-relaxed">
            {tip.tip}
          </p>
        </div>
      </div>
    </div>
  );
}
