'use client';

import { WeakPointAnalysis } from '@/lib/coachingEngine';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface WeakPointCardProps {
  weakPoints: WeakPointAnalysis[];
}

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'Untrainiert' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', label: 'Zu wenig' },
  mild: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', label: 'Optimierbar' },
};

export function WeakPointCard({ weakPoints }: WeakPointCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (weakPoints.length === 0) return null;

  const criticalCount = weakPoints.filter(w => w.severity === 'critical').length;
  const warningCount = weakPoints.filter(w => w.severity === 'warning').length;

  return (
    <div className="card-neon p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-400/10 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <h3 className="font-bold text-sm text-[hsl(var(--fg-primary))]">Schwachstellen</h3>
        </div>
        <div className="flex gap-1.5">
          {criticalCount > 0 && (
            <span className="chip chip-error text-[10px]">{criticalCount} kritisch</span>
          )}
          {warningCount > 0 && (
            <span className="chip chip-warning text-[10px]">{warningCount} niedrig</span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {weakPoints.slice(0, 6).map(wp => {
          const config = severityConfig[wp.severity];
          const isExpanded = expanded === wp.muscle;
          const fillPercent = Math.min((wp.weeklyVolume / wp.recommendedVolume) * 100, 100);

          return (
            <div key={wp.muscle}>
              <button
                onClick={() => setExpanded(isExpanded ? null : wp.muscle)}
                className={`w-full rounded-xl ${config.bg} border ${config.border} p-3 text-left transition-all hover:brightness-110 active:scale-[0.99]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${config.color}`}>{wp.muscleName}</span>
                    <span className="text-[10px] text-[hsl(var(--fg-subtle))]">
                      {wp.weeklyVolume}/{wp.recommendedVolume} Sätze
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-medium ${config.color}`}>-{wp.deficit} Sätze</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--fg-subtle))]" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--fg-subtle))]" />
                    )}
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="mt-2 h-1 rounded-full bg-[hsl(225,12%,16%)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      wp.severity === 'critical' ? 'bg-red-400' : wp.severity === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </button>

              {/* Expanded exercises */}
              {isExpanded && (
                <div className="mt-1 ml-3 space-y-1 animate-slide-up">
                  <p className="text-[10px] font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wider mb-1">
                    Empfohlene Übungen
                  </p>
                  {wp.suggestedExercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-[hsl(225,12%,13%)] px-3 py-2">
                      <span className="text-xs font-medium text-[hsl(var(--fg-secondary))]">{ex.name}</span>
                      <span className="text-[10px] text-[hsl(var(--fg-muted))]">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
