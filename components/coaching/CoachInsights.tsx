'use client';

import { useRouter } from 'next/navigation';
import { CoachInsight, CoachingPriority } from '@/lib/coachingEngine';
import { ChevronRight, Trophy, Brain, AlertTriangle, TrendingUp, Info, CheckCircle, Flame, Target, Siren } from 'lucide-react';

interface CoachInsightsProps {
  insights: CoachInsight[];
  maxShow?: number;
}

const priorityStyles: Record<CoachingPriority, string> = {
  critical: 'coach-card coach-card-critical',
  high: 'coach-card coach-card-high',
  medium: 'coach-card coach-card-medium',
  low: 'coach-card',
  positive: 'coach-card coach-card-positive',
};

const iconMap: Record<string, React.ReactNode> = {
  '🏆': <Trophy className="w-4 h-4" />,
  '🧠': <Brain className="w-4 h-4" />,
  '⚠️': <AlertTriangle className="w-4 h-4" />,
  '🚨': <Siren className="w-4 h-4" />,
  '🔥': <Flame className="w-4 h-4" />,
  '🎯': <Target className="w-4 h-4" />,
  '📈': <TrendingUp className="w-4 h-4" />,
  '✅': <CheckCircle className="w-4 h-4" />,
};

function resolveIcon(icon?: string) {
  return icon && iconMap[icon] ? iconMap[icon] : <Info className="w-4 h-4" />;
}

export function CoachInsights({ insights, maxShow = 4 }: CoachInsightsProps) {
  const router = useRouter();
  const shown = insights.slice(0, maxShow);

  if (shown.length === 0) {
    return (
      <div className="card-neon p-5 text-center">
        <div className="flex justify-center mb-2"><Trophy className="w-6 h-6 text-emerald-400" /></div>
        <p className="font-semibold text-[hsl(var(--fg-primary))]">Alles im Griff!</p>
        <p className="text-xs text-[hsl(var(--fg-muted))] mt-1">
          Dein Coach hat gerade keine Empfehlungen. Weiter so!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <h3 className="font-bold text-sm text-[hsl(var(--fg-primary))]">Dein Coach sagt</h3>
        {insights.length > maxShow && (
          <span className="ml-auto text-[10px] text-[hsl(var(--fg-muted))]">
            +{insights.length - maxShow} mehr
          </span>
        )}
      </div>

      {shown.map((insight) => (
        <button
          key={insight.id}
          onClick={() => insight.actionRoute && router.push(insight.actionRoute)}
          className={`${priorityStyles[insight.priority]} w-full text-left transition-all hover:scale-[1.01] active:scale-[0.99]`}
        >
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5">{resolveIcon(insight.icon)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[hsl(var(--fg-primary))]">{insight.title}</p>
              <p className="text-xs text-[hsl(var(--fg-muted))] mt-0.5 line-clamp-2">{insight.message}</p>
            </div>
            {insight.actionRoute && (
              <ChevronRight className="w-4 h-4 text-[hsl(var(--fg-subtle))] shrink-0 mt-1" />
            )}
          </div>
          {insight.actionLabel && (
            <div className="mt-2 ml-8">
              <span className="text-[10px] font-semibold text-[hsl(var(--primary))] uppercase tracking-wider">
                {insight.actionLabel} →
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
