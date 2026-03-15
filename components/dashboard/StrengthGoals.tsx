'use client';

import { useState, useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { StrengthGoal } from '@/types';
import { format, differenceInWeeks, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function getExerciseMaxWeight(exerciseId: string, sessions: ReturnType<typeof useWorkoutStore.getState>['workoutSessions']) {
  let max = 0;
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (set.completed && !set.isWarmup && set.weight > max) max = set.weight;
      }
    }
  }
  return max;
}

function getWeeklyProgressionRate(exerciseId: string, sessions: ReturnType<typeof useWorkoutStore.getState>['workoutSessions']): number {
  const relevant = sessions
    .filter(s => s.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  if (relevant.length < 2) return 0;
  const first = relevant[0];
  const last = relevant[relevant.length - 1];
  const firstMax = Math.max(...first.exercises.find(e => e.exerciseId === exerciseId)!.sets.filter(s => s.completed && !s.isWarmup).map(s => s.weight), 0);
  const lastMax = Math.max(...last.exercises.find(e => e.exerciseId === exerciseId)!.sets.filter(s => s.completed && !s.isWarmup).map(s => s.weight), 0);
  const weeks = Math.max(1, differenceInWeeks(new Date(last.startTime), new Date(first.startTime)));
  return (lastMax - firstMax) / weeks;
}

export function StrengthGoals() {
  const { workoutSessions, strengthGoals, addStrengthGoal, deleteStrengthGoal } = useWorkoutStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetReps, setTargetReps] = useState('8');
  const [deadline, setDeadline] = useState('');

  const allExercises = useMemo(() => {
    const used = new Set(workoutSessions.flatMap(s => s.exercises.map(e => e.exerciseId)));
    return exerciseDatabase.filter(e => used.has(e.id));
  }, [workoutSessions]);

  const goalsWithProgress = useMemo(() => {
    return strengthGoals.map(goal => {
      const currentMax = getExerciseMaxWeight(goal.exerciseId, workoutSessions);
      const weeklyRate = getWeeklyProgressionRate(goal.exerciseId, workoutSessions);
      const progress = goal.startWeight >= goal.targetWeight
        ? 100
        : Math.min(100, Math.round(((currentMax - goal.startWeight) / (goal.targetWeight - goal.startWeight)) * 100));
      const remaining = goal.targetWeight - currentMax;
      const weeksLeft = weeklyRate > 0 ? Math.ceil(remaining / weeklyRate) : null;
      const eta = weeksLeft != null
        ? new Date(Date.now() + weeksLeft * 7 * 24 * 60 * 60 * 1000)
        : null;
      return { ...goal, currentMax, progress: Math.max(0, progress), eta, weeklyRate };
    });
  }, [strengthGoals, workoutSessions]);

  const handleAdd = () => {
    if (!selectedExercise || !targetWeight) return;
    const exercise = exerciseDatabase.find(e => e.id === selectedExercise);
    if (!exercise) return;
    const startWeight = getExerciseMaxWeight(selectedExercise, workoutSessions);
    const goal: StrengthGoal = {
      id: Date.now().toString(),
      exerciseId: selectedExercise,
      exerciseName: exercise.name,
      targetWeight: parseFloat(targetWeight),
      targetReps: parseInt(targetReps) || 1,
      startWeight,
      startDate: new Date().toISOString(),
      deadline: deadline || undefined,
    };
    addStrengthGoal(goal);
    setShowAdd(false);
    setSelectedExercise('');
    setTargetWeight('');
    setTargetReps('8');
    setDeadline('');
  };

  return (
    <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <h3 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Kraftziele</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Ziel hinzufügen
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[hsl(var(--fg-secondary))]">Übung</label>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="w-full rounded-lg border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">Übung wählen...</option>
              {allExercises.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
              {exerciseDatabase.filter(e => !allExercises.find(a => a.id === e.id)).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[hsl(var(--fg-secondary))]">Zielgewicht (kg)</label>
              <input
                type="number"
                value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                placeholder="z.B. 100"
                className="w-full rounded-lg border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[hsl(var(--fg-secondary))]">Wiederholungen</label>
              <input
                type="number"
                value={targetReps}
                onChange={e => setTargetReps(e.target.value)}
                className="w-full rounded-lg border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[hsl(var(--fg-secondary))]">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!selectedExercise || !targetWeight}
              className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
            >
              Ziel speichern
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-xl border border-[hsl(225,10%,16%)] px-4 py-2 text-sm font-medium text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,15%)] transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {goalsWithProgress.length === 0 ? (
        <p className="rounded-xl bg-[hsl(225,12%,13%)] p-4 text-sm text-[hsl(var(--fg-muted))]">
          Noch keine Ziele gesetzt. Füge dein erstes Kraftziel hinzu, z.B. „Bankdrücken 100kg".
        </p>
      ) : (
        <div className="space-y-4">
          {goalsWithProgress.map(goal => (
            <div key={goal.id} className="rounded-xl border border-[hsl(225,10%,14%)] bg-[hsl(225,12%,13%)] p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-[hsl(var(--fg-primary))]">{goal.exerciseName}</p>
                  <p className="text-xs text-[hsl(var(--fg-muted))]">
                    Ziel: {goal.targetWeight}kg × {goal.targetReps} Wdh
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${goal.progress >= 100 ? 'text-emerald-600' : 'text-violet-600'}`}>
                    {goal.progress}%
                  </span>
                  <button
                    onClick={() => deleteStrengthGoal(goal.id)}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200 mb-2">
                <div
                  className={`h-full rounded-full transition-all ${goal.progress >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[hsl(var(--fg-muted))]">
                <span>Aktuell: {goal.currentMax > 0 ? `${goal.currentMax}kg` : 'kein Eintrag'}</span>
                <span>
                  {goal.progress >= 100 ? (
                    <span className="font-medium text-emerald-600">Ziel erreicht!</span>
                  ) : goal.eta ? (
                    `ETA: ${format(goal.eta, 'd. MMM yyyy', { locale: de })}`
                  ) : goal.deadline ? (
                    `Deadline: ${format(parseISO(goal.deadline), 'd. MMM', { locale: de })}`
                  ) : (
                    'Rate: N/A'
                  )}
                </span>
              </div>

              {goal.weeklyRate > 0 && goal.progress < 100 && (
                <p className="mt-1 text-xs text-[hsl(var(--fg-subtle))]">
                  +{goal.weeklyRate.toFixed(1)}kg/Woche aktuell
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
