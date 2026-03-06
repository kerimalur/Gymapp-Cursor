import { WorkoutSession, ExerciseSet } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';

// --- Types ---

export interface ProgressionSuggestion {
  type: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload' | 'first_time';
  suggestedWeight: number;
  suggestedReps: number;
  message: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExerciseInsight {
  exerciseId: string;
  exerciseName: string;
  currentVolume: number;
  previousVolume: number;
  volumeChange: number; // percentage
  newPR: boolean;
  prType?: 'weight' | 'reps' | 'volume';
  prValue?: string;
  setsCompleted: number;
  avgRIR?: number;
  suggestion: string;
}

export interface WorkoutSummaryData {
  duration: number;
  avgDuration: number;
  durationDiff: number; // minutes faster/slower
  totalVolume: number;
  previousVolume: number;
  volumeChange: number; // percentage
  exerciseInsights: ExerciseInsight[];
  newPRs: { exercise: string; value: string; type: string }[];
  totalSetsCompleted: number;
  totalReps: number;
  overallRating: 'excellent' | 'good' | 'average' | 'below_average';
  motivationalMessage: string;
  nextWorkoutTips: string[];
}

export interface StagnationInfo {
  exerciseId: string;
  exerciseName: string;
  weeksSameWeight: number;
  lastWeight: number;
  lastReps: number;
  suggestion: string;
}

// --- Progressive Overload Engine ---

/**
 * Get a progression suggestion for a specific exercise based on history
 */
export function getProgressionSuggestion(
  exerciseId: string,
  setIndex: number,
  workoutSessions: WorkoutSession[],
  trainingDayId: string
): ProgressionSuggestion {
  // Find all previous sessions for this training day
  const previousSessions = workoutSessions
    .filter(s => s.trainingDayId === trainingDayId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (previousSessions.length === 0) {
    return {
      type: 'first_time',
      suggestedWeight: 0,
      suggestedReps: 8,
      message: 'Erstes Training! Starte mit einem leichten Gewicht.',
      reason: 'Keine vorherigen Daten',
      confidence: 'low',
    };
  }

  // Get the last completed session's data for this exercise
  const lastSession = previousSessions[0];
  const lastExercise = lastSession.exercises.find(e => e.exerciseId === exerciseId);

  if (!lastExercise || !lastExercise.sets[setIndex]) {
    return {
      type: 'first_time',
      suggestedWeight: 0,
      suggestedReps: 8,
      message: 'Neue Übung! Starte mit einem moderaten Gewicht.',
      reason: 'Keine vorherigen Daten für diese Übung',
      confidence: 'low',
    };
  }

  const lastSet = lastExercise.sets[setIndex];
  const lastWeight = lastSet.weight;
  const lastReps = lastSet.reps;
  const lastRIR = lastSet.rir;

  // Check for stagnation (same weight for 3+ sessions)
  const recentWeights = previousSessions
    .slice(0, 4)
    .map(s => {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      return ex?.sets[setIndex]?.weight || 0;
    })
    .filter(w => w > 0);

  const isStagnating = recentWeights.length >= 3 && 
    recentWeights.every(w => w === recentWeights[0]);

  // Determine exercise type for weight increment
  const exercise = exerciseDatabase.find(e => e.id === exerciseId);
  const isCompound = exercise?.category === 'push' || exercise?.category === 'pull' || exercise?.category === 'legs';
  const weightIncrement = isCompound ? 2.5 : 1.25;

  // Decision logic
  if (isStagnating && recentWeights.length >= 3) {
    // Suggest a deload if stagnating
    return {
      type: 'deload',
      suggestedWeight: Math.round(lastWeight * 0.85 * 4) / 4,
      suggestedReps: lastReps + 2,
      message: `Seit ${recentWeights.length} Trainings bei ${lastWeight}kg. Deload und neu aufbauen.`,
      reason: `Stagnation seit ${recentWeights.length} Sessions`,
      confidence: 'high',
    };
  }

  if (lastRIR !== undefined && lastRIR >= 3) {
    // Had lots of reps in reserve → increase weight
    return {
      type: 'increase_weight',
      suggestedWeight: lastWeight + weightIncrement,
      suggestedReps: lastReps,
      message: `${lastWeight + weightIncrement}kg × ${lastReps}`,
      reason: `Letztes Mal ${lastRIR} RIR – da geht mehr!`,
      confidence: 'high',
    };
  }

  if (lastRIR !== undefined && lastRIR >= 1 && lastReps < 12) {
    // Some reserves, try more reps first
    return {
      type: 'increase_reps',
      suggestedWeight: lastWeight,
      suggestedReps: lastReps + 1,
      message: `${lastWeight}kg × ${lastReps + 1}`,
      reason: `Letztes Mal ${lastRIR} RIR – versuch 1 Rep mehr`,
      confidence: 'high',
    };
  }

  if (lastReps >= 12) {
    // Max reps reached, increase weight and reset reps
    return {
      type: 'increase_weight',
      suggestedWeight: lastWeight + weightIncrement,
      suggestedReps: Math.max(6, lastReps - 4),
      message: `${lastWeight + weightIncrement}kg × ${Math.max(6, lastReps - 4)}`,
      reason: `${lastReps} Reps erreicht – steigere das Gewicht!`,
      confidence: 'high',
    };
  }

  if (lastReps > 0 && lastWeight > 0) {
    // Default: try one more rep
    return {
      type: 'increase_reps',
      suggestedWeight: lastWeight,
      suggestedReps: lastReps + 1,
      message: `${lastWeight}kg × ${lastReps + 1}`,
      reason: 'Versuch eine Wiederholung mehr!',
      confidence: 'medium',
    };
  }

  return {
    type: 'maintain',
    suggestedWeight: lastWeight,
    suggestedReps: lastReps,
    message: `${lastWeight}kg × ${lastReps}`,
    reason: 'Gleiches Ziel wie letztes Mal',
    confidence: 'medium',
  };
}

/**
 * Generate a workout summary comparing current to previous workout
 */
export function generateWorkoutSummary(
  currentWorkout: WorkoutSession,
  allSessions: WorkoutSession[]
): WorkoutSummaryData {
  // Find previous session for same training day
  const previousSessions = allSessions
    .filter(s => s.trainingDayId === currentWorkout.trainingDayId && s.id !== currentWorkout.id)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const previousSession = previousSessions[0];

  // Calculate durations
  const duration = currentWorkout.duration || 0;
  const allDurations = allSessions
    .filter(s => s.trainingDayId === currentWorkout.trainingDayId && s.duration)
    .map(s => s.duration || 0);
  const avgDuration = allDurations.length > 0
    ? Math.round(allDurations.reduce((s, d) => s + d, 0) / allDurations.length)
    : duration;
  const durationDiff = duration - avgDuration;

  // Calculate volumes
  const totalVolume = currentWorkout.totalVolume || 0;
  const previousVolume = previousSession?.totalVolume || 0;
  const volumeChange = previousVolume > 0
    ? Math.round(((totalVolume - previousVolume) / previousVolume) * 100)
    : 0;

  // Count completed sets and reps
  let totalSetsCompleted = 0;
  let totalReps = 0;
  currentWorkout.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      if (set.completed && !set.isWarmup) {
        totalSetsCompleted++;
        totalReps += set.reps;
      }
    });
  });

  // Generate exercise insights and find PRs
  const newPRs: { exercise: string; value: string; type: string }[] = [];
  const exerciseInsights: ExerciseInsight[] = currentWorkout.exercises.map(ex => {
    const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
    const exerciseName = exerciseData?.name || ex.exerciseId;

    // Current exercise volume
    const currentExVolume = ex.sets
      .filter(s => s.completed && !s.isWarmup)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);

    // Previous exercise volume
    const prevEx = previousSession?.exercises.find(e => e.exerciseId === ex.exerciseId);
    const prevExVolume = prevEx
      ? prevEx.sets
        .filter(s => s.completed && !s.isWarmup)
        .reduce((sum, s) => sum + s.weight * s.reps, 0)
      : 0;

    const volChange = prevExVolume > 0
      ? Math.round(((currentExVolume - prevExVolume) / prevExVolume) * 100)
      : 0;

    // Check for new PR (best weight)
    const currentMaxWeight = Math.max(
      ...ex.sets.filter(s => s.completed && !s.isWarmup).map(s => s.weight),
      0
    );

    const allTimePrevMax = Math.max(
      ...allSessions
        .filter(s => s.id !== currentWorkout.id)
        .flatMap(s => s.exercises)
        .filter(e => e.exerciseId === ex.exerciseId)
        .flatMap(e => e.sets)
        .filter(s => s.completed && !s.isWarmup)
        .map(s => s.weight),
      0
    );

    let newPR = false;
    let prType: 'weight' | 'reps' | 'volume' | undefined;
    let prValue: string | undefined;

    if (currentMaxWeight > allTimePrevMax && currentMaxWeight > 0) {
      newPR = true;
      prType = 'weight';
      prValue = `${currentMaxWeight}kg`;
      newPRs.push({ exercise: exerciseName, value: `${currentMaxWeight}kg`, type: 'Gewicht' });
    }

    // Check for volume PR
    const allTimeMaxVolume = Math.max(
      ...allSessions
        .filter(s => s.id !== currentWorkout.id)
        .map(s => {
          const e = s.exercises.find(e => e.exerciseId === ex.exerciseId);
          return e
            ? e.sets.filter(s => s.completed && !s.isWarmup).reduce((sum, s) => sum + s.weight * s.reps, 0)
            : 0;
        }),
      0
    );

    if (currentExVolume > allTimeMaxVolume && currentExVolume > 0 && !newPR) {
      newPR = true;
      prType = 'volume';
      prValue = `${Math.round(currentExVolume)}kg Volumen`;
      newPRs.push({ exercise: exerciseName, value: `${Math.round(currentExVolume)}kg`, type: 'Volumen' });
    }

    // Calculate avg RIR
    const rirValues = ex.sets
      .filter(s => s.completed && s.rir !== undefined)
      .map(s => s.rir!);
    const avgRIR = rirValues.length > 0
      ? Math.round((rirValues.reduce((s, r) => s + r, 0) / rirValues.length) * 10) / 10
      : undefined;

    // Suggestion for next time
    let suggestion = '';
    if (avgRIR !== undefined && avgRIR >= 3) {
      suggestion = 'Nächstes Mal Gewicht steigern!';
    } else if (avgRIR !== undefined && avgRIR <= 0) {
      suggestion = 'Guter Einsatz! Vielleicht etwas weniger für bessere Form.';
    } else if (volChange > 10) {
      suggestion = 'Super Steigerung! Weiter so.';
    } else if (volChange < -10) {
      suggestion = 'Etwas weniger Volumen. Eventuell Erholung oder Deload nötig.';
    } else {
      suggestion = 'Solide Leistung. Nächstes Mal einen Rep mehr probieren.';
    }

    return {
      exerciseId: ex.exerciseId,
      exerciseName,
      currentVolume: Math.round(currentExVolume),
      previousVolume: Math.round(prevExVolume),
      volumeChange: volChange,
      newPR,
      prType,
      prValue,
      setsCompleted: ex.sets.filter(s => s.completed && !s.isWarmup).length,
      avgRIR,
      suggestion,
    };
  });

  // Overall rating
  let overallRating: WorkoutSummaryData['overallRating'] = 'average';
  if (newPRs.length >= 2 || volumeChange >= 10) {
    overallRating = 'excellent';
  } else if (newPRs.length >= 1 || volumeChange >= 3) {
    overallRating = 'good';
  } else if (volumeChange < -10) {
    overallRating = 'below_average';
  }

  // Motivational message
  const messages = {
    excellent: [
      '🔥 Absolut stark! Neue PRs und mehr Volumen – Biest-Modus!',
      '💪 Überragend! Du bist heute über dich hinausgewachsen.',
      '🏆 Was für ein Training! Die Gains kommen!',
    ],
    good: [
      '✅ Solides Training! Du wirst stärker.',
      '💪 Gute Arbeit! Konsistenz zahlt sich aus.',
      '🎯 Gut trainiert! Weiter auf Kurs.',
    ],
    average: [
      '✊ Training erledigt – der Konsistenz-Muskel wächst auch!',
      '💪 Dran bleiben! Jedes Training zählt.',
      '🎯 Durchgezogen! Manchmal reicht das.',
    ],
    below_average: [
      '💡 Nicht dein bestes Training – aber du warst da! Das zählt.',
      '🔄 Jeder hat mal einen schlechten Tag. Morgen wird besser.',
      '💪 Wichtig ist: Du hast trainiert. Erholung und weiter.',
    ],
  };

  const messageList = messages[overallRating];
  const motivationalMessage = messageList[Math.floor(Math.random() * messageList.length)];

  // Next workout tips
  const nextWorkoutTips: string[] = [];

  if (newPRs.length > 0) {
    nextWorkoutTips.push(`Neue PRs bei: ${newPRs.map(p => p.exercise).join(', ')}`);
  }

  const highRIRExercises = exerciseInsights.filter(e => e.avgRIR !== undefined && e.avgRIR >= 3);
  if (highRIRExercises.length > 0) {
    nextWorkoutTips.push(
      `Gewicht steigern bei: ${highRIRExercises.map(e => e.exerciseName).join(', ')}`
    );
  }

  const lowRIRExercises = exerciseInsights.filter(e => e.avgRIR !== undefined && e.avgRIR <= 0);
  if (lowRIRExercises.length > 0) {
    nextWorkoutTips.push(
      `Form verbessern bei: ${lowRIRExercises.map(e => e.exerciseName).join(', ')}`
    );
  }

  if (durationDiff > 15) {
    nextWorkoutTips.push(`Training war ${durationDiff} Min länger als üblich. Kürzere Pausen?`);
  }

  if (nextWorkoutTips.length === 0) {
    nextWorkoutTips.push('Versuche nächstes Mal bei jeder Übung 1 Rep oder 2.5kg mehr.');
  }

  return {
    duration,
    avgDuration,
    durationDiff,
    totalVolume,
    previousVolume,
    volumeChange,
    exerciseInsights,
    newPRs,
    totalSetsCompleted,
    totalReps,
    overallRating,
    motivationalMessage,
    nextWorkoutTips,
  };
}

