'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { ALL_MUSCLES, MUSCLE_NAMES_DE, calculateRecoveryFromWorkouts } from '@/lib/recovery';
import type { MuscleGroup } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';

function statusColor(value: number) {
  if (value >= 80) return 'emerald';
  if (value >= 50) return 'amber';
  return 'red';
}

export default function RecoveryPage() {
  const { workoutSessions, trainingDays } = useWorkoutStore();
  const { trackingSettings } = useNutritionStore();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const enabledMuscles = trackingSettings?.enabledMuscles?.length
    ? trackingSettings.enabledMuscles
    : ALL_MUSCLES;

  const recoveryMap = useMemo(() => calculateRecoveryFromWorkouts(workoutSessions), [workoutSessions]);

  const summary = useMemo(() => {
    const average = Math.round(
      enabledMuscles.reduce((sum, muscle) => sum + recoveryMap[muscle].recovery, 0) / enabledMuscles.length
    );
    const ready = enabledMuscles.filter((muscle) => recoveryMap[muscle].recovery >= 80);
    const medium = enabledMuscles.filter(
      (muscle) => recoveryMap[muscle].recovery >= 50 && recoveryMap[muscle].recovery < 80
    );
    const tired = enabledMuscles.filter((muscle) => recoveryMap[muscle].recovery < 50);

    return { average, ready, medium, tired };
  }, [enabledMuscles, recoveryMap]);

  const dayReadiness = useMemo(() => {
    return trainingDays.map((day) => {
      const muscleSet = new Set<MuscleGroup>();
      day.exercises.forEach((exercise) => {
        const dbExercise = exerciseDatabase.find((item) => item.id === exercise.exerciseId);
        dbExercise?.muscleGroups.forEach((muscle) => {
          if (enabledMuscles.includes(muscle)) muscleSet.add(muscle);
        });
      });

      const muscles = Array.from(muscleSet);
      const averageRecovery =
        muscles.length > 0
          ? Math.round(
              muscles.reduce((sum, muscle) => sum + recoveryMap[muscle].recovery, 0) / muscles.length
            )
          : 100;

      return {
        id: day.id,
        name: day.name,
        muscles,
        averageRecovery,
      };
    });
  }, [trainingDays, enabledMuscles, recoveryMap]);

  const selectedDay = dayReadiness.find((day) => day.id === selectedDayId) || null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Regeneration</h1>
          <p className="mt-1 text-sm text-slate-500">Trainierte Muskeln starten bei 0% und regenerieren nach Lastprofil.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Gesamtstatus</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                summary.average >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : summary.average >= 50
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {summary.average}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                summary.average >= 80
                  ? 'bg-emerald-500'
                  : summary.average >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${summary.average}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Bereit</p>
              <p className="text-2xl font-black text-emerald-800">{summary.ready.length}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Erholend</p>
              <p className="text-2xl font-black text-amber-800">{summary.medium.length}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Muede</p>
              <p className="text-2xl font-black text-red-800">{summary.tired.length}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Mehr Saetze, mehr Uebungen fuer den gleichen Muskel und niedriger RIR verlaengern die Erholung. Nur Sets mit Gewicht &gt; 0 zaehlen als Belastung.
          </p>
        </div>

        {dayReadiness.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-slate-800">Trainingstag-Bereitschaft</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {dayReadiness.map((day) => {
                const color = statusColor(day.averageRecovery);
                return (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDayId(day.id)}
                    className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      color === 'emerald'
                        ? 'border-emerald-300 bg-emerald-50'
                        : color === 'amber'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <p className="font-bold text-slate-800">{day.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{day.muscles.length} Muskelgruppen</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p
                        className={`text-2xl font-black ${
                          color === 'emerald'
                            ? 'text-emerald-700'
                            : color === 'amber'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {day.averageRecovery}%
                      </p>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-800">Alle Muskeln</h2>
          <div className="space-y-2">
            {enabledMuscles.map((muscle) => {
              const info = recoveryMap[muscle];
              const color = statusColor(info.recovery);

              return (
                <div
                  key={muscle}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    color === 'emerald'
                      ? 'border-emerald-200 bg-emerald-50'
                      : color === 'amber'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-800">{MUSCLE_NAMES_DE[muscle]}</p>
                    <p className="text-xs text-slate-500">
                      {info.lastTrainedAt ? `Zuletzt: ${formatDate(info.lastTrainedAt)}` : 'Noch nicht trainiert'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xl font-black ${
                        color === 'emerald'
                          ? 'text-emerald-700'
                          : color === 'amber'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {info.recovery}%
                    </p>
                    {info.hoursLeft > 0 && (
                      <p className="text-xs text-slate-500">noch {info.hoursLeft}h</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedDayId(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{selectedDay.name}</h3>
                <button
                  onClick={() => setSelectedDayId(null)}
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  Schliessen
                </button>
              </div>

              <div className="space-y-2">
                {selectedDay.muscles.map((muscle) => {
                  const info = recoveryMap[muscle];
                  const color = statusColor(info.recovery);

                  return (
                    <div key={muscle} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold text-slate-800">{MUSCLE_NAMES_DE[muscle]}</p>
                        <p
                          className={`font-black ${
                            color === 'emerald'
                              ? 'text-emerald-700'
                              : color === 'amber'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {info.recovery}%
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="rounded-lg bg-white p-2">Saetze: {info.weightedSets}</div>
                        <div className="rounded-lg bg-white p-2">Uebungen: {info.exerciseCount}</div>
                        <div className="rounded-lg bg-white p-2">avg RIR: {info.avgRir}</div>
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

function formatDate(date: Date) {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}
