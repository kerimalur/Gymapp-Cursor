import { WorkoutSession } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { startOfWeek, isWithinInterval, differenceInDays } from 'date-fns';

// --- Types ---

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'strength' | 'consistency' | 'volume' | 'milestone';
  unlockedAt?: Date;
  progress: number; // 0-100
  target: number;
  current: number;
  unit?: string;
}

// --- Achievement Definitions ---

function getStreakWeeks(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;
  const now = new Date();
  let streak = 0;

  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - weekOffset * 7);
    const weekStart = startOfWeek(checkDate, { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const hasTraining = sessions.some(s => {
      const d = new Date(s.startTime);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    if (hasTraining) streak++;
    else break;
  }
  return streak;
}

function getTotalWorkouts(sessions: WorkoutSession[]): number {
  return sessions.length;
}

function getMaxWeight(sessions: WorkoutSession[]): number {
  let max = 0;
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && !set.isWarmup && !set.isAssisted && set.weight > max) {
          max = set.weight;
        }
      });
    });
  });
  return max;
}

function getMaxWeightForExercise(sessions: WorkoutSession[], exerciseId: string): number {
  let max = 0;
  sessions.forEach(s => {
    s.exercises
      .filter(ex => ex.exerciseId === exerciseId)
      .forEach(ex => {
        ex.sets.forEach(set => {
          if (set.completed && !set.isWarmup && !set.isAssisted && set.weight > max) {
            max = set.weight;
          }
        });
      });
  });
  return max;
}

function getTotalVolume(sessions: WorkoutSession[]): number {
  let total = 0;
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && !set.isWarmup) {
          total += Math.abs(set.weight) * set.reps;
        }
      });
    });
  });
  return total;
}

function getTotalSets(sessions: WorkoutSession[]): number {
  let total = 0;
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && !set.isWarmup) total++;
      });
    });
  });
  return total;
}

function getUniqueExercises(sessions: WorkoutSession[]): number {
  const ids = new Set<string>();
  sessions.forEach(s => {
    s.exercises.forEach(ex => ids.add(ex.exerciseId));
  });
  return ids.size;
}

function getEarlyBirdCount(sessions: WorkoutSession[]): number {
  return sessions.filter(s => {
    const hour = new Date(s.startTime).getHours();
    return hour < 8;
  }).length;
}

function getNightOwlCount(sessions: WorkoutSession[]): number {
  return sessions.filter(s => {
    const hour = new Date(s.startTime).getHours();
    return hour >= 20;
  }).length;
}

function getLongWorkouts(sessions: WorkoutSession[]): number {
  return sessions.filter(s => (s.duration || 0) >= 90).length;
}

// --- Generate All Achievements ---

