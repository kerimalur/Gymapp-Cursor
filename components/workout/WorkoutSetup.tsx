'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, GripVertical, Minus, Plus, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { useWorkoutStore } from '@/store/useWorkoutStore';

interface ExerciseSetup {
  exerciseId: string;
  sets: number;
}

interface WorkoutSetupProps {
  trainingDayId: string;
  onStart: (exercises: ExerciseSetup[]) => void;
  onCancel: () => void;
}

export function WorkoutSetup({ trainingDayId, onStart, onCancel }: WorkoutSetupProps) {
  const { trainingDays, customExercises } = useWorkoutStore();
  const allExercises = useMemo(() => [...exerciseDatabase, ...customExercises], [customExercises]);

  const trainingDay = trainingDays.find(d => d.id === trainingDayId);

  const [exercises, setExercises] = useState<ExerciseSetup[]>(() => {
    if (!trainingDay) return [];
    return trainingDay.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.length,
    }));
  });

  const moveExercise = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= exercises.length) return;
    const updated = [...exercises];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setExercises(updated);
  };

  const updateSets = (idx: number, delta: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i === idx ? { ...ex, sets: Math.max(1, Math.min(10, ex.sets + delta)) } : ex
    ));
  };

  const removeExercise = (idx: number) => {
    if (exercises.length <= 1) return;
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);

  if (!trainingDay) return null;

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--bg-primary))]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--bg-secondary))]/95 backdrop-blur-md border-b border-[hsl(var(--border-light))]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="p-2 rounded-xl hover:bg-[hsl(var(--bg-tertiary))] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[hsl(var(--fg-secondary))]" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-[hsl(var(--fg-primary))]">{trainingDay.name}</h1>
              <p className="text-xs text-[hsl(var(--fg-muted))]">{exercises.length} Übungen · {totalSets} Sätze</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-32">
        <p className="text-sm text-[hsl(var(--fg-muted))] mb-2">
          Reihenfolge anpassen und Sätze pro Übung festlegen:
        </p>

        {exercises.map((ex, idx) => {
          const exData = allExercises.find(e => e.id === ex.exerciseId);
          const name = exData?.name || ex.exerciseId;
          const muscles = exData?.muscleGroups.slice(0, 2).join(', ') || '';

          return (
            <div
              key={`${ex.exerciseId}-${idx}`}
              className="rounded-xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-light))] p-4"
            >
              <div className="flex items-center gap-3">
                {/* Order number + grip */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveExercise(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 rounded-lg text-[hsl(var(--fg-subtle))] hover:text-[hsl(var(--fg-primary))] hover:bg-[hsl(var(--bg-tertiary))] disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="w-7 h-7 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => moveExercise(idx, idx + 1)}
                    disabled={idx === exercises.length - 1}
                    className="p-1 rounded-lg text-[hsl(var(--fg-subtle))] hover:text-[hsl(var(--fg-primary))] hover:bg-[hsl(var(--bg-tertiary))] disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Exercise info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[hsl(var(--fg-primary))] truncate">{name}</p>
                  {muscles && <p className="text-xs text-[hsl(var(--fg-muted))] mt-0.5">{muscles}</p>}
                </div>

                {/* Sets control */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateSets(idx, -1)}
                    className="w-8 h-8 rounded-lg bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--border-light))] flex items-center justify-center text-[hsl(var(--fg-secondary))] hover:bg-[hsl(var(--bg-elevated))] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-center w-10">
                    <p className="text-lg font-bold text-[hsl(var(--fg-primary))]">{ex.sets}</p>
                    <p className="text-[9px] text-[hsl(var(--fg-muted))] -mt-1">Sätze</p>
                  </div>
                  <button
                    onClick={() => updateSets(idx, 1)}
                    className="w-8 h-8 rounded-lg bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--border-light))] flex items-center justify-center text-[hsl(var(--fg-secondary))] hover:bg-[hsl(var(--bg-elevated))] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[hsl(var(--bg-secondary))]/95 backdrop-blur-md border-t border-[hsl(var(--border-light))] p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => onStart(exercises)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-5 h-5" />
            Training starten
          </button>
        </div>
      </div>
    </div>
  );
}
