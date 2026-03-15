'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { ChevronRight, Clock3, Sparkles } from 'lucide-react';
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

function formatDate(date: Date) {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export default function RecoveryPage() {
  const { workoutSessions, trainingDays } = useWorkoutStore();
  const { trackingSettings } = useNutritionStore();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const enabledMuscles = trackingSettings?.enabledMuscles?.length
    ? trackingSettings.enabledMuscles
    : ALL_MUSCLES;

  const recoveryMap = useMemo(() => calculateRecoveryFromWorkouts(workoutSessions), [workoutSessions]);

  const muscleRecoveryValues = useMemo(
    () =>
      ALL_MUSCLES.reduce<Record<string, number>>((accumulator, muscle) => {
        accumulator[muscle] = recoveryMap[muscle].recovery;
        return accumulator;
      }, {}),
    [recoveryMap]
  );

  const summary = useMemo(() => {
    const ready = enabledMuscles.filter((muscle) => recoveryMap[muscle].recovery >= 80);
    const recovering = enabledMuscles.filter(
      (muscle) => recoveryMap[muscle].recovery >= 50 && recoveryMap[muscle].recovery < 80
    );
    const fatigued = enabledMuscles.filter((muscle) => recoveryMap[muscle].recovery < 50);

    return { ready, recovering, fatigued };
  }, [enabledMuscles, recoveryMap]);

  const dayReadiness = useMemo(() => {
    return trainingDays.map((day) => {
      const muscleSet = new Set<MuscleGroup>();

      day.exercises.forEach((exercise) => {
        const exerciseEntry = exerciseDatabase.find((entry) => entry.id === exercise.exerciseId);
        exerciseEntry?.muscleGroups.forEach((muscle) => {
          if (enabledMuscles.includes(muscle)) {
            muscleSet.add(muscle);
          }
        });
      });

      const muscles = Array.from(muscleSet);
      const averageRecovery =
        muscles.length > 0
          ? muscles.reduce((sum, muscle) => sum + recoveryMap[muscle].recovery, 0) / muscles.length
          : 100;
      const state = getRecoveryState(Math.round(averageRecovery));
      const limitingMuscles = muscles
        .filter((muscle) => recoveryMap[muscle].recovery < 80)
        .sort((left, right) => recoveryMap[left].hoursLeft - recoveryMap[right].hoursLeft);
      const nextFreeInHours =
        limitingMuscles.length > 0
          ? Math.max(...limitingMuscles.map((muscle) => recoveryMap[muscle].hoursLeft))
          : 0;

      return {
        id: day.id,
        name: day.name,
        muscles,
        state,
        limitingMuscles,
        nextFreeInHours,
      };
    });
  }, [enabledMuscles, recoveryMap, trainingDays]);

  const selectedDay = dayReadiness.find((day) => day.id === selectedDayId) || null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Regeneration</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Jeder Muskel fuellt sich sichtbar wieder auf. Statt Prozenten bekommst du klare
            Zustandsbilder, freie Muskelgruppen und konkrete Hinweise für den nächsten Trainingstag.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Muskelkarte
                </p>
                <h2 className="text-xl font-black text-slate-900">Dein aktuelles Recovery-Bild</h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Tap auf einen Muskel für Details
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Vorderseite</p>
                <MuscleMap
                  view="front"
                  muscleRecovery={muscleRecoveryValues}
                  workoutSessions={workoutSessions}
                  enabledMuscles={enabledMuscles}
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">R?ckseite</p>
                <MuscleMap
                  view="back"
                  muscleRecovery={muscleRecoveryValues}
                  workoutSessions={workoutSessions}
                  enabledMuscles={enabledMuscles}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Frei für Arbeit
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-900">{summary.ready.length}</p>
              <p className="mt-2 text-sm text-emerald-800">
                {summary.ready.length > 0
                  ? summary.ready.slice(0, 4).map((muscle) => MUSCLE_NAMES_DE[muscle]).join(', ')
                  : 'Gerade ist noch keine Muskelgruppe komplett frei.'}
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Lädt auf
              </p>
              <p className="mt-2 text-3xl font-black text-amber-900">{summary.recovering.length}</p>
              <p className="mt-2 text-sm text-amber-800">
                Gute Zone für Technik, Pump oder lockere Belastung.
              </p>
            </div>

            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                Noch unter Last
              </p>
              <p className="mt-2 text-3xl font-black text-rose-900">{summary.fatigued.length}</p>
              <p className="mt-2 text-sm text-rose-800">
                {summary.fatigued.length > 0
                  ? summary.fatigued
                      .slice(0, 4)
                      .map((muscle) => MUSCLE_NAMES_DE[muscle])
                      .join(', ')
                  : 'Keine klare Bremse im System.'}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Interpretation</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Mehr Sätze, mehrere Übungen für denselben Muskel und niedriger RIR verlängern
                    die Regeneration sichtbar. Die Karte reagiert also direkt auf Trainingshaerte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {dayReadiness.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Trainingstag-Freigabe</h2>
              <p className="text-sm text-slate-600">
                Welcher Tag passt heute am besten zu deinem aktuellen Recovery-Bild.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dayReadiness.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`rounded-[26px] border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${day.state.softClass}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-slate-900">{day.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {day.muscles.length} Muskelgruppen im Fokus
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {day.muscles.slice(0, 4).map((muscle) => (
                      <span
                        key={muscle}
                        className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {MUSCLE_NAMES_DE[muscle]}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-sm font-bold ${day.state.accentClass}`}>{day.state.label}</span>
                    <span className="text-xs font-medium text-slate-600">
                      {day.nextFreeInHours > 0 ? `Noch ca. ${day.nextFreeInHours}h` : 'Heute frei'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">Alle Muskeln im ?berblick</h2>
            <p className="text-sm text-slate-600">
              Jeder Muskel zeigt seinen Status, den letzten Kontakt und den verbleibenden Abstand zur
              vollen Freigabe.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {enabledMuscles.map((muscle) => {
              const info = recoveryMap[muscle];
              const state = getRecoveryState(info.recovery);

              return (
                <div
                  key={muscle}
                  className={`rounded-[24px] border bg-white p-4 shadow-sm ${state.softClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-900">{MUSCLE_NAMES_DE[muscle]}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {info.lastTrainedAt ? `Zuletzt: ${formatDate(info.lastTrainedAt)}` : 'Noch nicht trainiert'}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${state.accentClass}`}>{state.label}</span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full ${
                        state.key === 'ready'
                          ? 'bg-emerald-500'
                          : state.key === 'recovering'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${info.recovery}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Noch frei in</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {info.hoursLeft > 0 ? `${info.hoursLeft}h` : 'Jetzt'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Letzte Last</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {info.weightedSets > 0 ? `${info.weightedSets} Sätze` : 'Keine'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedDayId(null)}
          >
            <div
              className="w-full max-w-2xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Trainingstag
                  </p>
                  <h3 className="text-2xl font-black text-slate-950">{selectedDay.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedDay.state.description}</p>
                </div>
                <button
                  onClick={() => setSelectedDayId(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Schlie?en
                </button>
              </div>

              <div className="mb-5 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <Clock3 className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Nächstes gutes Fenster</p>
                    <p className="text-sm text-slate-600">
                      {selectedDay.nextFreeInHours > 0
                        ? `In etwa ${selectedDay.nextFreeInHours} Stunden ist der Tag frei`
                        : 'Der Tag ist aus Recovery-Sicht bereits frei'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedDay.muscles.map((muscle) => {
                  const info = recoveryMap[muscle];
                  const state = getRecoveryState(info.recovery);

                  return (
                    <div
                      key={muscle}
                      className={`rounded-[22px] border p-4 ${state.softClass}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{MUSCLE_NAMES_DE[muscle]}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {info.lastTrainedAt ? `Zuletzt: ${formatDate(info.lastTrainedAt)}` : 'Noch nicht trainiert'}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${state.accentClass}`}>{state.label}</span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                        <div
                          className={`h-full rounded-full ${
                            state.key === 'ready'
                              ? 'bg-emerald-500'
                              : state.key === 'recovering'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${info.recovery}%` }}
                        />
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                        <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frei in</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {info.hoursLeft > 0 ? `${info.hoursLeft}h` : 'Jetzt'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Letzte Last</p>
                          <p className="mt-1 font-bold text-slate-900">{info.weightedSets} Sätze</p>
                        </div>
                        <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg. RIR</p>
                          <p className="mt-1 font-bold text-slate-900">{info.avgRir}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