export function calculateAchievements(sessions: WorkoutSession[]): Achievement[] {
  const streak = getStreakWeeks(sessions);
  const totalWorkouts = getTotalWorkouts(sessions);
  const maxWeight = getMaxWeight(sessions);
  const totalVolume = getTotalVolume(sessions);
  const totalSets = getTotalSets(sessions);
  const uniqueExercises = getUniqueExercises(sessions);
  const earlyBirds = getEarlyBirdCount(sessions);
  const nightOwls = getNightOwlCount(sessions);
  const longWorkouts = getLongWorkouts(sessions);

  // Find bench press max
  const benchIds = exerciseDatabase
    .filter(e => e.name.toLowerCase().includes('bankdr?cken') || e.name.toLowerCase().includes('bench'))
    .map(e => e.id);
  const benchMax = Math.max(...benchIds.map(id => getMaxWeightForExercise(sessions, id)), 0);

  // Find squat max
  const squatIds = exerciseDatabase
    .filter(e => e.name.toLowerCase().includes('kniebeuge') || e.name.toLowerCase().includes('squat'))
    .map(e => e.id);
  const squatMax = Math.max(...squatIds.map(id => getMaxWeightForExercise(sessions, id)), 0);

  // Find deadlift max
  const deadliftIds = exerciseDatabase
    .filter(e => e.name.toLowerCase().includes('kreuzheben') || e.name.toLowerCase().includes('deadlift'))
    .map(e => e.id);
  const deadliftMax = Math.max(...deadliftIds.map(id => getMaxWeightForExercise(sessions, id)), 0);

  const achievements: Achievement[] = [
    // === CONSISTENCY ===
    {
      id: 'first-workout',
      name: 'Erster Schritt',
      description: 'Dein allererstes Training abgeschlossen',
      emoji: '🎯',
      category: 'consistency',
      progress: Math.min(100, (totalWorkouts / 1) * 100),
      target: 1,
      current: totalWorkouts,
      unit: 'Training',
    },
    {
      id: 'ten-workouts',
      name: 'Konstant dabei',
      description: '10 Trainings absolviert',
      emoji: '🔟',
      category: 'consistency',
      progress: Math.min(100, (totalWorkouts / 10) * 100),
      target: 10,
      current: totalWorkouts,
      unit: 'Trainings',
    },
    {
      id: 'twentyfive-workouts',
      name: 'Keine Ausreden',
      description: '25 Trainings absolviert',
      emoji: '💪',
      category: 'consistency',
      progress: Math.min(100, (totalWorkouts / 25) * 100),
      target: 25,
      current: totalWorkouts,
      unit: 'Trainings',
    },
    {
      id: 'fifty-workouts',
      name: 'Halbe Hundert',
      description: '50 Trainings absolviert',
      emoji: '🏆',
      category: 'consistency',
      progress: Math.min(100, (totalWorkouts / 50) * 100),
      target: 50,
      current: totalWorkouts,
      unit: 'Trainings',
    },
    {
      id: 'hundred-workouts',
      name: 'Centurion',
      description: '100 Trainings absolviert',
      emoji: '💯',
      category: 'consistency',
      progress: Math.min(100, (totalWorkouts / 100) * 100),
      target: 100,
      current: totalWorkouts,
      unit: 'Trainings',
    },
    {
      id: 'streak-4',
      name: 'Momentum',
      description: '4 Wochen am Stueck trainiert',
      emoji: '🔥',
      category: 'consistency',
      progress: Math.min(100, (streak / 4) * 100),
      target: 4,
      current: streak,
      unit: 'Wochen',
    },
    {
      id: 'streak-12',
      name: 'Unstoppbar',
      description: '12 Wochen am Stueck trainiert',
      emoji: '⚡',
      category: 'consistency',
      progress: Math.min(100, (streak / 12) * 100),
      target: 12,
      current: streak,
      unit: 'Wochen',
    },
    {
      id: 'streak-26',
      name: 'Halbes Jahr',
      description: '26 Wochen am Stueck trainiert',
      emoji: '🌟',
      category: 'consistency',
      progress: Math.min(100, (streak / 26) * 100),
      target: 26,
      current: streak,
      unit: 'Wochen',
    },

    // === STRENGTH ===
    {
      id: 'first-plate',
      name: 'Erste Scheibe',
      description: 'Zum ersten Mal 60kg auf einer ?bung',
      emoji: '🏋️',
      category: 'strength',
      progress: Math.min(100, (maxWeight / 60) * 100),
      target: 60,
      current: maxWeight,
      unit: 'kg',
    },
    {
      id: 'heavy-lifter',
      name: 'Schweres Eisen',
      description: '100kg auf einer ?bung',
      emoji: '🦾',
      category: 'strength',
      progress: Math.min(100, (maxWeight / 100) * 100),
      target: 100,
      current: maxWeight,
      unit: 'kg',
    },
    {
      id: 'bench-60',
      name: 'Bankdr?cken 60kg',
      description: '60kg auf der Flachbank',
      emoji: '🪑',
      category: 'strength',
      progress: benchMax > 0 ? Math.min(100, (benchMax / 60) * 100) : 0,
      target: 60,
      current: benchMax,
      unit: 'kg',
    },
    {
      id: 'bench-100',
      name: 'Bankdr?cken 100kg',
      description: '100kg auf der Flachbank – Respekt!',
      emoji: '👑',
      category: 'strength',
      progress: benchMax > 0 ? Math.min(100, (benchMax / 100) * 100) : 0,
      target: 100,
      current: benchMax,
      unit: 'kg',
    },
    {
      id: 'squat-100',
      name: 'Kniebeuge 100kg',
      description: '100kg Kniebeuge – starke Beine!',
      emoji: '🦵',
      category: 'strength',
      progress: squatMax > 0 ? Math.min(100, (squatMax / 100) * 100) : 0,
      target: 100,
      current: squatMax,
      unit: 'kg',
    },
    {
      id: 'deadlift-140',
      name: 'Kreuzheben 140kg',
      description: '140kg vom Boden – Beast Mode!',
      emoji: '🐻',
      category: 'strength',
      progress: deadliftMax > 0 ? Math.min(100, (deadliftMax / 140) * 100) : 0,
      target: 140,
      current: deadliftMax,
      unit: 'kg',
    },

    // === VOLUME ===
    {
      id: 'volume-10k',
      name: '10 Tonnen',
      description: '10.000 kg Gesamtvolumen bewegt',
      emoji: '📦',
      category: 'volume',
      progress: Math.min(100, (totalVolume / 10000) * 100),
      target: 10000,
      current: Math.round(totalVolume),
      unit: 'kg',
    },
    {
      id: 'volume-100k',
      name: '100 Tonnen',
      description: '100.000 kg Gesamtvolumen – eine Lokomotive!',
      emoji: '🚂',
      category: 'volume',
      progress: Math.min(100, (totalVolume / 100000) * 100),
      target: 100000,
      current: Math.round(totalVolume),
      unit: 'kg',
    },
    {
      id: 'volume-500k',
      name: 'Halbe Million',
      description: '500.000 kg Gesamtvolumen',
      emoji: '🏗️',
      category: 'volume',
      progress: Math.min(100, (totalVolume / 500000) * 100),
      target: 500000,
      current: Math.round(totalVolume),
      unit: 'kg',
    },
    {
      id: 'sets-500',
      name: '500 S?tze',
      description: '500 Arbeitss?tze abgeschlossen',
      emoji: '🎯',
      category: 'volume',
      progress: Math.min(100, (totalSets / 500) * 100),
      target: 500,
      current: totalSets,
      unit: 'S?tze',
    },
    {
      id: 'sets-2000',
      name: '2000 S?tze',
      description: '2000 Arbeitss?tze – Maschine!',
      emoji: '⚙️',
      category: 'volume',
      progress: Math.min(100, (totalSets / 2000) * 100),
      target: 2000,
      current: totalSets,
      unit: 'S?tze',
    },

    // === MILESTONES ===
    {
      id: 'variety-10',
      name: 'Vielfaeltig',
      description: '10 verschiedene ?bungen trainiert',
      emoji: '🎨',
      category: 'milestone',
      progress: Math.min(100, (uniqueExercises / 10) * 100),
      target: 10,
      current: uniqueExercises,
      unit: '?bungen',
    },
    {
      id: 'variety-25',
      name: 'Allrounder',
      description: '25 verschiedene ?bungen trainiert',
      emoji: '🌈',
      category: 'milestone',
      progress: Math.min(100, (uniqueExercises / 25) * 100),
      target: 25,
      current: uniqueExercises,
      unit: '?bungen',
    },
    {
      id: 'early-bird-5',
      name: 'Fruehaufsteher',
      description: '5 Trainings vor 8 Uhr morgens',
      emoji: '🌅',
      category: 'milestone',
      progress: Math.min(100, (earlyBirds / 5) * 100),
      target: 5,
      current: earlyBirds,
      unit: 'Trainings',
    },
    {
      id: 'night-owl-5',
      name: 'Nachteule',
      description: '5 Trainings nach 20 Uhr',
      emoji: '🌙',
      category: 'milestone',
      progress: Math.min(100, (nightOwls / 5) * 100),
      target: 5,
      current: nightOwls,
      unit: 'Trainings',
    },
    {
      id: 'iron-will',
      name: 'Eiserner Wille',
      description: '5 Trainings ?ber 90 Minuten',
      emoji: '⏳',
      category: 'milestone',
      progress: Math.min(100, (longWorkouts / 5) * 100),
      target: 5,
      current: longWorkouts,
      unit: 'Trainings',
    },
  ];

  // Mark unlocked achievements
  return achievements.map(a => ({
    ...a,
    unlockedAt: a.progress >= 100 ? new Date() : undefined,
  }));
}

/**
 * Get only unlocked achievements count for quick display
 */
export function getUnlockedCount(sessions: WorkoutSession[]): number {
  return calculateAchievements(sessions).filter(a => a.progress >= 100).length;
}

/**
 * Get total achievements count
 */
export function getTotalAchievementCount(sessions: WorkoutSession[]): number {
  return calculateAchievements(sessions).length;
}
