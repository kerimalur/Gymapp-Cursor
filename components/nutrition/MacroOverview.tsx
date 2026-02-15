'use client';

import { Flame, Activity } from 'lucide-react';

export function MacroOverview() {
  // Mock data - would come from state/database
  const goals = {
    calories: 2500,
    protein: 180,
    carbs: 280,
    fats: 70,
  };

  const consumed = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  };

  const getPercentage = (consumed: number, goal: number) => {
    return Math.min((consumed / goal) * 100, 100);
  };

  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'from-green-500 to-green-600';
    if (percentage >= 70) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const macros = [
    {
      name: 'Protein',
      consumed: consumed.protein,
      goal: goals.protein,
      unit: 'g',
      color: 'from-blue-500 to-blue-600',
      icon: '🥩',
    },
    {
      name: 'Kohlenhydrate',
      consumed: consumed.carbs,
      goal: goals.carbs,
      unit: 'g',
      color: 'from-yellow-500 to-yellow-600',
      icon: '🍞',
    },
    {
      name: 'Fette',
      consumed: consumed.fats,
      goal: goals.fats,
      unit: 'g',
      color: 'from-purple-500 to-purple-600',
      icon: '🥑',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Calories - Main Display */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white mb-4 shadow-xl">
            <div>
              <Flame className="w-8 h-8 mx-auto mb-1" />
              <p className="text-3xl font-bold">{consumed.calories}</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Kalorien heute
          </h2>
          <p className="text-gray-600">
            {goals.calories - consumed.calories} kcal verbleibend von {goals.calories} kcal
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getColor(
              getPercentage(consumed.calories, goals.calories)
            )} rounded-full transition-all`}
            style={{ width: `${getPercentage(consumed.calories, goals.calories)}%` }}
          />
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {macros.map((macro, index) => {
          const percentage = getPercentage(macro.consumed, macro.goal);
          const remaining = macro.goal - macro.consumed;

          return (
            <div key={index} className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{macro.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{macro.name}</h3>
                  <p className="text-sm text-gray-600">
                    {macro.consumed} / {macro.goal} {macro.unit}
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${macro.color} rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500">
                {remaining > 0 ? (
                  <>Noch {remaining} {macro.unit}</>
                ) : (
                  <>Ziel erreicht! ✓</>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((consumed.protein * 4 / consumed.calories) * 100)}%
          </p>
          <p className="text-sm text-gray-600">Protein</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((consumed.carbs * 4 / consumed.calories) * 100)}%
          </p>
          <p className="text-sm text-gray-600">Carbs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((consumed.fats * 9 / consumed.calories) * 100)}%
          </p>
          <p className="text-sm text-gray-600">Fette</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((consumed.calories / goals.calories) * 100)}%
          </p>
          <p className="text-sm text-gray-600">Ziel</p>
        </div>
      </div>
    </div>
  );
}
