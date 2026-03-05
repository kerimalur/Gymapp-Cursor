'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarClock, Droplets, Flame, Trophy, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useAppSettingsStore } from '@/store/useAppSettingsStore';
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
  const { user, updateProfile } = useAuthStore();
  const { workoutSessions, trainingPlans, trainingDays } = useWorkoutStore();
  const { nutritionGoals, dailyTracking, meals, trackingSettings } = useNutritionStore();
  const { profileName, setProfileName, setProfileBio } = useAppSettingsStore();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingGoal, setOnboardingGoal] = useState('');

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Guten Morgen');
    else if (hour < 18) setGreeting('Guten Tag');
    else setGreeting('Guten Abend');
  }, []);

  useEffect(() => {
    if (!user) return;
    const existingName = profileName || user.displayName;
    setOnboardingName(existingName && existingName !== 'User' ? existingName : '');
    setShowOnboarding(!user.hasCompletedOnboarding || !existingName || existingName === 'User');
  }, [user, profileName]);

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
    };
  }, [workoutSessions, meals, nutritionGoals, dailyTracking, trainingPlans, trainingDays, trackingSettings]);

  const handleCompleteOnboarding = async () => {
    const cleaned = onboardingName.trim();
    if (!cleaned) return;
    setProfileName(cleaned);
    setProfileBio(onboardingGoal.trim());
    await updateProfile({ displayName: cleaned, hasCompletedOnboarding: true });
    setShowOnboarding(false);
  };

  if (!mounted) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  const displayName = profileName || user?.displayName?.split(' ')[0] || 'Athlet';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
          <p className="mb-2 text-sm text-blue-300">{greeting}, {displayName}</p>
          <p className="mt-1 text-sm text-slate-300">{format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Regeneration</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              stats.averageRecovery >= 80
                ? 'bg-emerald-100 text-emerald-700'
                : stats.averageRecovery >= 50
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
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
            <p className="text-xs text-slate-600">Bereit: {stats.readyMuscles.length} Muskelgruppen</p>
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
      </div>

      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900">Willkommen 👋</h2>
            <p className="mt-1 text-sm text-slate-500">Trage ein paar Daten ein, damit dein Dashboard persoenlich wird.</p>
            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
                <input value={onboardingName} onChange={(e) => setOnboardingName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Ziel (optional)</label>
                <input value={onboardingGoal} onChange={(e) => setOnboardingGoal(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" />
              </div>
            </div>
            <button onClick={handleCompleteOnboarding} className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">Speichern</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
