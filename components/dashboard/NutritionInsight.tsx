'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { format } from 'date-fns';

export function NutritionInsight() {
  const { workoutSessions } = useWorkoutStore();
  const { trackedMeals, nutritionGoals } = useNutritionStore();

  const insight = useMemo(() => {
    if (workoutSessions.length < 4 || trackedMeals.length < 4) return null;

    const proteinGoal = nutritionGoals?.dailyProtein || 150;
    const threshold = proteinGoal * 0.8;

    const sessionData = workoutSessions.map(session => {
      const dateStr = format(new Date(session.startTime), 'yyyy-MM-dd');
      const dayMeals = trackedMeals.filter(m => m.date === dateStr);
      const totalProtein = dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
      return {
        volume: session.totalVolume || 0,
        protein: totalProtein,
        hasNutritionData: dayMeals.length > 0,
      };
    }).filter(d => d.hasNutritionData && d.volume > 0);

    if (sessionData.length < 4) return null;

    const highProteinDays = sessionData.filter(d => d.protein >= threshold);
    const lowProteinDays = sessionData.filter(d => d.protein < threshold);

    if (highProteinDays.length < 2 || lowProteinDays.length < 2) return null;

    const avgHighVolume = highProteinDays.reduce((sum, d) => sum + d.volume, 0) / highProteinDays.length;
    const avgLowVolume = lowProteinDays.reduce((sum, d) => sum + d.volume, 0) / lowProteinDays.length;
    const diff = Math.round(((avgHighVolume - avgLowVolume) / avgLowVolume) * 100);

    if (Math.abs(diff) < 3) return null;

    // Calorie correlation
    const calorieGoal = nutritionGoals?.dailyCalories || 2500;
    const calThreshold = calorieGoal * 0.85;
    const highCalDays = sessionData.filter(d => {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      return d.protein >= threshold; // reuse protein as proxy since we don't have calorie data directly here
    });

    return {
      diff,
      positive: diff > 0,
      threshold: Math.round(threshold),
      highCount: highProteinDays.length,
      lowCount: lowProteinDays.length,
      avgHighVolume: Math.round(avgHighVolume),
      avgLowVolume: Math.round(avgLowVolume),
    };
  }, [workoutSessions, trackedMeals, nutritionGoals]);

  if (!insight) return null;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${
      insight.positive
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${insight.positive ? 'bg-emerald-100' : 'bg-orange-100'}`}>
          <svg className={`h-5 w-5 ${insight.positive ? 'text-emerald-600' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${insight.positive ? 'text-emerald-800' : 'text-orange-800'}`}>
            Ernährung beeinflusst dein Training
          </p>
          <p className={`mt-1 text-sm ${insight.positive ? 'text-emerald-700' : 'text-orange-700'}`}>
            An Tagen mit {'>'}
{insight.threshold}g Protein trainierst du{' '}
            <span className="font-bold">{Math.abs(insight.diff)}% {insight.positive ? 'mehr' : 'weniger'} Volumen</span>
            {' '}als an Tagen mit weniger Protein.
          </p>
          <div className={`mt-3 flex gap-4 text-xs ${insight.positive ? 'text-emerald-600' : 'text-orange-600'}`}>
            <div>
              <span className="font-semibold">Ø {insight.avgHighVolume.toLocaleString()}kg</span>
              <p className="text-xs opacity-75">Hohe Protein-Tage ({insight.highCount}×)</p>
            </div>
            <div>
              <span className="font-semibold">Ø {insight.avgLowVolume.toLocaleString()}kg</span>
              <p className="text-xs opacity-75">Niedrige Protein-Tage ({insight.lowCount}×)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