/**
 * Detect stagnation across exercises
 */
export function detectStagnation(
  workoutSessions: WorkoutSession[],
  trainingDayId: string
): StagnationInfo[] {
  const sessions = workoutSessions
    .filter(s => s.trainingDayId === trainingDayId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 6);

  if (sessions.length < 3) return [];

  const stagnations: StagnationInfo[] = [];
  const exerciseIds = new Set(sessions.flatMap(s => s.exercises.map(e => e.exerciseId)));

  exerciseIds.forEach(exerciseId => {
    const maxWeights = sessions
      .map(s => {
        const ex = s.exercises.find(e => e.exerciseId === exerciseId);
        if (!ex) return null;
        const maxW = Math.max(...ex.sets.filter(s => s.completed && !s.isWarmup).map(s => s.weight), 0);
        const maxR = Math.max(...ex.sets.filter(s => s.completed && !s.isWarmup).map(s => s.reps), 0);
        return { weight: maxW, reps: maxR };
      })
      .filter(Boolean) as { weight: number; reps: number }[];

    if (maxWeights.length < 3) return;

    // Check if top weight hasn't changed in last 3+ sessions
    const sameWeight = maxWeights.slice(0, 3).every(w => w.weight === maxWeights[0].weight);
    const sameReps = maxWeights.slice(0, 3).every(w => w.reps === maxWeights[0].reps);

    if (sameWeight && maxWeights[0].weight > 0) {
      const exercise = exerciseDatabase.find(e => e.id === exerciseId);
      const isCompound = exercise?.category === 'push' || exercise?.category === 'pull' || exercise?.category === 'legs';

      stagnations.push({
        exerciseId,
        exerciseName: exercise?.name || exerciseId,
        weeksSameWeight: maxWeights.filter(w => w.weight === maxWeights[0].weight).length,
        lastWeight: maxWeights[0].weight,
        lastReps: maxWeights[0].reps,
        suggestion: sameReps
          ? `Deload: Gehe auf ${Math.round(maxWeights[0].weight * 0.85)}kg und baue neu auf, oder probiere eine andere Variante.`
          : isCompound
          ? `Versuche ${maxWeights[0].weight + 2.5}kg mit weniger Reps (${Math.max(4, maxWeights[0].reps - 2)}).`
          : `Versuche ${maxWeights[0].weight + 1.25}kg oder mehr Reps (${maxWeights[0].reps + 2}).`,
      });
    }
  });

  return stagnations;
}
