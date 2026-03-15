import { WorkoutSession } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';

export interface ProgressionSuggestion {
  type:
    | 'increase_weight'
    | 'increase_reps'
    | 'maintain'
    | 'deload'
    | 'first_time'
    | 'stagnation_alert';
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
  volumeChange: number;
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
  durationDiff: number;
  totalVolume: number;
  previousVolume: number;
  volumeChange: number;
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

interface PerformanceSnapshot {
  weight: number;
  reps: number;
  rir?: number;
}

function getWeightIncrement(exerciseId: string) {
  const exercise = exerciseDatabase.find((entry) => entry.id === exerciseId);
  const isCompound =
    exercise?.category === 'push' || exercise?.category === 'pull' || exercise?.category === 'legs';

  return isCompound ? 2.5 : 1.25;
}

function hasMeaningfulProgress(current: PerformanceSnapshot, previous: PerformanceSnapshot) {
  const higherWeight = current.weight > previous.weight;
  const moreRepsAtSameOrHigherWeight =
    current.weight >= previous.weight && current.reps > previous.reps;
  const betterRirAtSameLoad =
    current.weight === previous.weight &&
    current.reps === previous.reps &&
    current.rir !== undefined &&
    previous.rir !== undefined &&
    current.rir > previous.rir;

  return higherWeight || moreRepsAtSameOrHigherWeight || betterRirAtSameLoad;
}

function getSetPerformanceHistory(
  exerciseId: string,
  setIndex: number,
  sessions: WorkoutSession[]
): PerformanceSnapshot[] {
  return sessions
    .map((session) => {
      const exercise = session.exercises.find((entry) => entry.exerciseId === exerciseId);
      const set = exercise?.sets[setIndex];

      if (!set || set.weight <= 0 || set.reps <= 0) {
        return null;
      }

      return {
        weight: set.weight,
        reps: set.reps,
        rir: set.rir,
      };
    })
    .filter(Boolean) as PerformanceSnapshot[];
}

export function getProgressionSuggestion(
  exerciseId: string,
  setIndex: number,
  workoutSessions: WorkoutSession[],
  trainingDayId: string
): ProgressionSuggestion {
  const previousSessions = workoutSessions
    .filter((session) => session.trainingDayId === trainingDayId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (previousSessions.length === 0) {
    return {
      type: 'first_time',
      suggestedWeight: 0,
      suggestedReps: 8,
      message: 'Erstes Training. Starte mit einem leichten Gewicht.',
      reason: 'Keine vorherigen Daten',
      confidence: 'low',
    };
  }

  const performanceHistory = getSetPerformanceHistory(exerciseId, setIndex, previousSessions);
  const lastPerformance = performanceHistory[0];

  if (!lastPerformance) {
    return {
      type: 'first_time',
      suggestedWeight: 0,
      suggestedReps: 8,
      message: 'Neue Uebung. Starte mit einem moderaten Gewicht.',
      reason: 'Keine vorherigen Satzdaten fuer diese Uebung',
      confidence: 'low',
    };
  }

  const lastWeight = lastPerformance.weight;
  const lastReps = lastPerformance.reps;
  const lastRIR = lastPerformance.rir;
  const weightIncrement = getWeightIncrement(exerciseId);
  const recentThree = performanceHistory.slice(0, 3);
  const recentFour = performanceHistory.slice(0, 4);

  const hitTopRepWave =
    recentThree.length >= 3 &&
    recentThree.every((entry) => entry.weight === recentThree[0].weight) &&
    recentThree[0].reps > recentThree[1].reps &&
    recentThree[1].reps > recentThree[2].reps &&
    recentThree[0].reps >= 12 &&
    (recentThree[0].rir ?? 99) <= 1;

  if (hitTopRepWave) {
    const nextReps = Math.max(6, recentThree[0].reps - 4);
    return {
      type: 'increase_weight',
      suggestedWeight: lastWeight + weightIncrement,
      suggestedReps: nextReps,
      message: `${lastWeight + weightIncrement}kg x ${nextReps}`,
      reason:
        '3 Einheiten gleiche Last mit steigenden Wiederholungen. Bei 12+ und RIR 1-0 jetzt Gewicht erhoehen.',
      confidence: 'high',
    };
  }

  const hardStall =
    recentFour.length >= 4 &&
    recentFour.every((entry) => entry.weight === recentFour[0].weight) &&
    recentFour.every((entry) => entry.reps <= recentFour[0].reps) &&
    (lastRIR ?? 99) <= 1;

  if (hardStall) {
    const deloadWeight = Math.round(lastWeight * 0.85 * 4) / 4;
    return {
      type: 'deload',
      suggestedWeight: deloadWeight,
      suggestedReps: lastReps + 2,
      message: `Deload auf ${deloadWeight}kg und sauber neu aufbauen`,
      reason: '4 harte Einheiten ohne echte Bewegung',
      confidence: 'high',
    };
  }

  const noProgressTwice =
    recentThree.length >= 3 &&
    !hasMeaningfulProgress(recentThree[0], recentThree[1]) &&
    !hasMeaningfulProgress(recentThree[1], recentThree[2]);

  if (noProgressTwice) {
    return {
      type: 'stagnation_alert',
      suggestedWeight: lastWeight,
      suggestedReps: Math.max(lastReps + 1, 8),
      message: `Alarm: ${lastWeight}kg muessen wieder vorwaerts gehen`,
      reason:
        '2 Einheiten nacheinander ohne mehr Gewicht, mehr Wiederholungen oder besseren RIR',
      confidence: 'high',
    };
  }

  if (lastRIR !== undefined && lastRIR >= 3) {
    return {
      type: 'increase_weight',
      suggestedWeight: lastWeight + weightIncrement,
      suggestedReps: lastReps,
      message: `${lastWeight + weightIncrement}kg x ${lastReps}`,
      reason: `Letztes Mal ${lastRIR} RIR. Da geht mehr.`,
      confidence: 'high',
    };
  }

  if (lastRIR !== undefined && lastRIR >= 1 && lastReps < 12) {
    return {
      type: 'increase_reps',
      suggestedWeight: lastWeight,
      suggestedReps: lastReps + 1,
      message: `${lastWeight}kg x ${lastReps + 1}`,
      reason: `Letztes Mal ${lastRIR} RIR. Versuche 1 Wiederholung mehr.`,
      confidence: 'high',
    };
  }

  if (lastReps >= 12) {
    const nextReps = Math.max(6, lastReps - 4);
    return {
      type: 'increase_weight',
      suggestedWeight: lastWeight + weightIncrement,
      suggestedReps: nextReps,
      message: `${lastWeight + weightIncrement}kg x ${nextReps}`,
      reason: `${lastReps} Wiederholungen erreicht. Steigere das Gewicht.`,
      confidence: 'high',
    };
  }

  if (lastReps > 0 && lastWeight > 0) {
    return {
      type: 'increase_reps',
      suggestedWeight: lastWeight,
      suggestedReps: lastReps + 1,
      message: `${lastWeight}kg x ${lastReps + 1}`,
      reason: 'Versuche eine Wiederholung mehr.',
      confidence: 'medium',
    };
  }

  return {
    type: 'maintain',
    suggestedWeight: lastWeight,
    suggestedReps: lastReps,
    message: `${lastWeight}kg x ${lastReps}`,
    reason: 'Gleiches Ziel wie letztes Mal',
    confidence: 'medium',
  };
}

export function generateWorkoutSummary(
  currentWorkout: WorkoutSession,
  allSessions: WorkoutSession[]
): WorkoutSummaryData {
  const previousSessions = allSessions
    .filter((session) => session.trainingDayId === currentWorkout.trainingDayId && session.id !== currentWorkout.id)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const previousSession = previousSessions[0];
  const duration = currentWorkout.duration || 0;
  const allDurations = allSessions
    .filter((session) => session.trainingDayId === currentWorkout.trainingDayId && session.duration)
    .map((session) => session.duration || 0);
  const avgDuration =
    allDurations.length > 0
      ? Math.round(allDurations.reduce((sum, value) => sum + value, 0) / allDurations.length)
      : duration;
  const durationDiff = duration - avgDuration;
  const totalVolume = currentWorkout.totalVolume || 0;
  const previousVolume = previousSession?.totalVolume || 0;
  const volumeChange =
    previousVolume > 0 ? Math.round(((totalVolume - previousVolume) / previousVolume) * 100) : 0;

  let totalSetsCompleted = 0;
  let totalReps = 0;

  currentWorkout.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      if (set.completed && !set.isWarmup) {
        totalSetsCompleted += 1;
        totalReps += set.reps;
      }
    });
  });

  const newPRs: { exercise: string; value: string; type: string }[] = [];
  const exerciseInsights: ExerciseInsight[] = currentWorkout.exercises.map((exercise) => {
    const exerciseData = exerciseDatabase.find((entry) => entry.id === exercise.exerciseId);
    const exerciseName = exerciseData?.name || exercise.exerciseId;

    const currentExerciseVolume = exercise.sets
      .filter((set) => set.completed && !set.isWarmup)
      .reduce((sum, set) => sum + set.weight * set.reps, 0);

    const previousExercise = previousSession?.exercises.find(
      (entry) => entry.exerciseId === exercise.exerciseId
    );
    const previousExerciseVolume = previousExercise
      ? previousExercise.sets
          .filter((set) => set.completed && !set.isWarmup)
          .reduce((sum, set) => sum + set.weight * set.reps, 0)
      : 0;

    const exerciseVolumeChange =
      previousExerciseVolume > 0
        ? Math.round(((currentExerciseVolume - previousExerciseVolume) / previousExerciseVolume) * 100)
        : 0;

    const currentMaxWeight = Math.max(
      ...exercise.sets.filter((set) => set.completed && !set.isWarmup).map((set) => set.weight),
      0
    );

    const allTimePreviousMaxWeight = Math.max(
      ...allSessions
        .filter((session) => session.id !== currentWorkout.id)
        .flatMap((session) => session.exercises)
        .filter((entry) => entry.exerciseId === exercise.exerciseId)
        .flatMap((entry) => entry.sets)
        .filter((set) => set.completed && !set.isWarmup)
        .map((set) => set.weight),
      0
    );

    let newPR = false;
    let prType: 'weight' | 'reps' | 'volume' | undefined;
    let prValue: string | undefined;

    if (currentMaxWeight > allTimePreviousMaxWeight && currentMaxWeight > 0) {
      newPR = true;
      prType = 'weight';
      prValue = `${currentMaxWeight}kg`;
      newPRs.push({ exercise: exerciseName, value: `${currentMaxWeight}kg`, type: 'Gewicht' });
    }

    const allTimeMaxVolume = Math.max(
      ...allSessions
        .filter((session) => session.id !== currentWorkout.id)
        .map((session) => {
          const sessionExercise = session.exercises.find(
            (entry) => entry.exerciseId === exercise.exerciseId
          );
          return sessionExercise
            ? sessionExercise.sets
                .filter((set) => set.completed && !set.isWarmup)
                .reduce((sum, set) => sum + set.weight * set.reps, 0)
            : 0;
        }),
      0
    );

    if (currentExerciseVolume > allTimeMaxVolume && currentExerciseVolume > 0 && !newPR) {
      newPR = true;
      prType = 'volume';
      prValue = `${Math.round(currentExerciseVolume)}kg Volumen`;
      newPRs.push({
        exercise: exerciseName,
        value: `${Math.round(currentExerciseVolume)}kg`,
        type: 'Volumen',
      });
    }

    const rirValues = exercise.sets
      .filter((set) => set.completed && set.rir !== undefined)
      .map((set) => set.rir as number);
    const avgRIR =
      rirValues.length > 0
        ? Math.round((rirValues.reduce((sum, value) => sum + value, 0) / rirValues.length) * 10) / 10
        : undefined;

    let suggestion = '';
    if (avgRIR !== undefined && avgRIR >= 3) {
      suggestion = 'Naechstes Mal Gewicht steigern.';
    } else if (avgRIR !== undefined && avgRIR <= 0) {
      suggestion = 'Starke Einheit. Eventuell minimal leichter fuer bessere Technik.';
    } else if (exerciseVolumeChange > 10) {
      suggestion = 'Saubere Steigerung. Genau so weitermachen.';
    } else if (exerciseVolumeChange < -10) {
      suggestion = 'Weniger Volumen als sonst. Erholung oder Deload pruefen.';
    } else {
      suggestion = 'Solide Leistung. Beim naechsten Mal 1 Wiederholung mehr anpeilen.';
    }

    return {
      exerciseId: exercise.exerciseId,
      exerciseName,
      currentVolume: Math.round(currentExerciseVolume),
      previousVolume: Math.round(previousExerciseVolume),
      volumeChange: exerciseVolumeChange,
      newPR,
      prType,
      prValue,
      setsCompleted: exercise.sets.filter((set) => set.completed && !set.isWarmup).length,
      avgRIR,
      suggestion,
    };
  });

  let overallRating: WorkoutSummaryData['overallRating'] = 'average';
  if (newPRs.length >= 2 || volumeChange >= 10) {
    overallRating = 'excellent';
  } else if (newPRs.length >= 1 || volumeChange >= 3) {
    overallRating = 'good';
  } else if (volumeChange < -10) {
    overallRating = 'below_average';
  }

  const motivationalMessages = {
    excellent: [
      'Absolut stark. Neue PRs und mehr Volumen.',
      'Ueberragend. Heute war richtig Zug drin.',
      'Starkes Training. Genau so fuehlen sich Fortschritte an.',
    ],
    good: [
      'Solides Training. Du bewegst dich weiter nach vorn.',
      'Gute Arbeit. Konstanz zahlt sich aus.',
      'Sauber trainiert. Du bleibst auf Kurs.',
    ],
    average: [
      'Training erledigt. Konstanz gewinnt am Ende.',
      'Dranbleiben. Jede Einheit zaehlt.',
      'Durchgezogen. Auch normale Einheiten bauen etwas auf.',
    ],
    below_average: [
      'Nicht der beste Tag, aber du warst da. Das zaehlt.',
      'Schlechtere Tage gehoeren dazu. Morgen sieht oft schon anders aus.',
      'Einheit abgehakt. Erholung mitnehmen und weiter.',
    ],
  };

  const messagePool = motivationalMessages[overallRating];
  const motivationalMessage = messagePool[Math.floor(Math.random() * messagePool.length)];
  const nextWorkoutTips: string[] = [];

  if (newPRs.length > 0) {
    nextWorkoutTips.push(`Neue PRs bei: ${newPRs.map((entry) => entry.exercise).join(', ')}`);
  }

  const highRIRExercises = exerciseInsights.filter(
    (entry) => entry.avgRIR !== undefined && entry.avgRIR >= 3
  );
  if (highRIRExercises.length > 0) {
    nextWorkoutTips.push(
      `Gewicht steigern bei: ${highRIRExercises.map((entry) => entry.exerciseName).join(', ')}`
    );
  }

  const lowRIRExercises = exerciseInsights.filter(
    (entry) => entry.avgRIR !== undefined && entry.avgRIR <= 0
  );
  if (lowRIRExercises.length > 0) {
    nextWorkoutTips.push(
      `Technik pruefen bei: ${lowRIRExercises.map((entry) => entry.exerciseName).join(', ')}`
    );
  }

  if (durationDiff > 15) {
    nextWorkoutTips.push(`Training war ${durationDiff} Minuten laenger als ueblich. Pausen pruefen.`);
  }

  if (nextWorkoutTips.length === 0) {
    nextWorkoutTips.push('Versuche beim naechsten Mal 1 Wiederholung oder 2.5kg mehr.');
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

export function detectStagnation(
  workoutSessions: WorkoutSession[],
  trainingDayId: string
): StagnationInfo[] {
  const sessions = workoutSessions
    .filter((session) => session.trainingDayId === trainingDayId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 6);

  if (sessions.length < 3) {
    return [];
  }

  const stagnations: StagnationInfo[] = [];
  const exerciseIds = new Set(sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId)));

  exerciseIds.forEach((exerciseId) => {
    const performance = sessions
      .map((session) => {
        const exercise = session.exercises.find((entry) => entry.exerciseId === exerciseId);
        if (!exercise) {
          return null;
        }

        const completedSets = exercise.sets.filter((set) => set.completed && !set.isWarmup);
        if (completedSets.length === 0) {
          return null;
        }

        return {
          weight: Math.max(...completedSets.map((set) => set.weight), 0),
          reps: Math.max(...completedSets.map((set) => set.reps), 0),
          rir: completedSets[0].rir,
        };
      })
      .filter(Boolean) as PerformanceSnapshot[];

    const recent = performance.slice(0, 3);
    const stalledTwice =
      recent.length >= 3 &&
      !hasMeaningfulProgress(recent[0], recent[1]) &&
      !hasMeaningfulProgress(recent[1], recent[2]);

    if (!stalledTwice || recent[0].weight <= 0) {
      return;
    }

    const weightIncrement = getWeightIncrement(exerciseId);
    const exercise = exerciseDatabase.find((entry) => entry.id === exerciseId);
    const lastReps = recent[0].reps;

    stagnations.push({
      exerciseId,
      exerciseName: exercise?.name || exerciseId,
      weeksSameWeight: 2,
      lastWeight: recent[0].weight,
      lastReps,
      suggestion:
        lastReps >= 12
          ? `Naechstes Mal ${recent[0].weight + weightIncrement}kg mit ${Math.max(6, lastReps - 4)} Wiederholungen testen.`
          : `Alarm: Seit 2 Einheiten keine echte Steigerung. Plane ${recent[0].weight}kg x ${lastReps + 1} oder ${recent[0].weight + weightIncrement}kg.`,
    });
  });

  return stagnations;
}
