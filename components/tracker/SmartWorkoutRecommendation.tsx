'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Zap, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { calculateRecoveryFromWorkouts, MUSCLE_NAMES_DE } from '@/lib/recovery';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import type { MuscleGroup } from '@/types';

interface Props {
  onStart: (dayId: string) => void;
}

interface DayAnalysis {
  dayId: string;
  dayName: string;
  daysSinceLast: number | null;
  lastSessionDate: Date | null;
  muscleReadiness: number;
  primaryMuscles: { muscle: MuscleGroup; recovery: number }[];
}

export function SmartWorkoutRecommendation({ onStart }: Props) {
  const router = useRouter();
  const { trainingDays, trainingPlans, workoutSessions } = useWorkoutStore();

  const recoveryMap = useMemo(
    () => calculateRecoveryFromWorkouts(workoutSessions),
    [workoutSessions]
  );

  const activePlan = useMemo(
    () => trainingPlans.find((p) => p.isActive) ?? null,
    [trainingPlans]
  );

  const dayAnalyses = useMemo<DayAnalysis[]>(() => {
    return trainingDays.map((day) => {
      // Find sessions for this training day, sorted newest first
      const daySessions = workoutSessions
        .filter((s) => s.trainingDayId === day.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      const lastSession = daySessions[0] ?? null;
      const lastSessionDate = lastSession ? new Date(lastSession.startTime) : null;
      const daysSinceLast = lastSessionDate
        ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Collect primary muscles across all exercises in this day
      const primaryMuscleSet = new Map<MuscleGroup, number>();

      day.exercises.forEach((workoutExercise) => {
        const exercise = exerciseDatabase.find((e) => e.id === workoutExercise.exerciseId);
        if (!exercise) return;

        // Use detailed muscle involvement if available, else fall back to muscleGroups
        if (exercise.muscles && exercise.muscles.length > 0) {
          exercise.muscles
            .filter((m) => m.role === 'primary')
            .forEach(({ muscle }) => {
              if (!primaryMuscleSet.has(muscle)) {
                primaryMuscleSet.set(muscle, recoveryMap[muscle]?.recovery ?? 100);
              }
            });
        } else {
          exercise.muscleGroups.forEach((muscle) => {
            if (!primaryMuscleSet.has(muscle)) {
              primaryMuscleSet.set(muscle, recoveryMap[muscle]?.recovery ?? 100);
            }
          });
        }
      });

      const primaryMuscles = Array.from(primaryMuscleSet.entries()).map(([muscle, recovery]) => ({
        muscle,
        recovery,
      }));

      const muscleReadiness =
        primaryMuscles.length > 0
          ? Math.round(
              primaryMuscles.reduce((sum, m) => sum + m.recovery, 0) / primaryMuscles.length
            )
          : 100;

      return {
        dayId: day.id,
        dayName: day.name,
        daysSinceLast,
        lastSessionDate,
        muscleReadiness,
        primaryMuscles,
      };
    });
  }, [trainingDays, workoutSessions, recoveryMap]);

  const recommended = useMemo<DayAnalysis | null>(() => {
    if (dayAnalyses.length === 0) return null;
    if (dayAnalyses.length === 1) return dayAnalyses[0];

    if (activePlan && activePlan.trainingDays.length > 0) {
      const nextDayId =
        activePlan.trainingDays[activePlan.currentDayIndex ?? 0];
      const found = dayAnalyses.find((d) => d.dayId === nextDayId);
      if (found) return found;
    }

    // No active plan: recommend highest muscle readiness that hasn't been done in 2+ days
    const eligible = dayAnalyses.filter(
      (d) => d.daysSinceLast === null || d.daysSinceLast >= 2
    );
    const pool = eligible.length > 0 ? eligible : dayAnalyses;
    return pool.reduce((best, d) => (d.muscleReadiness > best.muscleReadiness ? d : best));
  }, [dayAnalyses, activePlan]);

  if (trainingDays.length === 0 || !recommended) return null;

  const { dayId, dayName, daysSinceLast, lastSessionDate, muscleReadiness, primaryMuscles } =
    recommended;

  const isReady = muscleReadiness >= 80;
  const isWarning = muscleReadiness < 60;

  const lastSessionLabel = lastSessionDate
    ? `vor ${formatDistanceToNow(lastSessionDate, { locale: de })}`
    : 'Noch nie';

  const musclesToShow = primaryMuscles.slice(0, 5);

  function getMuscleBarColor(recovery: number) {
    if (recovery >= 80) return 'bg-emerald-500';
    if (recovery >= 60) return 'bg-amber-400';
    return 'bg-red-400';
  }

  function getMuscleDotColor(recovery: number) {
    if (recovery >= 80) return 'bg-emerald-500';
    if (recovery >= 60) return 'bg-amber-400';
    return 'bg-red-400';
  }

  const handleStart = () => {
    onStart(dayId);
  };

  return (
    <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-gradient-to-br from-cyan-400/10 to-indigo-400/10 p-5 shadow-sm">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-400" />
          <span className="font-bold text-[hsl(var(--fg-primary))]">Smart Empfehlung</span>
        </div>
        <button
          onClick={handleStart}
          className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-600 transition-colors"
        >
          Heute starten
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Day name */}
      <p className="text-xl font-bold text-[hsl(var(--fg-primary))]">{dayName}</p>

      {/* Last session info */}
      <p className="mt-0.5 text-sm text-[hsl(var(--fg-muted))]">
        Letzte Session:{' '}
        <span className="font-medium">{lastSessionLabel}</span>
      </p>

      {/* Muscle readiness bars */}
      {musclesToShow.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--fg-muted))]">
            Muskelbereitschaft
          </p>
          <div className="flex flex-wrap gap-2">
            {musclesToShow.map(({ muscle, recovery }) => (
              <div
                key={muscle}
                className="flex min-w-[110px] flex-1 items-center gap-2 rounded-xl border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,10%)]/40 px-3 py-2"
              >
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${getMuscleDotColor(recovery)}`}
                />
                <span className="flex-1 text-xs font-medium text-[hsl(var(--fg-secondary))]">
                  {MUSCLE_NAMES_DE[muscle]}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[hsl(225,12%,18%)]">
                    <div
                      className={`h-full rounded-full transition-all ${getMuscleBarColor(recovery)}`}
                      style={{ width: `${recovery}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-[hsl(var(--fg-secondary))]">
                    {recovery}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="mt-4">
        {isWarning ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4" />
            Manche Muskeln noch nicht erholt
          </div>
        ) : isReady ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Bereit fürs Training!
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            <AlertCircle className="h-4 w-4" />
            Fast erholt – bald bereit
          </div>
        )}
      </div>
    </div>
  );
}
