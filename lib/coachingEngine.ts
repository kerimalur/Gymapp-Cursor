/**
 * Coaching Engine – The central brain of FitCoach Pro
 * 
 * Analyzes all user data and generates personalized, actionable coaching insights.
 * Goes beyond simple tracking: proactively detects weaknesses, suggests improvements,
 * grades workouts, calculates momentum, and predicts goal completion.
 */

import { WorkoutSession, MuscleGroup, StrengthGoal, NutritionGoals } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { ALL_MUSCLES, MUSCLE_NAMES_DE, calculateRecoveryFromWorkouts } from '@/lib/recovery';
import { startOfWeek, endOfWeek, isWithinInterval, differenceInDays, differenceInHours, subDays, format } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CoachingPriority = 'critical' | 'high' | 'medium' | 'low' | 'positive';

export type CoachingCategory =
  | 'progressive_overload'
  | 'muscle_balance'
  | 'nutrition'
  | 'recovery'
  | 'consistency'
  | 'technique'
  | 'motivation'
  | 'body_composition';

export interface CoachInsight {
  id: string;
  category: CoachingCategory;
  priority: CoachingPriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  icon: string; // emoji
  timestamp: Date;
}

export interface WorkoutGrade {
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  score: number; // 0-100
  label: string;
  factors: {
    volumeProgression: number;    // Did volume go up?
    intensityScore: number;       // Average RIR proximity
    completionRate: number;       // Sets completed vs planned
    exerciseVariety: number;      // Hit multiple muscle groups?
    consistency: number;          // On schedule?
  };
  highlights: string[];
  improvements: string[];
}

export interface MomentumData {
  score: number; // 0-100
  trend: 'rising' | 'steady' | 'declining';
  streak: number; // consecutive weeks with training
  factors: {
    consistency: number;       // 0-25
    progression: number;       // 0-25  
    nutrition: number;         // 0-25
    recovery: number;          // 0-25
  };
  weeklyChange: number; // +/- points from last week
  message: string;
}

export interface WeakPointAnalysis {
  muscle: MuscleGroup;
  muscleName: string;
  weeklyVolume: number; // total sets in last 7 days
  recommendedVolume: number; // minimum effective volume
  deficit: number; // how many sets short
  severity: 'critical' | 'warning' | 'mild';
  suggestedExercises: { name: string; sets: number; reps: string }[];
}

export interface BodyCompositionInsight {
  estimatedBF: number | null; // rough estimate based on lifts & weight
  leanMassTrend: 'gaining' | 'stable' | 'losing' | 'unknown';
  recommendation: string;
  calorieAdjustment: number; // kcal/day suggested change
}

export interface WeeklyCoachReport {
  weekNumber: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  totalVolume: number;
  volumeChange: number; // % from previous week
  avgGrade: string;
  momentumScore: number;
  topInsights: CoachInsight[];
  weakPoints: WeakPointAnalysis[];
  achievementsUnlocked: string[];
  coachMessage: string;
}

// ─── Minimum Effective Volume per muscle (sets/week) ──────────────────────

const MIN_EFFECTIVE_VOLUME: Record<string, number> = {
  chest: 10,
  back: 10,
  shoulders: 8,
  lats: 10,
  upper_back: 8,
  biceps: 6,
  triceps: 6,
  forearms: 4,
  abs: 6,
  quadriceps: 10,
  hamstrings: 8,
  glutes: 8,
  calves: 6,
  traps: 4,
  lower_back: 4,
  adductors: 4,
  abductors: 4,
  neck: 2,
  obliques: 4,
};

