'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

export function WeeklySummary() {
  const { workoutSessions } = useWorkoutStore();

  const summary = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekSessions = workoutSessions.filter(s =>
      isWithinInterval(new Date(s.startTime), { start: thisWeekStart, end: thisWeekEnd })
    );
    const lastWeekSessions = workoutSessions.filter(s =>
      isWithinInterval(new Date(s.startTime), { start: lastWeekStart, end: lastWeekEnd })
    );

    const thisVolume = thisWeekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const lastVolume = lastWeekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const volumeChange = lastVolume > 0
      ? Math.round(((thisVolume - lastVolume) / lastVolume) * 100)
      : null;

    // PRs this week
    const allTimePRs: Record<string, number> = {};
    workoutSessions
      .filter(s => new Date(s.startTime) < thisWeekStart)
      .forEach(s => s.exercises.forEach(ex => ex.sets.forEach(set => {
        if (set.completed && !set.isWarmup && set.weight > 0) {
          allTimePRs[ex.exerciseId] = Math.max(allTimePRs[ex.exerciseId] || 0, set.weight);
        }
      })));

    const newPRs: { exerciseName: string; weight: number }[] = [];
    thisWeekSessions.forEach(s => s.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && !set.isWarmup && set.weight > 0) {
          const prevBest = allTimePRs[ex.exerciseId] || 0;
          if (set.weight > prevBest) {
            const exercise = exerciseDatabase.find(e => e.id === ex.exerciseId);
            const name = exercise?.name || ex.exerciseId;
            if (!newPRs.find(p => p.exerciseName === name)) {
              newPRs.push({ exerciseName: name, weight: set.weight });
              allTimePRs[ex.exerciseId] = set.weight;
            }
          }
        }
      });
    }));

    // Top exercise by volume this week
    const exerciseVolumes: Record<string, number> = {};
    thisWeekSessions.forEach(s => s.exercises.forEach(ex => {
      const vol = ex.sets.filter(s => s.completed && !s.isWarmup).reduce((sum, s) => sum + s.weight * s.reps, 0);
      exerciseVolumes[ex.exerciseId] = (exerciseVolumes[ex.exerciseId] || 0) + vol;
    }));
    const topExerciseId = Object.entries(exerciseVolumes).sort(([, a], [, b]) => b - a)[0]?.[0];
    const topExercise = topExerciseId ? (exerciseDatabase.find(e => e.id === topExerciseId)?.name || topExerciseId) : null;

    return {
      thisWorkouts: thisWeekSessions.length,
      lastWorkouts: lastWeekSessions.length,
      thisVolume: Math.round(thisVolume),
      lastVolume: Math.round(lastVolume),
      volumeChange,
      newPRs,
      topExercise,
    };
  }, [workoutSessions]);

  if (summary.thisWorkouts === 0 && summary.lastWorkouts === 0) return null;

  const volumeUp = summary.volumeChange !== null && summary.volumeChange >= 0;
  const workoutsUp = summary.thisWorkouts >= summary.lastWorkouts;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
        <h3 className="text-lg font-bold text-slate-800">Wochenrückblick</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Trainings diese Woche</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-slate-800">{summary.thisWorkouts}</p>
            {summary.lastWorkouts > 0 && (
              <span className={`text-xs font-medium mb-1 ${workoutsUp ? 'text-emerald-600' : 'text-orange-500'}`}>
                {workoutsUp ? '↑' : '↓'} {Math.abs(summary.thisWorkouts - summary.lastWorkouts)} vs. letzte Wo.
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Volumen diese Woche</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-slate-800">
              {summary.thisVolume > 0 ? `${(summary.thisVolume / 1000).toFixed(1)}t` : '0kg'}
            </p>
            {summary.volumeChange !== null && (
              <span className={`text-xs font-medium mb-1 ${volumeUp ? 'text-emerald-600' : 'text-orange-500'}`}>
                {volumeUp ? '↑' : '↓'} {Math.abs(summary.volumeChange)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {summary.newPRs.length > 0 && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Neue Rekorde diese Woche</p>
          <div className="flex flex-wrap gap-1">
            {summary.newPRs.map(pr => (
              <span key={pr.exerciseName} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {pr.exerciseName} {pr.weight}kg
              </span>
            ))}
          </div>
        </div>
      )}

      {summary.topExercise && (
        <p className="text-xs text-slate-500">
          Meiste Arbeit: <span className="font-medium text-slate-700">{summary.topExercise}</span>
        </p>
      )}

      {summary.thisWorkouts === 0 && (
        <p className="text-sm text-slate-500">Diese Woche noch kein Training. Los geht's!</p>
      )}
    </div>
  );
}
