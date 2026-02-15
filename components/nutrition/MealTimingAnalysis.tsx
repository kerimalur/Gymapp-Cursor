'use client';

import { useMemo } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface MealTimingData {
  time: string;
  label: string;
  icon: string;
  avgCalories: number;
  avgProtein: number;
  mealCount: number;
  percentage: number;
}

const MEAL_TIMES = [
  { id: 'breakfast', label: 'Frühstück', icon: '🌅', idealTime: '6:00 - 10:00' },
  { id: 'lunch', label: 'Mittagessen', icon: '☀️', idealTime: '11:00 - 14:00' },
  { id: 'dinner', label: 'Abendessen', icon: '🌙', idealTime: '17:00 - 21:00' },
  { id: 'snacks', label: 'Snacks', icon: '🍎', idealTime: 'Zwischendurch' },
];

export function MealTimingAnalysis() {
  const { trackedMeals, nutritionGoals } = useNutritionStore();

  const timingData = useMemo(() => {
    // Get meals from last 7 days
    const sevenDaysAgo = subDays(new Date(), 7).toISOString().split('T')[0];
    const recentMeals = trackedMeals.filter(m => m.date >= sevenDaysAgo);

    if (recentMeals.length === 0) {
      return null;
    }

    const timeGroups: Record<string, { calories: number; protein: number; count: number }> = {
      breakfast: { calories: 0, protein: 0, count: 0 },
      lunch: { calories: 0, protein: 0, count: 0 },
      dinner: { calories: 0, protein: 0, count: 0 },
      snacks: { calories: 0, protein: 0, count: 0 },
    };

    recentMeals.forEach(meal => {
      const time = meal.time as keyof typeof timeGroups;
      if (timeGroups[time]) {
        timeGroups[time].calories += meal.calories;
        timeGroups[time].protein += meal.protein;
        timeGroups[time].count++;
      }
    });

    const totalCalories = Object.values(timeGroups).reduce((sum, g) => sum + g.calories, 0);

    const data: MealTimingData[] = MEAL_TIMES.map(time => {
      const group = timeGroups[time.id];
      return {
        time: time.id,
        label: time.label,
        icon: time.icon,
        avgCalories: group.count > 0 ? Math.round(group.calories / group.count) : 0,
        avgProtein: group.count > 0 ? Math.round(group.protein / group.count) : 0,
        mealCount: group.count,
        percentage: totalCalories > 0 ? Math.round((group.calories / totalCalories) * 100) : 0,
      };
    });

    return data;
  }, [trackedMeals]);

  const recommendations = useMemo(() => {
    if (!timingData) return [];

    const tips: string[] = [];
    const proteinGoal = nutritionGoals?.dailyProtein || 150;
    const proteinPerMeal = Math.round(proteinGoal / 4);

    // Check protein distribution
    const breakfast = timingData.find(t => t.time === 'breakfast');
    const dinner = timingData.find(t => t.time === 'dinner');

    if (breakfast && breakfast.avgProtein < proteinPerMeal * 0.5 && breakfast.mealCount > 0) {
      tips.push('💡 Mehr Protein zum Frühstück für bessere Sättigung');
    }

    if (dinner && dinner.percentage > 50) {
      tips.push('⚠️ Versuche die Kalorien gleichmäßiger zu verteilen');
    }

    const snacks = timingData.find(t => t.time === 'snacks');
    if (snacks && snacks.percentage > 30) {
      tips.push('🍎 Reduziere Snacks zugunsten von Hauptmahlzeiten');
    }

    // Check if breakfast is skipped
    if (breakfast && breakfast.mealCount === 0) {
      tips.push('🌅 Ein proteinreiches Frühstück kann den Stoffwechsel ankurbeln');
    }

    return tips;
  }, [timingData, nutritionGoals]);

  if (!timingData) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">⏰</div>
        <p className="text-slate-600 font-medium">Keine Daten</p>
        <p className="text-sm text-slate-400 mt-1">
          Tracke deine Mahlzeiten mit Zeitangabe
        </p>
      </div>
    );
  }

  const totalMeals = timingData.reduce((sum, t) => sum + t.mealCount, 0);

  return (
    <div className="space-y-6">
      {/* Distribution Overview */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-4">Kalorienverteilung</h4>
        
        {/* Visual Bar Distribution */}
        <div className="h-8 rounded-full overflow-hidden flex bg-white mb-4">
          {timingData.map((time, idx) => {
            const colors = [
              'bg-amber-400',
              'bg-orange-400',
              'bg-purple-400',
              'bg-green-400',
            ];
            return (
              <div
                key={time.time}
                className={`${colors[idx]} transition-all`}
                style={{ width: `${time.percentage}%` }}
                title={`${time.label}: ${time.percentage}%`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-4 gap-2">
          {timingData.map((time, idx) => {
            const colors = [
              'bg-amber-400',
              'bg-orange-400',
              'bg-purple-400',
              'bg-green-400',
            ];
            return (
              <div key={time.time} className="text-center">
                <div className={`w-3 h-3 ${colors[idx]} rounded-full mx-auto mb-1`} />
                <p className="text-xs text-slate-600">{time.label}</p>
                <p className="text-sm font-bold text-slate-800">{time.percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meal Time Cards */}
      <div className="grid grid-cols-2 gap-4">
        {timingData.map(time => (
          <div
            key={time.time}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{time.icon}</span>
              <div>
                <p className="font-semibold text-slate-800">{time.label}</p>
                <p className="text-xs text-slate-500">
                  {time.mealCount} Mahlzeiten
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Ø Kalorien</span>
                <span className="font-bold text-slate-800">{time.avgCalories}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Ø Protein</span>
                <span className="font-bold text-blue-600">{time.avgProtein}g</span>
              </div>
            </div>

            {/* Mini progress indicator */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${time.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">Tipps zum Meal Timing</h4>
          <ul className="space-y-2">
            {recommendations.map((tip, idx) => (
              <li key={idx} className="text-sm text-blue-700">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <p className="text-center text-sm text-slate-500">
        Basierend auf {totalMeals} Mahlzeiten der letzten 7 Tage
      </p>
    </div>
  );
}
