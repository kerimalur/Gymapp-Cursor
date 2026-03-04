'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarClock, Droplets, Flame, Trophy, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { BodyWeightWidget } from '@/components/dashboard/BodyWeightWidget';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { Meal } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { ALL_MUSCLES, MUSCLE_NAMES_DE, calculateRecoveryFromWorkouts } from '@/lib/recovery';

function StatCard({
  title,
  value,
  sub,
  gradient,
  onClick,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  gradient: string;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl`}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <div className="rounded-lg bg-white/20 p-2">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-white/80">{sub}</p>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { workoutSessions, trainingPlans, trainingDays } = useWorkoutStore();
  const { nutritionGoals, dailyTracking, meals, trackingSettings } = useNutritionStore();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Guten Morgen');
    else if (hour < 18) setGreeting('Guten Tag');
    else setGreeting('Guten Abend');
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: de, weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { locale: de, weekStartsOn: 1 });

    const weekWorkouts = workoutSessions.filter((session) =>
      isWithinInterval(new Date(session.startTime), { start: weekStart, end: weekEnd })
    );

    const totalCalories = (meals || [])
      .filter((m: Meal) => format(new Date(m.date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'))
      .reduce((sum: number, m: Meal) => sum + (m.totalCalories || 0), 0);

    const activePlan = trainingPlans.find((p) => p.isActive);
    const nextDayId = activePlan?.trainingDays[activePlan.currentDayIndex ?? 0];
    const nextTrainingDay = trainingDays.find((d) => d.id === nextDayId);

    const todayIndex = (() => {
      const day = getDay(now);
      return day === 0 ? 6 : day - 1;
    })();

    const getWeekKey = (date: Date) => format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-ww');
    const plannedWorkoutDays = trackingSettings?.plannedWorkoutDays || {};
    const thisWeekPlanned = plannedWorkoutDays[getWeekKey(now)] || [];

    let nextPlannedDate: Date | null = null;
    for (let i = 0; i < 14; i++) {
      const candidate = addDays(now, i);
      const candidateIndex = (() => {
        const day = getDay(candidate);
        return day === 0 ? 6 : day - 1;
      })();
      const weekKey = getWeekKey(candidate);
      const planned = plannedWorkoutDays[weekKey] || [];
      if (planned.includes(candidateIndex)) {
        nextPlannedDate = candidate;
        break;
      }
    }

    const recoveryMap = calculateRecoveryFromWorkouts(workoutSessions);
    const enabledMuscles = trackingSettings?.enabledMuscles?.length
      ? trackingSettings.enabledMuscles
      : ALL_MUSCLES;

    const readyMuscles = enabledMuscles.filter((muscle) => recoveryMap[muscle].recovery >= 80);
    const tiredMuscles = enabledMuscles.filter((muscle) => recoveryMap[muscle].recovery < 50);
    const averageRecovery = Math.round(
      enabledMuscles.reduce((sum, muscle) => sum + recoveryMap[muscle].recovery, 0) / enabledMuscles.length
    );

    const exerciseMaxes: Record<string, { weight: number; reps: number; estimated1RM: number }> = {};
    workoutSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const exerciseData = exerciseDatabase.find((dbEx) => dbEx.id === exercise.exerciseId);
        const exerciseName = exerciseData?.name || exercise.exerciseId;

        exercise.sets.forEach((set) => {
          if (!set.completed || set.weight <= 0 || set.reps <= 0) return;
          const estimated1RM = set.weight * (1 + set.reps / 30);
          if (!exerciseMaxes[exerciseName] || estimated1RM > exerciseMaxes[exerciseName].estimated1RM) {
            exerciseMaxes[exerciseName] = { weight: set.weight, reps: set.reps, estimated1RM };
          }
        });
      });
    });

    const personalRecords = Object.entries(exerciseMaxes)
      .sort((a, b) => b[1].estimated1RM - a[1].estimated1RM)
      .slice(0, 4)
      .map(([exercise, record]) => ({ exercise, ...record }));

    return {
      weekWorkouts: weekWorkouts.length,
      caloriesGoal: nutritionGoals?.dailyCalories || 2500,
      caloriesConsumed: Math.round(totalCalories),
      waterGoal: nutritionGoals?.waterGoal || 3000,
      waterConsumed: dailyTracking?.waterIntake || 0,
      weeklyGoal: activePlan?.sessionsPerWeek || Math.max(3, thisWeekPlanned.length || 3),
      nextTrainingDay,
      nextPlannedDate,
      hasPlannedTraining: !!nextPlannedDate || thisWeekPlanned.length > 0,
      plannedThisWeek: thisWeekPlanned.length,
      averageRecovery,
      readyMuscles,
      tiredMuscles,
      personalRecords,
      todayIndex,
    };
  }, [workoutSessions, meals, nutritionGoals, dailyTracking, trainingPlans, trainingDays, trackingSettings]);

  if (!mounted) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
          <p className="mb-2 text-sm text-blue-300">{greeting}</p>
          <h1 className="text-3xl font-black tracking-tight">{user?.displayName?.split(' ')[0] || 'Athlet'}</h1>
          <p className="mt-1 text-sm text-slate-300">{format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Regeneration Status</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                stats.averageRecovery >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : stats.averageRecovery >= 50
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {stats.averageRecovery}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                stats.averageRecovery >= 80
                  ? 'bg-emerald-500'
                  : stats.averageRecovery >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${stats.averageRecovery}%` }}
            />
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <p className="text-xs text-slate-600">
              Bereit: {stats.readyMuscles.length > 0
                ? stats.readyMuscles.slice(0, 4).map((muscle) => MUSCLE_NAMES_DE[muscle]).join(', ')
                : 'Keine Muskelgruppe'}
            </p>
            <p className="text-xs text-slate-600 md:text-right">
              Muede: {stats.tiredMuscles.length > 0
                ? stats.tiredMuscles.slice(0, 4).map((muscle) => MUSCLE_NAMES_DE[muscle]).join(', ')
                : 'Keine'}
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${stats.hasPlannedTraining ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <StatCard
            title="Kalorien heute"
            value={`${stats.caloriesConsumed}`}
            sub={`von ${stats.caloriesGoal} kcal`}
            gradient="from-orange-500 to-rose-500"
            icon={<Flame className="h-5 w-5" />}
            onClick={() => router.push('/nutrition')}
          />

          <StatCard
            title="Wasser heute"
            value={`${(stats.waterConsumed / 1000).toFixed(1)}L`}
            sub={`von ${stats.waterGoal / 1000}L`}
            gradient="from-cyan-500 to-blue-600"
            icon={<Droplets className="h-5 w-5" />}
            onClick={() => router.push('/nutrition')}
          />

          <StatCard
            title="Trainings Woche"
            value={`${stats.weekWorkouts} / ${stats.weeklyGoal}`}
            sub="absolviert"
            gradient="from-emerald-500 to-teal-600"
            icon={<Zap className="h-5 w-5" />}
            onClick={() => router.push('/tracker')}
          />

          {stats.hasPlannedTraining && (
            <StatCard
              title="Training geplant"
              value={stats.nextPlannedDate ? format(stats.nextPlannedDate, 'EEE, dd.MM', { locale: de }) : 'Diese Woche'}
              sub={`${stats.plannedThisWeek} geplante Tage`}
              gradient="from-violet-500 to-indigo-600"
              icon={<CalendarClock className="h-5 w-5" />}
              onClick={() => router.push('/calendar')}
            />
          )}
        </div>

        {stats.nextTrainingDay && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Naechstes Training</h3>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {stats.nextTrainingDay.exercises.length} Uebungen
              </span>
            </div>
            <p className="text-lg font-semibold text-slate-900">{stats.nextTrainingDay.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {stats.nextTrainingDay.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} Saetze gesamt
            </p>
            <button
              onClick={() => router.push(`/workout?id=${stats.nextTrainingDay?.id}`)}
              className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-semibold text-white hover:opacity-95"
            >
              Training starten
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-800">Persoenliche Rekorde</h3>
          </div>

          {stats.personalRecords.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Noch keine Rekorde vorhanden.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {stats.personalRecords.map((record) => (
                <div key={record.exercise} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="truncate font-semibold text-slate-800">{record.exercise}</p>
                  <p className="text-sm text-slate-500">{record.weight}kg x {record.reps}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <BodyWeightWidget compact />
      </div>
    </DashboardLayout>
  );
}
