'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExerciseComparisonChart } from '@/components/statistics/ExerciseComparisonChart';
import { MuscleVolumeStats } from '@/components/statistics/MuscleVolumeStats';
import { GlobalSettingsModal } from '@/components/settings/GlobalSettingsModal';
import { BodyHeatmap } from '@/components/statistics/BodyHeatmap';
import { BodyWeightWidget } from '@/components/dashboard/BodyWeightWidget';
import { isWithinInterval, subDays, subMonths } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

type TimeRange = '7d' | '1m' | '3m' | 'all';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ArrowUpIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FireIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
  </svg>
);

const MuscleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))] tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-[hsl(var(--fg-muted))] mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'emerald' | 'violet' | 'orange' | 'rose';
}

const COLOR_MAP: Record<StatCardProps['color'], { icon: string; trend: string }> = {
  blue:    { icon: 'bg-cyan-400/15 text-cyan-400',    trend: '' },
  emerald: { icon: 'bg-emerald-400/15 text-emerald-400', trend: '' },
  violet:  { icon: 'bg-violet-400/15 text-violet-400', trend: '' },
  orange:  { icon: 'bg-orange-400/15 text-orange-400', trend: '' },
  rose:    { icon: 'bg-rose-400/15 text-rose-400',    trend: '' },
};

