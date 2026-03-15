'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell, Play, Droplets, Utensils, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';

export function FloatingQuickActions() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentWorkout, trainingPlans, trainingDays } = useWorkoutStore();
  const { dailyTracking, updateWater, resetDailyTrackingIfNeeded } = useNutritionStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    resetDailyTrackingIfNeeded();
  }, [resetDailyTrackingIfNeeded]);

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
    const current = dailyTracking?.waterIntake || 0;
    updateWater(current + 250);
    toast.success('+250ml Wasser');
    setOpen(false);
  };

  const handleQuickMeal = () => {
    if (pathname === '/nutrition') {
      window.dispatchEvent(new CustomEvent('open-quick-meal-modal'));
    } else {
      router.push('/nutrition?quickAdd=1');
    }
    toast.success('Schnell-Mahlzeit geoeffnet');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-3 shadow-2xl">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--fg-muted))]">Schnellaktionen</p>

          <button
            onClick={handleStartWorkout}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[hsl(var(--fg-secondary))] transition-colors hover:bg-cyan-400/10 hover:text-cyan-400"
          >
            <div className="rounded-lg bg-cyan-400/15 p-2 text-cyan-400">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Training starten</p>
              <p className="text-xs text-[hsl(var(--fg-muted))]">{nextTrainingDay?.name || 'Kein Tag vorhanden'}</p>
            </div>
          </button>

          <button
            onClick={handleAddWater}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[hsl(var(--fg-secondary))] transition-colors hover:bg-cyan-50 hover:text-cyan-700"
          >
            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
              <Droplets className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Wasser +250ml</p>
              <p className="text-xs text-[hsl(var(--fg-muted))]">Direkt eintragen</p>
            </div>
          </button>

          <button
            onClick={handleQuickMeal}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[hsl(var(--fg-secondary))] transition-colors hover:bg-emerald-50 hover:text-emerald-700"
          >
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Quick Meal</p>
              <p className="text-xs text-[hsl(var(--fg-muted))]">400 kcal / 25g Protein</p>
            </div>
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
        title="Aktionen"
        aria-label="Aktionen"
      >
        {open ? <X className="h-6 w-6" /> : <Dumbbell className="h-6 w-6 group-hover:scale-110 transition-transform" />}
      </button>
    </div>
  );
}
