'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExerciseComparisonChart } from '@/components/statistics/ExerciseComparisonChart';
import { MuscleVolumeStats } from '@/components/statistics/MuscleVolumeStats';
import { BodyHeatmap } from '@/components/statistics/BodyHeatmap';
import { BodyWeightWidget } from '@/components/dashboard/BodyWeightWidget';
import { StrengthGoals } from '@/components/dashboard/StrengthGoals';
import { isWithinInterval, subDays, subMonths, format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { Target, TrendingDown, TrendingUp, Dumbbell, Scale, CheckCircle2, Trash2 } from 'lucide-react';

type TimeRange = '7d' | '1m' | '3m' | 'all';
type Section = 'leistung' | 'analyse' | 'ziele';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(range: TimeRange, now: Date) {
  switch (range) {
    case '7d':  return { start: subDays(now, 7), end: now };
    case '1m':  return { start: subMonths(now, 1), end: now };
    case '3m':  return { start: subMonths(now, 3), end: now };
    case 'all': return { start: new Date(0), end: now };
  }
}

function getPrevDateRange(range: TimeRange, now: Date) {
  switch (range) {
    case '7d':  return { start: subDays(now, 14), end: subDays(now, 7) };
    case '1m':  return { start: subMonths(now, 2), end: subMonths(now, 1) };
    case '3m':  return { start: subMonths(now, 6), end: subMonths(now, 3) };
    case 'all': return { start: new Date(0), end: new Date(0) };
  }
}

function calcTrend(curr: number, prev: number) {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

// ─── Body Weight Goal Card ──────────────────────────────────────────────────

function BodyWeightGoalCard() {
  const { goal, setGoal, getLatestWeight } = useBodyWeightStore();
  const [editing, setEditing] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const currentWeight = getLatestWeight();

  const progress = useMemo(() => {
    if (!goal || currentWeight === null) return null;
    const totalChange = goal.targetWeight - goal.startWeight;
    if (totalChange === 0) return 100;
    const actualChange = currentWeight - goal.startWeight;
    return Math.min(100, Math.max(0, Math.round((actualChange / totalChange) * 100)));
  }, [goal, currentWeight]);

  const remaining = goal && currentWeight !== null ? Math.abs(goal.targetWeight - currentWeight).toFixed(1) : null;
  const isGain = goal ? goal.targetWeight > goal.startWeight : false;

  const handleSave = () => {
    if (!targetWeight) return;
    setGoal({
      targetWeight: parseFloat(targetWeight),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      startWeight: currentWeight ?? parseFloat(targetWeight),
      startDate: new Date(),
    });
    setEditing(false);
    setTargetWeight('');
    setTargetDate('');
  };

  return (
    <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-[hsl(var(--fg-primary))]">Körpergewicht</h3>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs font-medium text-cyan-400 px-2 py-1 rounded-lg bg-cyan-400/10"
        >
          {goal ? 'Ändern' : 'Ziel setzen'}
        </button>
      </div>

      {editing && (
        <div className="mb-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
              placeholder="Ziel kg" className="rounded-lg border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-3 py-2 text-sm text-[hsl(var(--fg-primary))] outline-none focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]" />
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="rounded-lg border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-3 py-2 text-sm text-[hsl(var(--fg-primary))] outline-none focus:border-cyan-400/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!targetWeight} className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-white disabled:opacity-40">Speichern</button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-[hsl(225,10%,20%)] px-3 py-2 text-sm text-[hsl(var(--fg-muted))]">Abbrechen</button>
          </div>
        </div>
      )}

      {!goal ? (
        <p className="text-sm text-[hsl(var(--fg-muted))]">Noch kein Gewichtsziel gesetzt.</p>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--fg-primary))]">{goal.targetWeight} kg</p>
              <p className="text-xs text-[hsl(var(--fg-muted))]">Start: {goal.startWeight} kg</p>
            </div>
            <div className="flex items-center gap-1">
              {isGain ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />}
              <span className={`text-sm font-bold ${progress === 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>{progress ?? 0}%</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-[hsl(225,12%,16%)] overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-400' : 'bg-cyan-400'}`} style={{ width: `${progress ?? 0}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-[hsl(var(--fg-muted))]">
            <span>Aktuell: {currentWeight !== null ? `${currentWeight} kg` : '—'}</span>
            {progress === 100 ? <span className="text-emerald-400 font-medium">✓ Erreicht!</span>
              : remaining && <span>Noch {remaining} kg</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Weekly Volume Goal Card ────────────────────────────────────────────────

function WeeklyVolumeGoalCard() {
  const { workoutSessions, weeklyVolumeGoalSets, setWeeklyVolumeGoalSets } = useWorkoutStore();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  const thisWeekSets = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return workoutSessions
      .filter(s => new Date(s.startTime) >= weekStart)
      .reduce((t, s) => t + s.exercises.reduce((e, x) => e + x.sets.filter(st => st.completed).length, 0), 0);
  }, [workoutSessions]);

  const progress = weeklyVolumeGoalSets ? Math.min(100, Math.round((thisWeekSets / weeklyVolumeGoalSets) * 100)) : null;

  const handleSave = () => {
    const val = parseInt(input);
    if (val > 0) setWeeklyVolumeGoalSets(val);
    setEditing(false);
    setInput('');
  };

  return (
    <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-violet-400" />
          <h3 className="font-bold text-[hsl(var(--fg-primary))]">Wochenvolumen</h3>
        </div>
        <button onClick={() => setEditing(!editing)} className="text-xs font-medium text-violet-400 px-2 py-1 rounded-lg bg-violet-400/10">
          {weeklyVolumeGoalSets ? 'Ändern' : 'Ziel setzen'}
        </button>
      </div>

      {editing && (
        <div className="mb-3 rounded-lg border border-violet-400/20 bg-violet-400/5 p-3 space-y-2">
          <input type="number" value={input} onChange={e => setInput(e.target.value)} placeholder="Sätze pro Woche"
            className="w-full rounded-lg border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-3 py-2 text-sm text-[hsl(var(--fg-primary))] outline-none focus:border-violet-400/50 placeholder:text-[hsl(var(--fg-muted))]" />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!input || parseInt(input) <= 0} className="flex-1 rounded-lg bg-violet-500 py-2 text-sm font-semibold text-white disabled:opacity-40">Speichern</button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-[hsl(225,10%,20%)] px-3 py-2 text-sm text-[hsl(var(--fg-muted))]">Abbrechen</button>
          </div>
        </div>
      )}

      {!weeklyVolumeGoalSets ? (
        <p className="text-sm text-[hsl(var(--fg-muted))]">Noch kein Volumenziel gesetzt.</p>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[hsl(var(--fg-primary))]">{thisWeekSets} / {weeklyVolumeGoalSets} Sätze</p>
            <span className={`text-sm font-bold ${progress === 100 ? 'text-emerald-400' : 'text-violet-400'}`}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[hsl(225,12%,16%)] overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-400' : 'bg-violet-400'}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-[hsl(var(--fg-muted))]">
            {progress === 100 ? '✓ Wochenziel erreicht!' : `Noch ${weeklyVolumeGoalSets - thisWeekSets} Sätze`}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { workoutSessions } = useWorkoutStore();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [section, setSection] = useState<Section>('leistung');

  useEffect(() => { setMounted(true); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const curr = getDateRange(timeRange, now);
    const prev = getPrevDateRange(timeRange, now);
    const currSessions = workoutSessions.filter((s) => isWithinInterval(new Date(s.startTime), curr));
    const prevSessions = workoutSessions.filter((s) => isWithinInterval(new Date(s.startTime), prev));

    const sumVolume = (ss: typeof workoutSessions) => ss.reduce((s, x) => s + x.totalVolume, 0);
    const sumSets = (ss: typeof workoutSessions) => {
      let t = 0;
      ss.forEach((s) => s.exercises.forEach((e) => e.sets.forEach((st) => { if (st.completed && st.weight > 0) t++; })));
      return t;
    };
    const sumDur = (ss: typeof workoutSessions) => ss.reduce((s, x) => s + (x.duration || 0), 0);

    const cv = Math.round(sumVolume(currSessions));
    const pv = Math.round(sumVolume(prevSessions));
    const cc = currSessions.length;
    const pc = prevSessions.length;
    const cs = sumSets(currSessions);
    const ps = sumSets(prevSessions);
    const cd = cc > 0 ? Math.round(sumDur(currSessions) / cc) : 0;
    const pd = pc > 0 ? Math.round(sumDur(prevSessions) / pc) : 0;

    return {
      volume:   { curr: cv, trend: calcTrend(cv, pv) },
      workouts: { curr: cc, trend: calcTrend(cc, pc) },
      sets:     { curr: cs, trend: calcTrend(cs, ps) },
      avgDur:   { curr: cd, trend: calcTrend(cd, pd) },
    };
  }, [workoutSessions, timeRange]);

  if (!mounted) return null;

  const sections: { id: Section; label: string }[] = [
    { id: 'leistung', label: 'Leistung' },
    { id: 'analyse', label: 'Analyse' },
    { id: 'ziele', label: 'Ziele' },
  ];

  const timeRanges: { key: TimeRange; label: string }[] = [
    { key: '7d', label: '7T' },
    { key: '1m', label: '1M' },
    { key: '3m', label: '3M' },
    { key: 'all', label: 'Alle' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-[hsl(var(--fg-primary))]">Fortschritt</h1>
          <p className="text-sm text-[hsl(var(--fg-muted))]">Statistiken, Analysen & Ziele</p>
        </div>

        {/* ── Section Selector ────────────────────────────────── */}
        <div className="flex gap-1 bg-[hsl(225,12%,10%)] p-1 rounded-xl border border-[hsl(225,10%,16%)]">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                section === s.id
                  ? 'bg-[hsl(225,14%,16%)] text-[hsl(var(--fg-primary))] shadow-sm'
                  : 'text-[hsl(var(--fg-muted))]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── LEISTUNG ────────────────────────────────────────── */}
        {section === 'leistung' && (
          <div className="space-y-4">
            {/* Time Range */}
            <div className="flex gap-1 bg-[hsl(225,12%,10%)] p-0.5 rounded-lg border border-[hsl(225,10%,16%)]">
              {timeRanges.map((tr) => (
                <button key={tr.key} onClick={() => setTimeRange(tr.key)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    timeRange === tr.key ? 'bg-[hsl(225,14%,16%)] text-[hsl(var(--fg-primary))]' : 'text-[hsl(var(--fg-muted))]'
                  }`}>
                  {tr.label}
                </button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Volumen', value: `${stats.volume.curr.toLocaleString('de-DE')} kg`, trend: stats.volume.trend, color: 'text-orange-400' },
                { label: 'Trainings', value: `${stats.workouts.curr}`, trend: stats.workouts.trend, color: 'text-cyan-400' },
                { label: 'Sätze', value: `${stats.sets.curr}`, trend: stats.sets.trend, color: 'text-emerald-400' },
                { label: 'Ø Dauer', value: stats.avgDur.curr > 0 ? `${stats.avgDur.curr} min` : '—', trend: stats.avgDur.trend, color: 'text-violet-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3">
                  <p className="text-[10px] font-medium text-[hsl(var(--fg-muted))] uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl font-bold text-[hsl(var(--fg-primary))] mt-1">{s.value}</p>
                  {s.trend !== 0 && (
                    <p className={`text-xs font-medium mt-1 ${s.trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.trend > 0 ? '↑' : '↓'} {Math.abs(s.trend)}%
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Heatmap */}
            {workoutSessions.length > 0 && (
              <div className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-4">
                <h3 className="font-bold text-[hsl(var(--fg-primary))] mb-3">Muskel-Heatmap</h3>
                <BodyHeatmap />
              </div>
            )}

            {/* Empty State */}
            {workoutSessions.length === 0 && (
              <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-8 text-center">
                <p className="font-semibold text-[hsl(var(--fg-primary))]">Noch keine Daten</p>
                <p className="text-sm text-[hsl(var(--fg-muted))] mt-1">Schließe dein erstes Training ab.</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSE ─────────────────────────────────────────── */}
        {section === 'analyse' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-4">
              <h3 className="font-bold text-[hsl(var(--fg-primary))] mb-3">Übungsanalyse</h3>
              <ExerciseComparisonChart />
            </div>

            <div className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-4">
              <h3 className="font-bold text-[hsl(var(--fg-primary))] mb-3">Muskelvolumen</h3>
              <MuscleVolumeStats />
            </div>

            <div className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-4">
              <h3 className="font-bold text-[hsl(var(--fg-primary))] mb-3">Körpergewicht</h3>
              <BodyWeightWidget compact />
            </div>
          </div>
        )}

        {/* ── ZIELE ───────────────────────────────────────────── */}
        {section === 'ziele' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-cyan-400" />
              <p className="text-sm text-[hsl(var(--fg-muted))]">Setze Ziele und verfolge deinen Fortschritt.</p>
            </div>
            <StrengthGoals />
            <BodyWeightGoalCard />
            <WeeklyVolumeGoalCard />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