// Suggested exercises per muscle group
const MUSCLE_EXERCISES: Record<string, { name: string; sets: number; reps: string }[]> = {
  chest: [
    { name: 'Bankdrücken', sets: 4, reps: '6-10' },
    { name: 'Schrägbankdrücken', sets: 3, reps: '8-12' },
    { name: 'Cable Flys', sets: 3, reps: '12-15' },
  ],
  back: [
    { name: 'Klimmzüge', sets: 4, reps: '6-10' },
    { name: 'Langhantelrudern', sets: 4, reps: '8-12' },
    { name: 'Kabelrudern', sets: 3, reps: '10-12' },
  ],
  lats: [
    { name: 'Lat Pulldown', sets: 4, reps: '8-12' },
    { name: 'Klimmzüge', sets: 3, reps: '6-10' },
  ],
  upper_back: [
    { name: 'Face Pulls', sets: 3, reps: '15-20' },
    { name: 'Reverse Flys', sets: 3, reps: '12-15' },
  ],
  shoulders: [
    { name: 'Überkopfdrücken', sets: 4, reps: '6-10' },
    { name: 'Seitheben', sets: 4, reps: '12-20' },
    { name: 'Face Pulls', sets: 3, reps: '15-20' },
  ],
  biceps: [
    { name: 'Langhantelcurls', sets: 3, reps: '8-12' },
    { name: 'Hammercurls', sets: 3, reps: '10-12' },
  ],
  triceps: [
    { name: 'Trizepsdrücken', sets: 3, reps: '10-12' },
    { name: 'Overhead Extension', sets: 3, reps: '10-15' },
  ],
  forearms: [
    { name: 'Hammercurls', sets: 3, reps: '12-15' },
    { name: 'Handgelenk-Curls', sets: 2, reps: '15-20' },
  ],
  abs: [
    { name: 'Cable Crunches', sets: 3, reps: '12-15' },
    { name: 'Hanging Leg Raise', sets: 3, reps: '10-15' },
  ],
  quadriceps: [
    { name: 'Kniebeuge', sets: 4, reps: '6-10' },
    { name: 'Leg Press', sets: 3, reps: '8-12' },
    { name: 'Beinstrecker', sets: 3, reps: '12-15' },
  ],
  hamstrings: [
    { name: 'Rumänisches Kreuzheben', sets: 4, reps: '8-12' },
    { name: 'Beinbeuger', sets: 3, reps: '10-12' },
  ],
  glutes: [
    { name: 'Hip Thrusts', sets: 4, reps: '8-12' },
    { name: 'Ausfallschritte', sets: 3, reps: '10-12 pro Seite' },
  ],
  calves: [
    { name: 'Wadenheben stehend', sets: 4, reps: '12-20' },
    { name: 'Wadenheben sitzend', sets: 3, reps: '15-20' },
  ],
  traps: [
    { name: 'Shrugs', sets: 3, reps: '12-15' },
    { name: 'Face Pulls', sets: 3, reps: '15-20' },
  ],
  lower_back: [
    { name: 'Hyperextensions', sets: 3, reps: '12-15' },
    { name: 'Good Mornings', sets: 3, reps: '10-12' },
  ],
  obliques: [
    { name: 'Russian Twists', sets: 3, reps: '15-20' },
    { name: 'Seitliches Planken', sets: 3, reps: '30-45s' },
  ],
};

// ─── Core Engine Functions ──────────────────────────────────────────────────

/**
 * Calculate Momentum Score – A unique composite metric showing
 * if the user is trending up or down across all fitness dimensions.
 */