function StatCard({ icon, label, value, subValue, trend, trendLabel, color }: StatCardProps) {
  const { icon: iconCls } = COLOR_MAP[color];
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${iconCls}`}>{icon}</div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
          }`}>
            {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(trend)}%
          </div>
        )}
        {trend === 0 && (
          <div className="text-xs font-medium text-[hsl(var(--fg-subtle))] px-2 py-1">—</div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-[hsl(var(--fg-muted))] mb-1">{label}</p>
        <p className="text-2xl font-bold text-[hsl(var(--fg-primary))] leading-none">{value}</p>
        {subValue && <p className="text-xs text-[hsl(var(--fg-subtle))] mt-1.5">{subValue}</p>}
        {trendLabel && (
          <p className={`text-xs font-medium mt-1.5 ${
            isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-[hsl(var(--fg-subtle))]'
          }`}>
            {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Time Range Tabs ──────────────────────────────────────────────────────────

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: '7d',  label: '7 Tage' },
  { key: '1m',  label: '1 Monat' },
  { key: '3m',  label: '3 Monate' },
  { key: 'all', label: 'Alles' },
];

function TimeRangeTabs({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-[hsl(225,12%,13%)] p-1 rounded-xl border border-[hsl(225,10%,16%)]">
      {TIME_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value === opt.key
              ? 'bg-[hsl(225,14%,18%)] text-[hsl(var(--fg-primary))] shadow-sm'
              : 'text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(range: TimeRange, now: Date): { start: Date; end: Date } {
  const end = now;
  switch (range) {
    case '7d':  return { start: subDays(now, 7), end };
    case '1m':  return { start: subMonths(now, 1), end };
    case '3m':  return { start: subMonths(now, 3), end };
    case 'all': return { start: new Date(0), end };
  }
}

function getPrevDateRange(range: TimeRange, now: Date): { start: Date; end: Date } {
  switch (range) {
    case '7d':  return { start: subDays(now, 14), end: subDays(now, 7) };
    case '1m':  return { start: subMonths(now, 2), end: subMonths(now, 1) };
    case '3m':  return { start: subMonths(now, 6), end: subMonths(now, 3) };
    case 'all': return { start: new Date(0), end: new Date(0) };
  }
}

function calcTrend(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { workoutSessions } = useWorkoutStore();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');

  useEffect(() => { setMounted(true); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const curr = getDateRange(timeRange, now);
    const prev = getPrevDateRange(timeRange, now);

    const currSessions = workoutSessions.filter((s) =>
      isWithinInterval(new Date(s.startTime), curr)
    );
    const prevSessions = workoutSessions.filter((s) =>
      isWithinInterval(new Date(s.startTime), prev)
    );

    const sumVolume = (sessions: typeof workoutSessions) =>
      sessions.reduce((sum, s) => sum + s.totalVolume, 0);
    const sumDuration = (sessions: typeof workoutSessions) =>
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const sumSets = (sessions: typeof workoutSessions) => {
      let total = 0;
      sessions.forEach((s) => s.exercises.forEach((ex) => ex.sets.forEach((set) => {
        if (set.completed && set.weight > 0) total++;
      })));
      return total;
    };

    const currVolume   = Math.round(sumVolume(currSessions));
    const prevVolume   = Math.round(sumVolume(prevSessions));
    const currCount    = currSessions.length;
    const prevCount    = prevSessions.length;
    const currSets     = sumSets(currSessions);
    const prevSets     = sumSets(prevSessions);
    const currDurTotal = sumDuration(currSessions);
    const prevDurTotal = sumDuration(prevSessions);
    const currAvgDur   = currCount > 0 ? Math.round(currDurTotal / currCount) : 0;
    const prevAvgDur   = prevCount > 0 ? Math.round(prevDurTotal / prevCount) : 0;

    return {
      volume:    { curr: currVolume,  prev: prevVolume,  trend: calcTrend(currVolume,  prevVolume)  },
      workouts:  { curr: currCount,   prev: prevCount,   trend: calcTrend(currCount,   prevCount)   },
      sets:      { curr: currSets,    prev: prevSets,    trend: calcTrend(currSets,    prevSets)    },
      avgDur:    { curr: currAvgDur,  prev: prevAvgDur,  trend: calcTrend(currAvgDur,  prevAvgDur)  },
    };
  }, [workoutSessions, timeRange]);

  const periodLabel = useMemo(() => {
    const labels: Record<TimeRange, string> = {
      '7d':  'vs. Vorwoche',
      '1m':  'vs. Vormonat',
      '3m':  'vs. 3 Monate davor',
      'all': '',
    };
    return labels[timeRange];
  }, [timeRange]);

  const trendSubLabel = (trend: number) => {
    if (trend === 0 || timeRange === 'all') return undefined;
    return trend > 0 ? `+${trend}% ${periodLabel}` : `${trend}% ${periodLabel}`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--fg-primary))]">Statistiken</h1>
            <p className="text-sm text-[hsl(var(--fg-muted))] mt-0.5">Dein Fortschritt im Überblick</p>
          </div>
          <div className="flex items-center gap-3">
            <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl bg-[hsl(225,12%,15%)] hover:bg-[hsl(225,12%,20%)] text-[hsl(var(--fg-muted))] transition-colors flex-shrink-0"
              title="Einstellungen"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>

        {/* ── Leistung ───────────────────────────────────────────────────── */}
        <section className="mb-8">
          <SectionHeader
            title="Leistung"
            subtitle={mounted && workoutSessions.length > 0 ? `Zeitraum: ${
              { '7d': 'Letzte 7 Tage', '1m': 'Letzter Monat', '3m': 'Letzte 3 Monate', 'all': 'Alle Zeit' }[timeRange]
            }` : undefined}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<FireIcon />}
              label="Gesamtvolumen"
              value={`${stats.volume.curr.toLocaleString('de-DE')} kg`}
              trend={stats.volume.trend}
              trendLabel={trendSubLabel(stats.volume.trend)}
              color="orange"
            />
            <StatCard
              icon={<TrophyIcon />}
              label="Trainings"
              value={stats.workouts.curr}
              trend={stats.workouts.trend}
              trendLabel={trendSubLabel(stats.workouts.trend)}
              color="blue"
            />
            <StatCard
              icon={<MuscleIcon />}
              label="Sätze gesamt"
              value={stats.sets.curr}
              trend={stats.sets.trend}
              trendLabel={trendSubLabel(stats.sets.trend)}
              color="emerald"
            />
            <StatCard
              icon={<ClockIcon />}
              label="Ø Trainingsdauer"
              value={stats.avgDur.curr > 0 ? `${stats.avgDur.curr} min` : '—'}
              trend={stats.avgDur.trend}
              trendLabel={trendSubLabel(stats.avgDur.trend)}
              color="violet"
            />
          </div>
        </section>

        {/* ── Muskel-Heatmap ─────────────────────────────────────────────── */}
        {workoutSessions.length > 0 && (
          <section className="mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <SectionHeader
                title="Muskel-Heatmap"
                subtitle="Trainingsbelastung der letzten 7 Tage"
              />
              <BodyHeatmap />
            </div>
          </section>
        )}

        {/* ── Muskelvolumen ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader
              title="Muskelvolumen"
              subtitle="Wöchentliche Sätze pro Muskelgruppe mit Empfehlungen"
            />
            <MuscleVolumeStats />
          </div>
        </section>

        {/* ── Übungsanalyse ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader
              title="Übungsanalyse"
              subtitle="Detaillierter Vergleich deiner Übungen über die Zeit"
            />
            <ExerciseComparisonChart />
          </div>
        </section>

        {/* ── Körpergewicht ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader
              title="Körpergewicht"
              subtitle="Gewichtsverlauf und letzter Eintrag"
            />
            <BodyWeightWidget compact />
          </div>
        </section>

        {/* ── Empty State ────────────────────────────────────────────────── */}
        {workoutSessions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Noch keine Daten</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Schliesse dein erstes Training ab, um hier deine Fortschritte zu sehen.
            </p>
          </div>
        )}
      </div>

      <GlobalSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </DashboardLayout>
  );
}
