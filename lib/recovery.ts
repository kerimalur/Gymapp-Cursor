import { getMuscleInvolvement } from '@/data/exerciseDatabase';
import type { MuscleGroup, WorkoutSession } from '@/types';

export const RECOVERY_BASE_HOURS: Record<MuscleGroup, number> = {
  chest: 72,
  back: 72,
  shoulders: 48,
  biceps: 48,
  triceps: 48,
  forearms: 24,
  abs: 24,
  quadriceps: 96,
  hamstrings: 72,
  calves: 48,
  glutes: 72,
  traps: 48,
  lats: 72,
  adductors: 48,
  abductors: 48,
  lower_back: 72,
  neck: 24,
};

export const ALL_MUSCLES: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quadriceps',
  'hamstrings',
  'calves',
  'glutes',
  'traps',
  'lats',
  'adductors',
  'abductors',
  'lower_back',
  'neck',
];

export const MUSCLE_NAMES_DE: Record<MuscleGroup, string> = {
  chest: 'Brust',
  back: 'Ruecken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  forearms: 'Unterarme',
  abs: 'Bauch',
  quadriceps: 'Quadrizeps',
  hamstrings: 'Beinbeuger',
  calves: 'Waden',
  glutes: 'Gesaess',
  traps: 'Trapez',
  lats: 'Latissimus',
  adductors: 'Adduktoren',
  abductors: 'Abduktoren',
  lower_back: 'Unterer Ruecken',
  neck: 'Nacken',
};

type RecoveryRole = 'primary' | 'secondary';

interface RecoveryEntry {
  time: Date;
  sets: number;
  avgRir: number;
  role: RecoveryRole;
  exerciseId: string;
}

export interface MuscleRecoverySnapshot {
  recovery: number;
  lastTrainedAt: Date | null;
  hoursLeft: number;
  weightedSets: number;
  exerciseCount: number;
  avgRir: number;
}

export type RecoveryStateKey = 'ready' | 'recovering' | 'fatigued';

export interface RecoveryStateMeta {
  key: RecoveryStateKey;
  label: string;
  description: string;
  accentClass: string;
  softClass: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getRecoveryState(recovery: number): RecoveryStateMeta {
  if (recovery >= 80) {
    return {
      key: 'ready',
      label: 'Bereit',
      description: 'Kann heute wieder belastet werden.',
      accentClass: 'text-emerald-700',
      softClass: 'bg-emerald-50 border-emerald-200',
    };
  }

  if (recovery >= 50) {
    return {
      key: 'recovering',
      label: 'Laedt auf',
      description: 'Noch etwas Zeit fuer volle Frische.',
      accentClass: 'text-amber-700',
      softClass: 'bg-amber-50 border-amber-200',
    };
  }

  return {
    key: 'fatigued',
    label: 'Belastet',
    description: 'Lieber noch Regeneration mitnehmen.',
    accentClass: 'text-rose-700',
    softClass: 'bg-rose-50 border-rose-200',
  };
}

export function calculateRecoveryFromWorkouts(
  sessions: WorkoutSession[],
  now: Date = new Date()
): Record<MuscleGroup, MuscleRecoverySnapshot> {
  const entries: Record<MuscleGroup, RecoveryEntry[]> = {} as Record<MuscleGroup, RecoveryEntry[]>;
  const result: Record<MuscleGroup, MuscleRecoverySnapshot> = {} as Record<
    MuscleGroup,
    MuscleRecoverySnapshot
  >;

  ALL_MUSCLES.forEach((muscle) => {
    entries[muscle] = [];
    result[muscle] = {
      recovery: 100,
      lastTrainedAt: null,
      hoursLeft: 0,
      weightedSets: 0,
      exerciseCount: 0,
      avgRir: 0,
    };
  });

  sessions.forEach((session) => {
    const sessionTime = session.endTime ? new Date(session.endTime) : new Date(session.startTime);

    session.exercises.forEach((exercise) => {
      const validSets = exercise.sets.filter((set) => set.completed && set.reps > 0);
      if (validSets.length === 0) return;

      const avgRir = validSets.reduce((sum, set) => sum + (set.rir ?? 2), 0) / validSets.length;
      const involvement = getMuscleInvolvement(exercise.exerciseId);

      involvement.forEach(({ muscle, role }) => {
        entries[muscle].push({
          time: sessionTime,
          sets: validSets.length,
          avgRir,
          role,
          exerciseId: exercise.exerciseId,
        });
      });
    });
  });

  ALL_MUSCLES.forEach((muscle) => {
    const muscleEntries = entries[muscle];
    if (muscleEntries.length === 0) return;

    const latestTimestamp = muscleEntries.reduce(
      (max, entry) => Math.max(max, entry.time.getTime()),
      0
    );
    const latestEntries = muscleEntries.filter((entry) => entry.time.getTime() === latestTimestamp);
    const lastTrainedAt = new Date(latestTimestamp);

    const weightedSets = latestEntries.reduce((sum, entry) => {
      const roleWeight = entry.role === 'primary' ? 1 : 0.65;
      return sum + entry.sets * roleWeight;
    }, 0);
    const exerciseCount = new Set(latestEntries.map((entry) => entry.exerciseId)).size;
    const weightedRirSum = latestEntries.reduce(
      (sum, entry) => sum + entry.avgRir * entry.sets,
      0
    );
    const totalRawSets = latestEntries.reduce((sum, entry) => sum + entry.sets, 0);
    const avgRir = totalRawSets > 0 ? weightedRirSum / totalRawSets : 2;

    // Duration model:
    // - every trained muscle starts at 0% recovery
    // - more weighted sets -> longer
    // - more exercises for same muscle -> longer
    // - lower RIR -> longer, higher RIR -> shorter
    const baseHours = RECOVERY_BASE_HOURS[muscle];
    const setFactor = 1 + Math.max(0, weightedSets - 3) * 0.12;
    const exerciseFactor = 1 + Math.max(0, exerciseCount - 1) * 0.1;
    const rirFactor = clamp(1 + (2 - avgRir) * 0.18, 0.65, 1.5);
    const estimatedDurationHours = baseHours * setFactor * exerciseFactor * rirFactor;

    const hoursSinceTraining = (now.getTime() - lastTrainedAt.getTime()) / (1000 * 60 * 60);
    const recovery = clamp(Math.round((hoursSinceTraining / estimatedDurationHours) * 100), 0, 100);
    const hoursLeft = Math.max(0, Math.ceil(estimatedDurationHours - hoursSinceTraining));

    result[muscle] = {
      recovery,
      lastTrainedAt,
      hoursLeft,
      weightedSets: Math.round(weightedSets * 10) / 10,
      exerciseCount,
      avgRir: Math.round(avgRir * 10) / 10,
    };
  });

  return result;
}