export function calculateMomentum(
  workoutSessions: WorkoutSession[],
  nutritionData: { caloriesConsumed: number; proteinConsumed: number; goals: NutritionGoals | null },
  recoveryMap: Record<string, { recovery: number }>,
  weeklyGoal: number,
): MomentumData {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subDays(thisWeekStart, 7);
  const twoWeeksAgo = subDays(thisWeekStart, 14);

  // ── Consistency Score (0-25) ──
  const thisWeekWorkouts = workoutSessions.filter(s =>
    isWithinInterval(new Date(s.startTime), { start: thisWeekStart, end: now })
  ).length;
  const lastWeekWorkouts = workoutSessions.filter(s =>
    isWithinInterval(new Date(s.startTime), { start: lastWeekStart, end: thisWeekStart })
  ).length;
  
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const expectedByNow = Math.ceil(weeklyGoal * (dayOfWeek / 7));
  const consistencyRatio = expectedByNow > 0 ? Math.min(thisWeekWorkouts / expectedByNow, 1.2) : (thisWeekWorkouts > 0 ? 1 : 0);
  const consistency = Math.round(Math.min(consistencyRatio * 25, 25));

  // ── Progression Score (0-25) ──
  const lastTwoWeeksSessions = workoutSessions.filter(s =>
    isWithinInterval(new Date(s.startTime), { start: twoWeeksAgo, end: now })
  );
  const thisWeekVolume = workoutSessions
    .filter(s => isWithinInterval(new Date(s.startTime), { start: thisWeekStart, end: now }))
    .reduce((sum, s) => sum + s.totalVolume, 0);
  const lastWeekVolume = workoutSessions
    .filter(s => isWithinInterval(new Date(s.startTime), { start: lastWeekStart, end: thisWeekStart }))
    .reduce((sum, s) => sum + s.totalVolume, 0);
  
  let progressionScore = 12; // neutral
  if (lastWeekVolume > 0) {
    const volumeChange = (thisWeekVolume - lastWeekVolume) / lastWeekVolume;
    if (volumeChange > 0.05) progressionScore = 25;
    else if (volumeChange > 0) progressionScore = 20;
    else if (volumeChange > -0.05) progressionScore = 15;
    else progressionScore = 5;
  }

  // ── Nutrition Score (0-25) ──
  let nutritionScore = 12;
  if (nutritionData.goals) {
    const calRatio = nutritionData.goals.dailyCalories > 0 
      ? nutritionData.caloriesConsumed / nutritionData.goals.dailyCalories 
      : 0;
    const protRatio = nutritionData.goals.dailyProtein > 0 
      ? nutritionData.proteinConsumed / nutritionData.goals.dailyProtein 
      : 0;
    // Ideal: 0.9-1.1 for calories, >0.9 for protein
    const calScore = calRatio >= 0.9 && calRatio <= 1.1 ? 12 : calRatio >= 0.8 && calRatio <= 1.2 ? 8 : 4;
    const protScore = protRatio >= 0.9 ? 13 : protRatio >= 0.7 ? 8 : 3;
    nutritionScore = calScore + protScore;
  }

  // ── Recovery Score (0-25) ──
  const allRecoveries = Object.values(recoveryMap).map(r => r.recovery);
  const avgRecovery = allRecoveries.length > 0 
    ? allRecoveries.reduce((a, b) => a + b, 0) / allRecoveries.length 
    : 50;
  const recoveryScore = Math.round((avgRecovery / 100) * 25);

  const totalScore = Math.min(consistency + progressionScore + nutritionScore + recoveryScore, 100);

  // ── Calculate streak (consecutive weeks with at least 1 workout) ──
  let streak = 0;
  let checkWeekStart = thisWeekStart;
  while (true) {
    const checkWeekEnd = new Date(checkWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const hasWorkout = workoutSessions.some(s =>
      isWithinInterval(new Date(s.startTime), { start: checkWeekStart, end: checkWeekEnd })
    );
    if (hasWorkout) {
      streak++;
      checkWeekStart = subDays(checkWeekStart, 7);
    } else break;
  }

  // ── Trend ──
  const lastWeekScore = lastWeekWorkouts >= weeklyGoal ? 70 : lastWeekWorkouts > 0 ? 50 : 20;
  const trend: MomentumData['trend'] = 
    totalScore > lastWeekScore + 5 ? 'rising' : 
    totalScore < lastWeekScore - 5 ? 'declining' : 'steady';

  // ── Message ──
  let message: string;
  if (totalScore >= 80) message = 'Du bist on fire! Weiter so, dein Körper dankt es dir.';
  else if (totalScore >= 60) message = 'Guter Fortschritt! Kleine Anpassungen für noch mehr Power.';
  else if (totalScore >= 40) message = 'Du machst was – aber da geht mehr! Schau auf die Schwächen.';
  else if (totalScore >= 20) message = 'Dein Momentum sinkt. Lass uns das wieder aufbauen!';
  else message = 'Zeit für einen Neustart. Ein Training heute ändert alles!';

  return {
    score: totalScore,
    trend,
    streak,
    factors: {
      consistency,
      progression: progressionScore,
      nutrition: nutritionScore,
      recovery: recoveryScore,
    },
    weeklyChange: totalScore - lastWeekScore,
    message,
  };
}

/**
 * Grade a workout session A-F based on quality metrics
 */
export function gradeWorkout(
  session: WorkoutSession,
  previousSessions: WorkoutSession[],
  weeklyGoal: number,
): WorkoutGrade {
  const highlights: string[] = [];
  const improvements: string[] = [];

  // ── Volume Progression (0-20) ──
  const prevSameDay = previousSessions
    .filter(s => s.trainingDayId === session.trainingDayId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
  
  let volumeProgression = 10;
  if (prevSameDay) {
    const volChange = prevSameDay.totalVolume > 0 
      ? (session.totalVolume - prevSameDay.totalVolume) / prevSameDay.totalVolume
      : 0;
    if (volChange > 0.1) { volumeProgression = 20; highlights.push('Volumen deutlich gestiegen!'); }
    else if (volChange > 0) { volumeProgression = 16; highlights.push('Volumen leicht gestiegen'); }
    else if (volChange > -0.05) { volumeProgression = 12; }
    else { volumeProgression = 5; improvements.push('Volumen ist gefallen – war es ein schwerer Tag?'); }
  }

  // ── Intensity Score (0-20) ──
  let totalRIR = 0;
  let rirCount = 0;
  session.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      if (set.completed && set.rir !== undefined) {
        totalRIR += set.rir;
        rirCount++;
      }
    });
  });
  const avgRIR = rirCount > 0 ? totalRIR / rirCount : 3;
  let intensityScore: number;
  if (avgRIR <= 1.5) { intensityScore = 20; highlights.push('Hohe Intensität – nah am Muskelversagen trainiert'); }
  else if (avgRIR <= 2.5) { intensityScore = 16; }
  else if (avgRIR <= 3.5) { intensityScore = 12; improvements.push('Etwas näher ans Limit gehen für mehr Reiz'); }
  else { intensityScore = 6; improvements.push('Höhere Intensität = mehr Muskelwachstum'); }

  // ── Completion Rate (0-20) ──
  let totalSets = 0;
  let completedSets = 0;
  session.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      totalSets++;
      if (set.completed) completedSets++;
    });
  });
  const completionRate = totalSets > 0 ? (completedSets / totalSets) * 20 : 0;
  if (completedSets === totalSets && totalSets > 0) highlights.push('Alle Sätze durchgezogen!');
  if (completionRate < 15 && totalSets > 0) improvements.push('Probiere alle geplanten Sätze zu schaffen');

  // ── Exercise Variety (0-20) ──
  const musclesHit = new Set<string>();
  session.exercises.forEach(ex => {
    const dbEx = exerciseDatabase.find(e => e.id === ex.exerciseId);
    dbEx?.muscleGroups.forEach(m => musclesHit.add(m));
  });
  const varietyScore = Math.min((musclesHit.size / 4) * 20, 20);
  if (musclesHit.size >= 5) highlights.push(`${musclesHit.size} verschiedene Muskeln trainiert`);

  // ── Consistency Bonus (0-20) ──
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekWorkouts = previousSessions.filter(s =>
    isWithinInterval(new Date(s.startTime), { start: weekStart, end: now })
  ).length + 1; // include this session
  const consistencyScore = Math.min((weekWorkouts / weeklyGoal) * 20, 20);
  if (weekWorkouts >= weeklyGoal) highlights.push('Wochenziel erreicht!');

  const totalScore = Math.round(volumeProgression + intensityScore + completionRate + varietyScore + consistencyScore);

  let grade: WorkoutGrade['grade'];
  let label: string;
  if (totalScore >= 90) { grade = 'S'; label = 'Legendär'; }
  else if (totalScore >= 80) { grade = 'A'; label = 'Exzellent'; }
  else if (totalScore >= 65) { grade = 'B'; label = 'Gut'; }
  else if (totalScore >= 50) { grade = 'C'; label = 'Solide'; }
  else if (totalScore >= 35) { grade = 'D'; label = 'Verbesserbar'; }
  else { grade = 'F'; label = 'Schwach'; }

  return {
    grade,
    score: totalScore,
    label,
    factors: {
      volumeProgression,
      intensityScore,
      completionRate: Math.round(completionRate),
      exerciseVariety: Math.round(varietyScore),
      consistency: Math.round(consistencyScore),
    },
    highlights,
    improvements,
  };
}

