'use client';

import { useMemo } from 'react';
import { MomentumData } from '@/lib/coachingEngine';
import { TrendingUp, TrendingDown, Minus, Flame, Zap } from 'lucide-react';

interface MomentumScoreProps {
  data: MomentumData;
}

export function MomentumScore({ data }: MomentumScoreProps) {
  const { score, trend, streak, factors, weeklyChange, message } = data;

  const ringColor = useMemo(() => {
    if (score >= 75) return { stroke: 'stroke-emerald-400', glow: 'drop-shadow(0 0 8px rgba(52,211,153,0.4))' };
    if (score >= 50) return { stroke: 'stroke-cyan-400', glow: 'drop-shadow(0 0 8px rgba(34,211,238,0.4))' };
    if (score >= 25) return { stroke: 'stroke-amber-400', glow: 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' };
    return { stroke: 'stroke-red-400', glow: 'drop-shadow(0 0 8px rgba(248,113,113,0.4))' };
  }, [score]);

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  const TrendIcon = trend === 'rising' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;
  const trendColor = trend === 'rising' ? 'text-emerald-400' : trend === 'declining' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="card-neon p-5">
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96" style={{ filter: ringColor.glow }}>
            <circle cx="48" cy="48" r="42" fill="none" strokeWidth="6" className="stroke-[hsl(225,12%,16%)]" />
            <circle
              cx="48" cy="48" r="42" fill="none" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${ringColor.stroke} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-[hsl(var(--fg-primary))]">{score}</span>
            <span className="text-[10px] font-medium text-[hsl(var(--fg-muted))]">Momentum</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-[hsl(var(--fg-primary))]">Momentum Score</h3>
            <div className={`flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">
                {weeklyChange > 0 ? '+' : ''}{weeklyChange}
              </span>
            </div>
          </div>
          <p className="text-xs text-[hsl(var(--fg-muted))] mb-3 line-clamp-2">{message}</p>
          
          {/* Factor bars */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Konsistenz', value: factors.consistency, max: 25, color: 'bg-cyan-400' },
              { label: 'Fortschritt', value: factors.progression, max: 25, color: 'bg-violet-400' },
              { label: 'Ernährung', value: factors.nutrition, max: 25, color: 'bg-amber-400' },
              { label: 'Erholung', value: factors.recovery, max: 25, color: 'bg-emerald-400' },
            ].map(f => (
              <div key={f.label}>
                <div className="h-1.5 rounded-full bg-[hsl(225,12%,16%)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.color} transition-all duration-700`}
                    style={{ width: `${(f.value / f.max) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] text-[hsl(var(--fg-subtle))] mt-0.5 text-center truncate">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="mt-3 pt-3 border-t border-[hsl(225,10%,16%)] flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-[hsl(var(--fg-secondary))]">
            {streak} {streak === 1 ? 'Woche' : 'Wochen'} Streak
          </span>
          {streak >= 4 && <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse-soft" />}
        </div>
      )}
    </div>
  );
}
