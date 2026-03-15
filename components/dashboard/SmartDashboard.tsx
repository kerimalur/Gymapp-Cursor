'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore, SleepEntry } from '@/store/useNutritionStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { calculateRecoveryFromWorkouts, MUSCLE_NAMES_DE, ALL_MUSCLES } from '@/lib/recovery';
import { detectStagnation } from '@/lib/progressiveOverload';
import { format, startOfWeek, isWithinInterval, differenceInDays, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Moon, 
  Utensils, 
  Dumbbell, 
  Shield, 
  Target, 
  ChevronRight,
  Brain,
  BedDouble,
  Activity,
  Droplets
} from 'lucide-react';

interface SmartInsight {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'action';
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  priority: number; // lower = higher priority
}

export function SmartDashboard() {
  const { workoutSessions, trainingDays, trainingPlans } = useWorkoutStore();
  const { nutritionGoals, sleepEntries, trackedMeals, trackingSettings } = useNutritionStore();
  const bodyWeightStore = useBodyWeightStore();

  const insights = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const allInsights: SmartInsight[] = [];

    // --- Recovery-basierte Empfehlung ---
    const recoveryMap = calculateRecoveryFromWorkouts(workoutSessions);
    const enabledMuscles = trackingSettings?.enabledMuscles?.length
      ? trackingSettings.enabledMuscles
      : ALL_MUSCLES;

    const readyMuscles = enabledMuscles.filter(m => recoveryMap[m]?.recovery >= 85);
    const tiredMuscles = enabledMuscles.filter(m => recoveryMap[m]?.recovery < 40);

    // Find best training day based on recovery
    if (trainingDays.length > 0 && readyMuscles.length > 0) {
      let bestDay = trainingDays[0];
      let bestScore = -1;

      trainingDays.forEach(day => {
        const dayMuscles = new Set<string>();
        day.exercises.forEach(ex => {
          const dbEx = exerciseDatabase.find(e => e.id === ex.exerciseId);
          dbEx?.muscleGroups?.forEach(mg => dayMuscles.add(mg));
        });

        const score = Array.from(dayMuscles).filter(m => 
          readyMuscles.includes(m as any)
        ).length;

        if (score > bestScore) {
          bestScore = score;
          bestDay = day;
        }
      });

      if (bestScore > 0) {
        allInsights.push({
          id: 'recovery-suggestion',
          type: 'action',
          icon: <Dumbbell className="w-5 h-5" />,
          title: `Heute gut fuer: ${bestDay.name}`,
          description: `${bestScore} Muskelgruppen sind erholt und bereit. Perfekter Tag dafuer!`,
          actionLabel: 'Training starten',
          actionHref: `/workout?id=${bestDay.id}`,
          priority: 1,
        });
      }
    }

    // --- Muede Muskeln Warnung ---
    if (tiredMuscles.length >= 3) {
      allInsights.push({
        id: 'tired-muscles',
        type: 'warning',
        icon: <Shield className="w-5 h-5" />,
        title: 'Regeneration beachten',
        description: `${tiredMuscles.slice(0, 4).map(m => MUSCLE_NAMES_DE[m]).join(', ')} sind noch erschoepft. Ueberlege einen leichten Tag oder Ruhetag.`,
        priority: 3,
      });
    }

    // --- Protein-Check ---
    const todayMeals = trackedMeals?.filter(m => m.date === todayStr) || [];
    const todayProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
    const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
    const proteinGoal = nutritionGoals?.dailyProtein || 0;
    const calorieGoal = nutritionGoals?.dailyCalories || 0;

    if (proteinGoal > 0) {
      const proteinRemaining = proteinGoal - todayProtein;
      const hour = now.getHours();

      if (proteinRemaining > 30 && hour >= 14) {
        allInsights.push({
          id: 'protein-deficit',
          type: 'warning',
          icon: <Utensils className="w-5 h-5" />,
          title: `Noch ${Math.round(proteinRemaining)}g Protein`,
          description: `Du hast heute erst ${Math.round(todayProtein)}g von ${proteinGoal}g Protein. ${hour >= 18 ? 'Nur noch wenige Stunden!' : 'Plane noch eine proteinreiche Mahlzeit.'}`,
          actionLabel: 'Mahlzeit loggen',
          actionHref: '/nutrition',
          priority: 4,
        });
      } else if (todayProtein >= proteinGoal && todayProtein > 0) {
        allInsights.push({
          id: 'protein-goal-reached',
          type: 'positive',
          icon: <Target className="w-5 h-5" />,
          title: 'Protein-Ziel erreicht! ✅',
          description: `${Math.round(todayProtein)}g von ${proteinGoal}g – gut gemacht!`,
          priority: 8,
        });
      }
    }

    // --- Kalorien-Check ---
    if (calorieGoal > 0 && todayCalories > 0) {
      const calorieDiff = calorieGoal - todayCalories;
      const hour = now.getHours();

      if (calorieDiff < -300 && hour >= 18) {
        allInsights.push({
          id: 'calorie-surplus',
          type: 'info',
          icon: <Activity className="w-5 h-5" />,
          title: `${Math.abs(Math.round(calorieDiff))} kcal ueber dem Ziel`,
          description: `Du bist heute bei ${Math.round(todayCalories)} kcal. Kein Drama, aber vielleicht morgen etwas bewusster essen.`,
          priority: 7,
        });
      }
    }

    // --- Schlaf-Check ---
    const yesterdayStr = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd');
    const lastSleep = (sleepEntries || []).find((e: SleepEntry) => e.date === todayStr || e.date === yesterdayStr);

    if (lastSleep) {
      if (lastSleep.hoursSlept < 7) {
        allInsights.push({
          id: 'poor-sleep',
          type: 'warning',
          icon: <Moon className="w-5 h-5" />,
          title: `Nur ${lastSleep.hoursSlept}h Schlaf letzte Nacht`,
          description: 'Weniger als 7 Stunden beeintraechtigt die Regeneration. Heute vielleicht leichter trainieren.',
          priority: 2,
        });
      } else if (lastSleep.hoursSlept >= 8 && lastSleep.quality >= 4) {
        allInsights.push({
          id: 'great-sleep',
          type: 'positive',
          icon: <BedDouble className="w-5 h-5" />,
          title: 'Perfekter Schlaf! 💤',
          description: `${lastSleep.hoursSlept}h mit Qualitaet ${lastSleep.quality}/5. Optimale Voraussetzungen fuers Training.`,
          priority: 6,
        });
      }
    } else {
      // No sleep logged
      allInsights.push({
        id: 'no-sleep-logged',
        type: 'info',
        icon: <Moon className="w-5 h-5" />,
        title: 'Schlaf nicht getrackt',
        description: 'Tracke deinen Schlaf fuer bessere Regenerations-Empfehlungen.',
        actionLabel: 'Schlaf eintragen',
        actionHref: '/nutrition',
        priority: 9,
      });
    }

    // --- Schlaf-Wochenschnitt ---
    const weekSleep = (sleepEntries || [])
      .filter((e: SleepEntry) => differenceInDays(now, new Date(e.date)) <= 7)
      .map((e: SleepEntry) => e.hoursSlept);

    if (weekSleep.length >= 3) {
      const avgSleep = weekSleep.reduce((s: number, h: number) => s + h, 0) / weekSleep.length;
      if (avgSleep < 7) {
        allInsights.push({
          id: 'week-sleep-deficit',
          type: 'warning',
          icon: <Brain className="w-5 h-5" />,
          title: `Schlaf-Schnitt: ${avgSleep.toFixed(1)}h/Nacht`,
          description: 'Unter 7h im Wochenschnitt bremst deine Gains. Versuche frueher ins Bett zu gehen.',
          priority: 3,
        });
      }
    }

    // --- Stagnations-Erkennung ---
    const activePlan = trainingPlans.find(p => p.isActive);
    if (activePlan) {
      activePlan.trainingDays.forEach(dayId => {
        const stagnations = detectStagnation(workoutSessions, dayId);
        stagnations.forEach(stag => {
          allInsights.push({
            id: `stagnation-${stag.exerciseId}`,
            type: 'warning',
            icon: <AlertTriangle className="w-5 h-5" />,
            title: `Plateau: ${stag.exerciseName}`,
            description: `Seit ${stag.weeksSameWeight} Trainings bei ${stag.lastWeight}kg × ${stag.lastReps}. ${stag.suggestion}`,
            priority: 5,
          });
        });
      });
    }

    // --- Trainingsfrequenz ---
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekWorkouts = workoutSessions.filter(s => 
      isWithinInterval(new Date(s.startTime), { start: weekStart, end: now })
    );
    const weeklyGoal = activePlan?.sessionsPerWeek || 4;
    const todayDayIndex = getDay(now) === 0 ? 6 : getDay(now) - 1; // 0=Mon, 6=Sun
    const daysLeft = 6 - todayDayIndex;
    const trainingsNeeded = weeklyGoal - weekWorkouts.length;

    if (trainingsNeeded > 0 && daysLeft > 0 && daysLeft <= 3) {
      allInsights.push({
        id: 'weekly-goal-reminder',
        type: 'action',
        icon: <Target className="w-5 h-5" />,
        title: `Noch ${trainingsNeeded}/${weeklyGoal} Trainings diese Woche`,
        description: `${daysLeft} Tage uebrig. ${trainingsNeeded <= daysLeft ? 'Du schaffst das!' : 'Wird eng, aber jedes Training zaehlt!'}`,
        actionLabel: 'Training starten',
        actionHref: '/tracker',
        priority: 2,
      });
    } else if (weekWorkouts.length >= weeklyGoal) {
      allInsights.push({
        id: 'weekly-goal-met',
        type: 'positive',
        icon: <Zap className="w-5 h-5" />,
        title: `Wochenziel erreicht! ${weekWorkouts.length}/${weeklyGoal} ✅`,
        description: 'Alle geplanten Trainings erledigt. Starke Woche!',
        priority: 5,
      });
    }

    // --- Trainings-Streak ---
    const streak = calculateStreak(workoutSessions);
    if (streak >= 4) {
      allInsights.push({
        id: 'training-streak',
        type: 'positive',
        icon: <Zap className="w-5 h-5" />,
        title: `🔥 ${streak} Wochen Streak!`,
        description: `Du trainierst seit ${streak} Wochen regelmaessig. Nicht aufhoeren!`,
        priority: 4,
      });
    }

    // --- Body Weight Trend ---
    const weightChange = bodyWeightStore.getWeightChange(14);
    const latestWeight = bodyWeightStore.getLatestWeight();
    if (weightChange !== null && latestWeight !== null) {
      const direction = weightChange > 0 ? 'zugenommen' : 'abgenommen';
      allInsights.push({
        id: 'weight-trend',
        type: 'info',
        icon: <TrendingUp className="w-5 h-5" />,
        title: `${Math.abs(weightChange).toFixed(1)}kg ${direction} (2 Wo)`,
        description: `Aktuell: ${latestWeight.toFixed(1)}kg. ${Math.abs(weightChange) > 1.5 ? 'Grosse Veraenderung – Ernaehrung checken.' : 'Im normalen Bereich.'}`,
        priority: 7,
      });
    }

    // Sort by priority
    return allInsights.sort((a, b) => a.priority - b.priority).slice(0, 6);
  }, [workoutSessions, trainingDays, trainingPlans, nutritionGoals, sleepEntries, trackedMeals, trackingSettings, bodyWeightStore]);

  if (insights.length === 0) return null;

  const typeStyles = {
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    action: 'bg-violet-50 border-violet-200 text-violet-800',
  };

  const iconStyles = {
    positive: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
    action: 'bg-violet-100 text-violet-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Smart Insights</h3>
          <p className="text-xs text-slate-500">Personalisierte Empfehlungen basierend auf deinen Daten</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-xl border p-3.5 transition-all hover:shadow-sm ${typeStyles[insight.type]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${iconStyles[insight.type]}`}>
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{insight.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{insight.description}</p>
                {insight.actionLabel && insight.actionHref && (
                  <a
                    href={insight.actionHref}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold hover:underline"
                  >
                    {insight.actionLabel}
                    <ChevronRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculate the training streak in weeks
 * A streak week = at least 1 training in that calendar week
 */
function calculateStreak(sessions: any[]): number {
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
      const sessionDate = new Date(s.startTime);
      return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
    });

    if (hasTraining) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