/**
 * Analyze weak points – muscles that aren't getting enough volume
 */
export function analyzeWeakPoints(
  workoutSessions: WorkoutSession[],
  enabledMuscles: MuscleGroup[],
): WeakPointAnalysis[] {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const recentSessions = workoutSessions.filter(s =>
    new Date(s.startTime) >= weekAgo
  );

  // Count sets per muscle in last 7 days
  const muscleVolume: Record<string, number> = {};
  enabledMuscles.forEach(m => { muscleVolume[m] = 0; });

  recentSessions.forEach(session => {
    session.exercises.forEach(ex => {
      const dbEx = exerciseDatabase.find(e => e.id === ex.exerciseId);
      if (!dbEx) return;
      const completedSets = ex.sets.filter(s => s.completed && !s.isWarmup).length;
      dbEx.muscleGroups.forEach(muscle => {
        if (muscleVolume[muscle] !== undefined) {
          // Primary muscles get full credit, secondary get 0.5
          const isPrimary = dbEx.muscles?.some(m => m.muscle === muscle && m.role === 'primary');
          muscleVolume[muscle] += completedSets * (isPrimary ? 1 : 0.5);
        }
      });
    });
  });

  const weakPoints: WeakPointAnalysis[] = [];

  enabledMuscles.forEach(muscle => {
    const current = muscleVolume[muscle] || 0;
    const recommended = MIN_EFFECTIVE_VOLUME[muscle] || 6;
    const deficit = Math.max(recommended - current, 0);
    
    if (deficit > 0) {
      let severity: WeakPointAnalysis['severity'];
      if (current === 0) severity = 'critical';
      else if (current < recommended * 0.5) severity = 'warning';
      else severity = 'mild';

      weakPoints.push({
        muscle,
        muscleName: MUSCLE_NAMES_DE[muscle] || muscle,
        weeklyVolume: Math.round(current),
        recommendedVolume: recommended,
        deficit: Math.round(deficit),
        severity,
        suggestedExercises: MUSCLE_EXERCISES[muscle] || [
          { name: 'Übung für ' + (MUSCLE_NAMES_DE[muscle] || muscle), sets: 3, reps: '8-12' }
        ],
      });
    }
  });

  return weakPoints.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, mild: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Smart calorie adjustment based on weight trends
 */
export function getCalorieAdjustment(
  weightEntries: { date: Date; weight: number }[],
  goal: 'lose' | 'gain' | 'maintain',
  currentCalories: number,
): { adjustment: number; message: string } {
  if (weightEntries.length < 3) {
    return { adjustment: 0, message: 'Noch nicht genug Daten – tracke mindestens 3 Gewichtsmessungen.' };
  }

  const sorted = [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentAvg = sorted.slice(0, 3).reduce((s, e) => s + e.weight, 0) / 3;
  const olderAvg = sorted.length >= 6 
    ? sorted.slice(3, 6).reduce((s, e) => s + e.weight, 0) / Math.min(sorted.length - 3, 3)
    : sorted[sorted.length - 1].weight;

  const weeklyChange = (recentAvg - olderAvg) / Math.max(differenceInDays(new Date(sorted[0].date), new Date(sorted[sorted.length - 1].date)) / 7, 1);

  if (goal === 'lose') {
    if (weeklyChange > 0.1) {
      return { adjustment: -200, message: `Du nimmst ~${weeklyChange.toFixed(1)}kg/Woche zu. 200 kcal weniger pro Tag empfohlen.` };
    }
    if (weeklyChange > -0.3) {
      return { adjustment: -100, message: 'Der Gewichtsverlust ist langsam. Leichtes Kaloriendefizit empfohlen.' };
    }
    if (weeklyChange < -1) {
      return { adjustment: 150, message: 'Zu schneller Gewichtsverlust! Etwas mehr essen um Muskeln zu schützen.' };
    }
    return { adjustment: 0, message: 'Perfektes Tempo beim Abnehmen. Weiter so!' };
  }

  if (goal === 'gain') {
    if (weeklyChange < -0.1) {
      return { adjustment: 300, message: `Du verlierst Gewicht! 300 kcal mehr pro Tag für Muskelaufbau.` };
    }
    if (weeklyChange < 0.2) {
      return { adjustment: 150, message: 'Gewichtszunahme zu langsam für effektiven Aufbau. Mehr essen!' };
    }
    if (weeklyChange > 0.7) {
      return { adjustment: -150, message: 'Zu schnelle Zunahme – Fett-Anteil steigt. Etwas weniger essen.' };
    }
    return { adjustment: 0, message: 'Gutes Tempo für Muskelaufbau!' };
  }

  // maintain
  if (Math.abs(weeklyChange) > 0.3) {
    const dir = weeklyChange > 0 ? 'zu' : 'ab';
    const adj = weeklyChange > 0 ? -100 : 100;
    return { adjustment: adj, message: `Gewicht nimmt ${dir}. Kleine Kalorienanpassung empfohlen.` };
  }
  return { adjustment: 0, message: 'Gewicht bleibt stabil. Perfekt!' };
}

/**
 * Generate all coaching insights – the main function called by the dashboard
 */
export function generateCoachInsights(
  workoutSessions: WorkoutSession[],
  nutritionData: {
    caloriesConsumed: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatsConsumed: number;
    waterIntake: number;
    goals: NutritionGoals | null;
    sleepHours?: number;
    sleepQuality?: number;
  },
  enabledMuscles: MuscleGroup[],
  weeklyGoal: number,
  strengthGoals: StrengthGoal[],
  bodyWeightGoal: { targetWeight: number; startWeight: number } | null,
): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const hour = now.getHours();

  // ── 1. Training Consistency Check ──
  const weekWorkouts = workoutSessions.filter(s =>
    isWithinInterval(new Date(s.startTime), { start: weekStart, end: now })
  ).length;
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const expectedByNow = Math.ceil(weeklyGoal * (dayOfWeek / 7));

  if (weekWorkouts < expectedByNow && dayOfWeek >= 3) {
    insights.push({
      id: 'consistency-behind',
      category: 'consistency',
      priority: weekWorkouts === 0 ? 'critical' : 'high',
      title: weekWorkouts === 0 ? 'Noch kein Training diese Woche!' : 'Training nachholen',
      message: weekWorkouts === 0 
        ? `Es ist ${['Mo','Di','Mi','Do','Fr','Sa','So'][dayOfWeek-1]} und du hast noch nicht trainiert. Jedes Training zählt!`
        : `${weekWorkouts}/${weeklyGoal} Trainings – du bist ${expectedByNow - weekWorkouts} hinterher. Noch ${weeklyGoal - weekWorkouts} übrig!`,
      actionLabel: 'Training starten',
      actionRoute: '/tracker',
      icon: '⚡',
      timestamp: now,
    });
  }

  if (weekWorkouts >= weeklyGoal) {
    insights.push({
      id: 'consistency-achieved',
      category: 'consistency',
      priority: 'positive',
      title: 'Wochenziel erreicht!',
      message: `${weekWorkouts} Trainings diese Woche – stark! Dein Körper transformiert sich gerade.`,
      icon: '🏆',
      timestamp: now,
    });
  }

  // ── 2. Muscle Weak Points ──
  const weakPoints = analyzeWeakPoints(workoutSessions, enabledMuscles);
  const criticalWeaknesses = weakPoints.filter(w => w.severity === 'critical');
  const warningWeaknesses = weakPoints.filter(w => w.severity === 'warning');

  if (criticalWeaknesses.length > 0) {
    const names = criticalWeaknesses.slice(0, 3).map(w => w.muscleName).join(', ');
    insights.push({
      id: 'muscle-critical',
      category: 'muscle_balance',
      priority: 'critical',
      title: `${criticalWeaknesses.length} Muskeln untrainiert!`,
      message: `${names} ${criticalWeaknesses.length > 1 ? 'haben' : 'hat'} diese Woche 0 Sätze bekommen. Das bremst dich!`,
      actionLabel: 'Schwächen beheben',
      actionRoute: '/muscle-balance',
      icon: '🚨',
      timestamp: now,
    });
  }

  if (warningWeaknesses.length > 0) {
    const names = warningWeaknesses.slice(0, 3).map(w => w.muscleName).join(', ');
    insights.push({
      id: 'muscle-warning',
      category: 'muscle_balance',
      priority: 'medium',
      title: 'Untertrainierte Muskeln',
      message: `${names}: zu wenig Volumen für optimales Wachstum. Mehr Sätze einbauen!`,
      actionLabel: 'Übungsvorschläge',
      actionRoute: '/muscle-balance',
      icon: '⚠️',
      timestamp: now,
    });
  }

  // ── 3. Nutrition Coaching ──
  if (nutritionData.goals) {
    const { caloriesConsumed, proteinConsumed, goals, waterIntake } = nutritionData;
    
    // Calorie overshoot after 6PM
    if (hour >= 18 && caloriesConsumed > goals.dailyCalories + 300) {
      insights.push({
        id: 'nutrition-over',
        category: 'nutrition',
        priority: 'high',
        title: 'Kalorienüberschuss!',
        message: `${Math.round(caloriesConsumed - goals.dailyCalories)} kcal über dem Ziel. Vorsicht beim Abendessen!`,
        actionLabel: 'Ernährung prüfen',
        actionRoute: '/nutrition',
        icon: '🍔',
        timestamp: now,
      });
    }

    // Protein check mid-day
    if (hour >= 14 && proteinConsumed < goals.dailyProtein * 0.4) {
      insights.push({
        id: 'nutrition-protein',
        category: 'nutrition',
        priority: 'high',
        title: 'Protein-Defizit!',
        message: `Erst ${Math.round(proteinConsumed)}g von ${goals.dailyProtein}g Protein. Muskeln brauchen Protein zum Wachsen!`,
        actionLabel: 'Mahlzeit loggen',
        actionRoute: '/nutrition',
        icon: '🥩',
        timestamp: now,
      });
    }

    // Water intake
    const expectedWater = (hour / 24) * goals.waterGoal;
    if (waterIntake < expectedWater * 0.5 && hour >= 12) {
      insights.push({
        id: 'nutrition-water',
        category: 'nutrition',
        priority: 'medium',
        title: 'Mehr trinken!',
        message: `${(waterIntake / 1000).toFixed(1)}L getrunken – Ziel ${(goals.waterGoal / 1000).toFixed(1)}L. Dehydration killt Performance!`,
        actionLabel: 'Wasser tracken',
        actionRoute: '/nutrition',
        icon: '💧',
        timestamp: now,
      });
    }

    // Good nutrition day
    if (
      Math.abs(caloriesConsumed - goals.dailyCalories) <= 150 &&
      proteinConsumed >= goals.dailyProtein * 0.9 &&
      hour >= 20
    ) {
      insights.push({
        id: 'nutrition-perfect',
        category: 'nutrition',
        priority: 'positive',
        title: 'Perfekter Ernährungstag!',
        message: `Kalorien und Protein on point. So baut man einen Traumkörper!`,
        icon: '✅',
        timestamp: now,
      });
    }
  }

  // ── 4. Recovery-Based Suggestions ──
  const recoveryMap = calculateRecoveryFromWorkouts(workoutSessions);
  const tiredCount = enabledMuscles.filter(m => recoveryMap[m].recovery < 50).length;
  
  if (tiredCount >= Math.ceil(enabledMuscles.length * 0.5)) {
    insights.push({
      id: 'recovery-overtraining',
      category: 'recovery',
      priority: 'critical',
      title: 'Übertraining-Warnung!',
      message: `${tiredCount} von ${enabledMuscles.length} Muskeln unter 50% erholt. Ein Ruhetag könnte mehr bringen als Training!`,
      actionLabel: 'Regeneration prüfen',
      actionRoute: '/recovery',
      icon: '🛑',
      timestamp: now,
    });
  }

  // ── 5. Sleep Impact ──
  if (nutritionData.sleepHours !== undefined && nutritionData.sleepHours < 7) {
    insights.push({
      id: 'sleep-warning',
      category: 'recovery',
      priority: 'high',
      title: 'Schlafmangel bremst dich!',
      message: `Nur ${nutritionData.sleepHours}h geschlafen. Weniger als 7h = bis zu 30% weniger Muskelwachstum!`,
      icon: '😴',
      timestamp: now,
    });
  }

  // ── 6. Progressive Overload Stagnation ──
  const exerciseStagnation = detectStagnation(workoutSessions);
  if (exerciseStagnation.length > 0) {
    const names = exerciseStagnation.slice(0, 2).map(e => e.name).join(', ');
    insights.push({
      id: 'stagnation',
      category: 'progressive_overload',
      priority: 'high',
      title: 'Stagnation erkannt!',
      message: `${names}: seit ${exerciseStagnation[0].weeks} Wochen kein Fortschritt. Zeit für mehr Gewicht oder eine neue Technik!`,
      actionLabel: 'Training anpassen',
      actionRoute: '/tracker',
      icon: '📊',
      timestamp: now,
    });
  }

  // ── 7. Strength Goal Progress ──
  strengthGoals.forEach(goal => {
    const bestSession = findBestPerformance(workoutSessions, goal.exerciseId);
    if (bestSession) {
      const progress = ((bestSession.weight - goal.startWeight) / (goal.targetWeight - goal.startWeight)) * 100;
      if (progress >= 90 && progress < 100) {
        insights.push({
          id: `goal-close-${goal.id}`,
          category: 'motivation',
          priority: 'positive',
          title: `Fast am Ziel: ${goal.exerciseName}!`,
          message: `${Math.round(progress)}% erreicht! Nur noch ${(goal.targetWeight - bestSession.weight).toFixed(1)}kg bis zum Ziel!`,
          actionLabel: 'Training starten',
          actionRoute: '/workout',
          icon: '🎯',
          timestamp: now,
        });
      }
    }
  });

  // ── 8. Body Composition Guidance ──
  if (bodyWeightGoal) {
    const isLosing = bodyWeightGoal.targetWeight < bodyWeightGoal.startWeight;
    if (isLosing && nutritionData.goals && nutritionData.caloriesConsumed > nutritionData.goals.dailyCalories) {
      insights.push({
        id: 'bodycomp-calorie-mismatch',
        category: 'body_composition',
        priority: 'high',
        title: 'Ziel Abnehmen – aber Kalorienplus!',
        message: `Du willst abnehmen, isst aber über deinem Ziel. Dein Defizit ist der Schlüssel!`,
        actionLabel: 'Ernährung planen',
        actionRoute: '/nutrition',
        icon: '⚖️',
        timestamp: now,
      });
    }
  }

  // Sort by priority
  const priorityOrder: Record<CoachingPriority, number> = {
    critical: 0, high: 1, medium: 2, low: 3, positive: 4,
  };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function detectStagnation(sessions: WorkoutSession[]): { name: string; weeks: number }[] {
  const stagnated: { name: string; weeks: number }[] = [];
  const exerciseHistory: Record<string, { maxWeight: number; date: Date }[]> = {};

  sessions.forEach(session => {
    session.exercises.forEach(ex => {
      if (!exerciseHistory[ex.exerciseId]) exerciseHistory[ex.exerciseId] = [];
      const maxWeight = Math.max(...ex.sets.filter(s => s.completed).map(s => s.weight), 0);
      if (maxWeight > 0) {
        exerciseHistory[ex.exerciseId].push({ maxWeight, date: new Date(session.startTime) });
      }
    });
  });

  Object.entries(exerciseHistory).forEach(([exId, history]) => {
    if (history.length < 4) return;
    const sorted = history.sort((a, b) => b.date.getTime() - a.date.getTime());
    const recentMax = sorted[0].maxWeight;
    const sameWeightCount = sorted.filter(h => h.maxWeight === recentMax).length;
    
    if (sameWeightCount >= 3) {
      const weeks = Math.ceil(differenceInDays(sorted[0].date, sorted[Math.min(sameWeightCount - 1, sorted.length - 1)].date) / 7);
      const name = exerciseDatabase.find(e => e.id === exId)?.name || exId;
      if (weeks >= 2) stagnated.push({ name, weeks });
    }
  });

  return stagnated.sort((a, b) => b.weeks - a.weeks);
}

function findBestPerformance(sessions: WorkoutSession[], exerciseId: string): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null;

  sessions.forEach(session => {
    session.exercises.forEach(ex => {
      if (ex.exerciseId !== exerciseId) return;
      ex.sets.forEach(set => {
        if (!set.completed || set.weight <= 0) return;
        const e1rm = set.weight * (1 + set.reps / 30);
        if (!best || e1rm > best.weight * (1 + best.reps / 30)) {
          best = { weight: set.weight, reps: set.reps };
        }
      });
    });
  });

  return best;
}

/**
 * Fatigue Index – Detects if user is accumulating too much fatigue
 * Used to suggest deload weeks
 */
export function calculateFatigueIndex(
  workoutSessions: WorkoutSession[],
): { index: number; needsDeload: boolean; message: string } {
  const now = new Date();
  const fourWeeksAgo = subDays(now, 28);
  const recentSessions = workoutSessions
    .filter(s => new Date(s.startTime) >= fourWeeksAgo)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (recentSessions.length < 8) {
    return { index: 0, needsDeload: false, message: 'Noch nicht genug Daten für Ermüdungsanalyse.' };
  }

  // Check if volume has been consistently increasing for 4+ weeks
  const weeklyVolumes: number[] = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = subDays(now, (4 - i) * 7);
    const weekEnd = subDays(now, (3 - i) * 7);
    const vol = recentSessions
      .filter(s => new Date(s.startTime) >= weekStart && new Date(s.startTime) < weekEnd)
      .reduce((sum, s) => sum + s.totalVolume, 0);
    weeklyVolumes.push(vol);
  }

  const increasing = weeklyVolumes.every((v, i) => i === 0 || v >= weeklyVolumes[i - 1] * 0.95);
  const avgRIR = recentSessions.reduce((sum, s) => {
    let totalRIR = 0, count = 0;
    s.exercises.forEach(ex => ex.sets.forEach(set => {
      if (set.completed && set.rir !== undefined) { totalRIR += set.rir; count++; }
    }));
    return sum + (count > 0 ? totalRIR / count : 3);
  }, 0) / recentSessions.length;

  const fatigueIndex = Math.round(
    (increasing ? 30 : 0) + 
    Math.max(0, (2.5 - avgRIR) * 20) + 
    Math.min(recentSessions.length * 2, 30)
  );

  const needsDeload = fatigueIndex > 70;

  return {
    index: Math.min(fatigueIndex, 100),
    needsDeload,
    message: needsDeload 
      ? 'Dein Körper braucht eine Erholungswoche! Reduziere Volumen & Intensität für 1 Woche.'
      : fatigueIndex > 50 
        ? 'Ermüdung steigt – achte auf gute Regeneration.'
        : 'Ermüdungslevel im grünen Bereich.',
  };
}

