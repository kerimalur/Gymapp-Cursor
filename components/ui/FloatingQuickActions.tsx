'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Play, Droplets, Utensils, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useAuthStore } from '@/store/useAuthStore';

export function FloatingQuickActions() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentWorkout, trainingPlans, trainingDays } = useWorkoutStore();
  const nutritionStore = useNutritionStore();
  const [open, setOpen] = useState(false);

  const nextTrainingDay = useMemo(() => {
    if (currentWorkout) {
      return trainingDays.find((day) => day.id === currentWorkout.trainingDayId) || null;
    }

    const activePlan = trainingPlans.find((plan) => plan.isActive);
    if (activePlan?.trainingDays?.length) {
      const nextIndex = activePlan.currentDayIndex ?? 0;
      const nextDayId = activePlan.trainingDays[nextIndex];
      return trainingDays.find((day) => day.id === nextDayId) || null;
    }

    return trainingDays[0] || null;
  }, [currentWorkout, trainingPlans, trainingDays]);

  const handleStartWorkout = () => {
    if (!nextTrainingDay) {
      toast.error('Kein Trainingstag vorhanden');
      return;
    }
    router.push(`/workout?id=${nextTrainingDay.id}`);
    setOpen(false);
  };

  const handleAddWater = () => {
    const current = nutritionStore.dailyTracking?.waterIntake || 0;
    nutritionStore.updateWater(current + 250);
    toast.success('+250ml Wasser');
    setOpen(false);
  };

  const handleQuickMeal = () => {
    nutritionStore.addTrackedMeal({
      name: 'Quick Meal',
      calories: 400,
      protein: 25,
      carbs: 35,
      fats: 12,
      time: 'snack',
    });
    toast.success('Quick Meal hinzugefuegt');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Schnellaktionen</p>

          <button
            onClick={handleStartWorkout}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
          >
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Training starten</p>
              <p className="text-xs text-slate-500">{nextTrainingDay?.name || 'Kein Tag vorhanden'}</p>
            </div>
          </button>

          <button
            onClick={handleAddWater}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
          >
            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
              <Droplets className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Wasser +250ml</p>
              <p className="text-xs text-slate-500">Direkt eintragen</p>
            </div>
          </button>

          <button
            onClick={handleQuickMeal}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
          >
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Quick Meal</p>
              <p className="text-xs text-slate-500">400 kcal / 25g Protein</p>
            </div>
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
        title="Schnellaktionen"
        aria-label="Schnellaktionen"
      >
        {open ? <X className="h-6 w-6" /> : <Dumbbell className="h-6 w-6 group-hover:scale-110 transition-transform" />}
      </button>
    </div>
  );
}
