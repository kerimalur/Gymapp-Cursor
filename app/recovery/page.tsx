'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { ChevronRight, Clock3, Sparkles, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MuscleMap } from '@/components/recovery/MuscleMap';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import {
  ALL_MUSCLES,
  MUSCLE_NAMES_DE,
  calculateRecoveryFromWorkouts,
  getRecoveryState,
} from '@/lib/recovery';
import type { MuscleGroup } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

// ─── Overall Recovery Ring ────────────────────────────────────────────────────

function RecoveryRing({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color =
    pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <svg width="128" height="128" className="rotate-[-90deg]">
      <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(225,12%,20%)" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ─── Muscle Bar ───────────────────────────────────────────────────────────────

function MuscleBar({ recovery, state }: { recovery: number; state: ReturnType<typeof getRecoveryState> }) {
  const barColor =
    state.key === 'ready'      ? 'bg-emerald-500'
    : state.key === 'recovering' ? 'bg-amber-400'
    :                              'bg-rose-500';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(225,12%,16%)]">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${recovery}%` }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const { workoutSessions, trainingDays } = useWorkoutStore();
  const { trackingSettings } = useNutritionStore();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const enabledMuscles: MuscleGroup[] = trackingSettings?.enabledMuscles?.length
    ? trackingSettings.enabledMuscles
    : ALL_MUSCLES;

  const recoveryMap = useMemo(
    () => calculateRecoveryFromWorkouts(workoutSessions),
    [workoutSessions]
  );

  const muscleRecoveryValues = useMemo(
    () =>
      ALL_MUSCLES.reduce<Record<string, number>>((acc, muscle) => {
        acc[muscle] = recoveryMap[muscle].recovery;
        return acc;
      }, {}),
    [recoveryMap]
  );

  // Overall recovery = average across enabled muscles
  const overallRecovery = useMemo(() => {
    if (enabledMuscles.length === 0) return 100;
    const sum = enabledMuscles.reduce((s, m) => s + recoveryMap[m].recovery, 0);
    return Math.round(sum / enabledMuscles.length);
  }, [enabledMuscles, recoveryMap]);

  const summary = useMemo(() => {
    const ready     = enabledMuscles.filter((m) => recoveryMap[m].recovery >= 80);
    const recovering = enabledMuscles.filter((m) => recoveryMap[m].recovery >= 50 && recoveryMap[m].recovery < 80);
    const fatigued  = enabledMuscles.filter((m) => recoveryMap[m].recovery < 50);
    return { ready, recovering, fatigued };
  }, [enabledMuscles, recoveryMap]);

  const dayReadiness = useMemo(() => {
    return trainingDays.map((day) => {
      const muscleSet = new Set<MuscleGroup>();
      day.exercises.forEach((exercise) => {
        const entry = exerciseDatabase.find((e) => e.id === exercise.exerciseId);
        entry?.muscleGroups.forEach((muscle) => {
          if (enabledMuscles.includes(muscle)) muscleSet.add(muscle);
        });
      });

      const muscles = Array.from(muscleSet);
      const avgRecovery =
        muscles.length > 0
          ? muscles.reduce((sum, m) => sum + recoveryMap[m].recovery, 0) / muscles.length
          : 100;
      const state = getRecoveryState(Math.round(avgRecovery));
      const limitingMuscles = muscles
        .filter((m) => recoveryMap[m].recovery < 80)
        .sort((a, b) => recoveryMap[a].hoursLeft - recoveryMap[b].hoursLeft);
      const nextFreeInHours =
        limitingMuscles.length > 0
          ? Math.max(...limitingMuscles.map((m) => recoveryMap[m].hoursLeft))
          : 0;

      return {
        id: day.id,
        name: day.name,
        muscles,
        avgRecovery: Math.round(avgRecovery),
        state,
        limitingMuscles,
        nextFreeInHours,
        exerciseCount: day.exercises.length,
      };
    });
  }, [enabledMuscles, recoveryMap, trainingDays]);

  // Sorted muscles by recovery % ascending (most fatigued first)
  const sortedMuscles = useMemo(
    () => [...enabledMuscles].sort((a, b) => recoveryMap[a].recovery - recoveryMap[b].recovery),
    [enabledMuscles, recoveryMap]
  );

  const selectedDay = dayReadiness.find((d) => d.id === selectedDayId) ?? null;

  const overallState = getRecoveryState(overallRecovery);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">

        {/* ── Hero Card ──────────────────────────────────────────────────── */}
        <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Ring */}
            <div className="relative flex-shrink-0 self-center">
              <RecoveryRing pct={overallRecovery} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[hsl(var(--fg-primary))]">{overallRecovery}%</span>
                <span className="text-xs font-medium text-[hsl(var(--fg-muted))] mt-0.5">Gesamt</span>
              </div>
            </div>

            {/* Text + chips */}
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--fg-subtle))]">Regeneration</span>
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--fg-primary))] mb-3">
                Gesamtregeneration{' '}
                <span
                  className={
                    overallState.key === 'ready'
                      ? 'text-emerald-600'
                      : overallState.key === 'recovering'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }
                >
                  {overallRecovery}%
                </span>
              </h1>

              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-sm font-semibold text-emerald-400">
                  <span className="text-base leading-none">✓</span>
                  {summary.ready.length} bereit
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-sm font-semibold text-amber-400">
                  <span className="text-base leading-none">⏱</span>
                  {summary.recovering.length} erholen
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-400/10 border border-rose-400/20 text-sm font-semibold text-rose-400">
                  <span className="text-base leading-none">⚠</span>
                  {summary.fatigued.length} belastet
                </span>
              </div>

              {/* Hint tip */}
              <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
                {overallState.key === 'ready'
                  ? 'Dein Körper ist gut erholt. Optimale Zeit für intensives Training.'
                  : overallState.key === 'recovering'
                  ? 'Du erholst dich gut. Leichte bis mittlere Belastung ist ideal.'
                  : 'Mehrere Muskeln noch unter Last. Gönn dir etwas mehr Zeit.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Muskelkarte ────────────────────────────────────────────────── */}
        <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Muskelkarte</h2>
              <p className="text-sm text-[hsl(var(--fg-muted))] mt-0.5">Dein aktuelles Recovery-Bild</p>
            </div>
            <span className="hidden sm:block rounded-full border border-[hsl(225,10%,20%)] bg-[hsl(225,12%,13%)] px-3 py-1 text-xs font-medium text-[hsl(var(--fg-muted))]">
              Tap auf einen Muskel für Details
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,12%,13%)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--fg-muted))]">Vorderseite</p>
              <MuscleMap
                view="front"
                muscleRecovery={muscleRecoveryValues}
                workoutSessions={workoutSessions}
                enabledMuscles={enabledMuscles}
              />
            </div>
            <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,12%,13%)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--fg-muted))]">Rückseite</p>
              <MuscleMap
                view="back"
                muscleRecovery={muscleRecoveryValues}
                workoutSessions={workoutSessions}
                enabledMuscles={enabledMuscles}
              />
            </div>
          </div>

          {/* Interpretation note */}
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-[hsl(225,12%,13%)] border border-[hsl(225,10%,16%)] p-4">
            <div className="mt-0.5 rounded-xl bg-[hsl(225,14%,16%)] p-2 text-[hsl(var(--fg-muted))] flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              Mehr Sätze, mehrere Übungen für denselben Muskel und niedriger RIR verlängern die
              Regeneration sichtbar. Die Karte reagiert direkt auf Trainingsintensität.
            </p>
          </div>
        </div>

        {/* ── Trainingstag-Freigabe ──────────────────────────────────────── */}
        {dayReadiness.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Trainingstag-Freigabe</h2>
              <p className="text-sm text-[hsl(var(--fg-muted))] mt-0.5">
                Welcher Tag passt heute am besten zu deinem Recovery-Bild.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dayReadiness.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${day.state.softClass}`}
                >
                  {/* Top row: name + chevron */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-[hsl(var(--fg-primary))] text-base">{day.name}</p>
                      <p className="text-xs text-[hsl(var(--fg-muted))] mt-0.5">
                        {day.exerciseCount} Übungen · {day.muscles.length} Muskelgruppen
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[hsl(var(--fg-subtle))] mt-0.5 flex-shrink-0" />
                  </div>

                  {/* Recovery bar */}
                  <MuscleBar recovery={day.avgRecovery} state={day.state} />

                  {/* Bottom row: status + time */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-sm font-bold ${day.state.accentClass}`}>
                      {day.state.label} · {day.avgRecovery}%
                    </span>
                    <span className="text-xs font-medium text-[hsl(var(--fg-muted))]">
                      {day.nextFreeInHours > 0 ? `Noch ~${day.nextFreeInHours}h` : 'Heute frei'}
                    </span>
                  </div>

                  {/* Muscle chips */}
                  {day.muscles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {day.muscles.slice(0, 5).map((muscle) => (
                        <span
                          key={muscle}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--fg-secondary))]"
                        >
                          {MUSCLE_NAMES_DE[muscle]}
                        </span>
                      ))}
                      {day.muscles.length > 5 && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--fg-subtle))]">
                          +{day.muscles.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Alle Muskeln ───────────────────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Alle Muskeln im Überblick</h2>
            <p className="text-sm text-[hsl(var(--fg-muted))] mt-0.5">
              Sortiert nach Erholungsstand — müdeste Muskeln zuerst.
            </p>
          </div>

          <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] overflow-hidden">
            {sortedMuscles.map((muscle, idx) => {
              const info  = recoveryMap[muscle];
              const state = getRecoveryState(info.recovery);
              const isLast = idx === sortedMuscles.length - 1;

              return (
                <div
                  key={muscle}
                  className={`px-4 py-3 flex items-center gap-4 ${!isLast ? 'border-b border-[hsl(225,10%,14%)]' : ''}`}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    state.key === 'ready'
                      ? 'bg-emerald-500'
                      : state.key === 'recovering'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`} />

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[hsl(var(--fg-primary))] truncate">
                        {MUSCLE_NAMES_DE[muscle]}
                      </span>
                      <span className={`text-xs font-bold ml-3 flex-shrink-0 ${state.accentClass}`}>
                        {info.recovery}%
                      </span>
                    </div>
                    <MuscleBar recovery={info.recovery} state={state} />
                  </div>

                  {/* Metadata */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-[hsl(var(--fg-subtle))] flex-shrink-0">
                    <span className="font-medium">
                      {info.hoursLeft > 0 ? `Frei in ${info.hoursLeft}h` : 'Jetzt frei'}
                    </span>
                    {info.lastTrainedAt && (
                      <span className="hidden md:block">
                        {formatDate(info.lastTrainedAt)}
                      </span>
                    )}
                    {info.weightedSets > 0 && (
                      <span>{info.weightedSets} Sätze</span>
                    )}
                  </div>

                  {/* Mobile: just hours */}
                  <div className="sm:hidden text-xs text-[hsl(var(--fg-subtle))] flex-shrink-0">
                    {info.hoursLeft > 0 ? `${info.hoursLeft}h` : 'Frei'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* ── Day Detail Modal ──────────────────────────────────────────────── */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedDayId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[hsl(225,10%,18%)] bg-[hsl(225,14%,11%)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--fg-subtle))]">Trainingstag</p>
                <h3 className="text-xl font-bold text-[hsl(var(--fg-primary))] mt-0.5">{selectedDay.name}</h3>
                <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{selectedDay.state.description}</p>
              </div>
              <button
                onClick={() => setSelectedDayId(null)}
                className="rounded-xl bg-[hsl(225,12%,15%)] p-2 text-[hsl(var(--fg-muted))] hover:bg-[hsl(225,12%,20%)] transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Next training window */}
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,12%,13%)] p-4">
              <div className="rounded-xl bg-[hsl(225,14%,16%)] p-2.5 text-[hsl(var(--fg-muted))] flex-shrink-0">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--fg-primary))]">Nächstes gutes Fenster</p>
                <p className="text-sm text-[hsl(var(--fg-muted))]">
                  {selectedDay.nextFreeInHours > 0
                    ? `In etwa ${selectedDay.nextFreeInHours} Stunden ist der Tag frei`
                    : 'Der Tag ist aus Recovery-Sicht bereits frei'}
                </p>
              </div>
            </div>

            {/* Muscle list */}
            <div className="space-y-2">
              {selectedDay.muscles.map((muscle) => {
                const info  = recoveryMap[muscle];
                const state = getRecoveryState(info.recovery);

                return (
                  <div
                    key={muscle}
                    className={`rounded-xl border p-4 ${state.softClass}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-[hsl(var(--fg-primary))]">{MUSCLE_NAMES_DE[muscle]}</p>
                        <p className="text-xs text-[hsl(var(--fg-muted))] mt-0.5">
                          {info.lastTrainedAt ? `Zuletzt: ${formatDate(info.lastTrainedAt)}` : 'Noch nicht trainiert'}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${state.accentClass}`}>
                        {info.recovery}%
                      </span>
                    </div>

                    <MuscleBar recovery={info.recovery} state={state} />

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                        <p className="font-semibold uppercase tracking-wide text-[hsl(var(--fg-subtle))] text-[10px]">Frei in</p>
                        <p className="mt-0.5 font-bold text-[hsl(var(--fg-primary))]">
                          {info.hoursLeft > 0 ? `${info.hoursLeft}h` : 'Jetzt'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                        <p className="font-semibold uppercase tracking-wide text-[hsl(var(--fg-subtle))] text-[10px]">Sätze</p>
                        <p className="mt-0.5 font-bold text-[hsl(var(--fg-primary))]">
                          {info.weightedSets > 0 ? info.weightedSets : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                        <p className="font-semibold uppercase tracking-wide text-[hsl(var(--fg-subtle))] text-[10px]">Avg. RIR</p>
                        <p className="mt-0.5 font-bold text-[hsl(var(--fg-primary))]">{info.avgRir}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