/**
 * Generate a "Coach Says" daily tip based on context
 */
export function getDailyCoachTip(
  workoutSessions: WorkoutSession[],
  lastWorkoutDate: Date | null,
): { tip: string; category: string } {
  const now = new Date();
  const daysSinceLastWorkout = lastWorkoutDate 
    ? differenceInDays(now, lastWorkoutDate) 
    : 999;

  const tips = [
    // Recovery tips
    { condition: daysSinceLastWorkout === 0, tip: 'Post-Workout: 30g Protein in der nächsten Stunde maximiert den Muskelaufbau.', category: 'nutrition' },
    { condition: daysSinceLastWorkout === 1, tip: 'Aktive Regeneration: Ein 20-min Spaziergang fördert die Durchblutung und beschleunigt die Erholung.', category: 'recovery' },
    { condition: daysSinceLastWorkout >= 3, tip: 'Deine Muskeln sind erholt – heute wäre ein perfekter Trainingstag!', category: 'motivation' },
    
    // Technique tips
    { condition: true, tip: 'Kontrollierte Negative (3-4 Sekunden absenken) erzeugen bis zu 40% mehr Muskelschaden.', category: 'technique' },
    { condition: true, tip: 'Mind-Muscle-Connection: Fokussiere bewusst den Zielmuskel für bis zu 20% mehr Aktivierung.', category: 'technique' },
    { condition: true, tip: 'RIR 1-2 ist der Sweet Spot: Nah genug am Versagen für Wachstum, weit genug weg für Recovery.', category: 'technique' },
    { condition: true, tip: 'Schlaf ist dein stärkstes Supplement. 7-9 Stunden = maximale Regeneration & Hormonproduktion.', category: 'recovery' },
    { condition: true, tip: '2g Protein pro kg Körpergewicht – die Grundregel für Muskelaufbau.', category: 'nutrition' },
    { condition: true, tip: 'Compound-Übungen zuerst, Isolation danach. Das gibt dir maximale Kraft für die schwersten Bewegungen.', category: 'technique' },
    { condition: true, tip: 'Progressive Overload muss nicht immer mehr Gewicht sein – mehr Reps, weniger Pause, bessere Form zählt auch!', category: 'technique' },
  ];

  // Find contextual tip first
  const contextual = tips.find(t => t.condition && daysSinceLastWorkout >= 0);
  if (contextual && contextual.condition !== true) return contextual;

  // Random tip from general pool
  const generalTips = tips.filter(t => t.condition === true);
  const dayIndex = now.getDate() % generalTips.length;
  return generalTips[dayIndex];
}
