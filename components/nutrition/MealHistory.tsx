'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Coffee, Utensils, Sunrise, Moon, Eye, Edit, Trash2 } from 'lucide-react';

interface Meal {
  id: string;
  date: Date;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const mockMeals: Meal[] = [];

export function MealHistory() {
  const [meals] = useState<Meal[]>(mockMeals);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast':
        return <Sunrise className="w-5 h-5" />;
      case 'lunch':
        return <Utensils className="w-5 h-5" />;
      case 'dinner':
        return <Moon className="w-5 h-5" />;
      case 'snack':
        return <Coffee className="w-5 h-5" />;
    }
  };

  const getMealName = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'Frühstück';
      case 'lunch':
        return 'Mittagessen';
      case 'dinner':
        return 'Abendessen';
      case 'snack':
        return 'Snack';
    }
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-700';
      case 'lunch':
        return 'bg-blue-100 text-blue-700';
      case 'dinner':
        return 'bg-purple-100 text-purple-700';
      case 'snack':
        return 'bg-green-100 text-green-700';
    }
  };

  // Group meals by date
  const groupedMeals = meals.reduce((acc, meal) => {
    const dateKey = format(meal.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  return (
    <>
      {meals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Noch keine Mahlzeiten
          </h3>
          <p className="text-gray-600">
            Füge deine erste Mahlzeit hinzu, um deine Ernährung zu tracken
          </p>
        </div>
      ) : (
        <div className="space-y-6">
        {Object.entries(groupedMeals).map(([dateKey, dayMeals]) => {
          const date = new Date(dateKey);
          const totalCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);

          return (
            <div key={dateKey} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {format(date, 'EEEE, d. MMMM', { locale: de })}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {dayMeals.length} Mahlzeiten • {totalCalories} kcal
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {dayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${getMealColor(meal.type)}`}>
                          {getMealIcon(meal.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {getMealName(meal.type)}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {meal.items.join(', ')}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-700">
                              <strong>{meal.calories}</strong> kcal
                            </span>
                            <span className="text-blue-600">
                              <strong>{meal.protein}g</strong> Protein
                            </span>
                            <span className="text-yellow-600">
                              <strong>{meal.carbs}g</strong> Carbs
                            </span>
                            <span className="text-purple-600">
                              <strong>{meal.fats}g</strong> Fette
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedMeal(meal)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {getMealName(selectedMeal.type)}
              </h2>
              <button
                onClick={() => setSelectedMeal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Lebensmittel</h3>
                <ul className="space-y-2">
                  {selectedMeal.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Kalorien</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMeal.calories}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600 mb-1">Protein</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedMeal.protein}g
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-sm text-yellow-600 mb-1">Kohlenhydrate</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {selectedMeal.carbs}g
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-600 mb-1">Fette</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {selectedMeal.fats}g
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
