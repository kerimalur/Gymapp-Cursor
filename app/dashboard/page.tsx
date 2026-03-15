'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Droplets, Flame, Target, Trophy, Zap,
  ChevronRight, Dumbbell
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useAppSettingsStore } from '@/store/useAppSettingsStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { ALL_MUSCLES, MUSCLE_NAMES_DE, calculateRecoveryFromWorkouts } from '@/lib/recovery';
import { SmartDashboard } from '@/components/dashboard/SmartDashboard';
import { AchievementsPanel } from '@/components/dashboard/AchievementsPanel';

// ─── Mini Stat Card ───────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, gradient, onClick, icon,
}: {
  title: string; value: string; sub: string;
  gradient: string; onClick?: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl bg-gradient-to-br ${gradient} p-4 text-left text-white shadow-md transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-white/80">{title}</p>
        <div className="rounded-lg bg-white/20 p-1.5">{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-white/75">{sub}</p>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { workoutSessions, trainingPlans, trainingDays, strengthGoals, weeklyVolumeGoalSets } = useWorkoutStore();
  const { nutritionGoals, dailyTracking, trackedMeals, trackingSettings, resetDailyTrackingIfNeeded } = useNutritionStore();
  const { profileName, setProfileName, setProfileBio } = useAppSettingsStore();
  const { goal: bodyWeightGoal } = useBodyWeightStore();
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

  useEffect(() => { resetDailyTrackingIfNeeded(); }, [resetDailyTrackingIfNeeded]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekWorkouts = workoutSessions.filter((s) =>
      isWithinInterval(new Date(s.startTime), { start: weekStart, end: weekEnd })
    );
    const totalCalories = (trackedMeals || [])
      .filter((m) => m.date === format(now, 'yyyy-MM-dd'))
      .reduce((s, m) => s + (m.calories || 0), 0);
    const activePlan = trainingPlans.find((p) => p.isActive);
    const nextDayId = activePlan?.trainingDays[activePlan.currentDayIndex ?? 0];
    const nextTrainingDay = trainingDays.find((d) => d.id === nextDayId);
    const getWeekKey = (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-ww');
    const planned = trackingSettings?.plannedWorkoutDays || {};
    const thisWeekPlanned = planned[getWeekKey(now)] || [];
    let nextPlannedDate: Date | null = null;
    for (let i = 0; i < 14; i++) {
      const c = addDays(now, i);
      const idx = getDay(c) === 0 ? 6 : getDay(c) - 1;
      if ((planned[getWeekKey(c)] || []).includes(idx)) { nextPlannedDate = c; break; }
    }
    const recoveryMap = calculateRecoveryFromWorkouts(workoutSessions);
    const enabled = trackingSettings?.enabledMuscles?.length ? trackingSettings.enabledMuscles : ALL_MUSCLES;
    const readyMuscles = enabled.filter((m) => recoveryMap[m].recovery >= 80);
    const tiredMuscles = enabled.filter((m) => recoveryMap[m].recovery < 50);
    const avgRecovery = Math.round(enabled.reduce((s, m) => s + recoveryMap[m].recovery, 0) / enabled.length);
    const exerciseMaxes: Record<string, { weight: number; reps: number; estimated1RM: number }> = {};
    workoutSessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        const name = exerciseDatabase.find((e) => e.id === ex.exerciseId)?.name || ex.exerciseId;
        ex.sets.forEach((set) => {
          if (!set.completed || set.weight <= 0 || set.reps <= 0) return;
          const e1rm = set.weight * (1 + set.reps / 30);
          if (!exerciseMaxes[name] || e1rm > exerciseMaxes[name].estimated1RM)
            exerciseMaxes[name] = { weight: set.weight, reps: set.reps, estimated1RM: e1rm };
        });
      });
    });
    const personalRecords = Object.entries(exerciseMaxes)
      .sort((a, b) => b[1].estimated1RM - a[1].estimated1RM)
      .slice(0, 4)
      .map(([exercise, r]) => ({ exercise, ...r }));
    return {
      weekWorkouts: weekWorkouts.length,
      caloriesGoal: nutritionGoals?.dailyCalories || 2500,
      caloriesConsumed: Math.round(totalCalories),
      waterGoal: nutritionGoals?.waterGoal || 3000,
      waterConsumed: dailyTracking?.waterIntake || 0,
      weeklyGoal: activePlan?.sessionsPerWeek || Math.max(3, thisWeekPlanned.length || 3),
      nextTrainingDay, nextPlannedDate,
      hasPlannedTraining: !!nextPlannedDate || thisWeekPlanned.length > 0,
      plannedThisWeek: thisWeekPlanned.length,
      avgRecovery, readyMuscles, tiredMuscles, personalRecords,
    };
  }, [workoutSessions, trackedMeals, nutritionGoals, dailyTracking, trainingPlans, trainingDays, trackingSettings]);

  const activeGoals = [bodyWeightGoal !== null, weeklyVolumeGoalSets !== null, strengthGoals.length > 0].filter(Boolean).length;

  const handleCompleteOnboarding = async () => {
    const cleaned = onboardingName.trim();
    if (!cleaned) return;
    setProfileName(cleaned);
    setProfileBio(onboardingGoal.trim());
    await updateProfile({ displayName: cleaned, hasCompletedOnboarding: true });
    setShowOnboarding(false);
  };

  if (!mounted) return <DashboardLayout><SkeletonDashboard /></DashboardLayout>;

  const displayName = profileName || user?.displayName?.split(' ')[0] || 'Athlet';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-5 pb-24 lg:pb-6">

        {/* ── Hero: Greeting + Next Workout ─────────────────────────── */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
          <p className="text-sm font-medium text-blue-300">{greeting}, {displayName} 👋</p>
          <p className="mt-0.5 text-xs text-slate-400">{format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}</p>

          {stats.nextTrainingDay ? (
            <button
              onClick={() => router.push('/tracker')}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 text-left hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/30 p-2.5">
                  <Dumbbell className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nächstes Training</p>
                  <p className="font-semibold text-white">{stats.nextTrainingDay.name}</p>
                  <p className="text-xs text-slate-400">{stats.nextTrainingDay.exercises.length} Übungen</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/tracker')}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/30 p-2.5">
                  <Zap className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Kein Plan aktiv</p>
                  <p className="font-semibold text-white">Training starten</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* ── Today's 3 Key Metrics ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Kalorien"
            value={`${stats.caloriesConsumed}`}
            sub={`/ ${stats.caloriesGoal}`}
            gradient="from-orange-500 to-rose-500"
            icon={<Flame className="h-4 w-4" />}
            onClick={() => router.push('/nutrition')}
          />
          <StatCard
            title="Wasser"
            value={`${(stats.waterConsumed / 1000).toFixed(1)}L`}
            sub={`/ ${stats.waterGoal / 1000}L`}
            gradient="from-cyan-500 to-blue-600"
            icon={<Droplets className="h-4 w-4" />}
            onClick={() => router.push('/nutrition')}
          />
          <StatCard
            title="Trainings"
            value={`${stats.weekWorkouts}/${stats.weeklyGoal}`}
            sub="diese Woche"
            gradient="from-emerald-500 to-teal-600"
            icon={<Zap className="h-4 w-4" />}
            onClick={() => router.push('/tracker')}
          />
        </div>

        {/* ── Recovery Quick Status ─────────────────────────────────── */}
        <button
          onClick={() => router.push('/recovery')}
          className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" strokeWidth="5" className="stroke-slate-100" />
              <circle
                cx="28" cy="28" r="24" fill="none" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - stats.avgRecovery / 100)}`}
                className={stats.avgRecovery >= 80 ? 'stroke-emerald-500' : stats.avgRecovery >= 50 ? 'stroke-amber-500' : 'stroke-red-500'}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
              {stats.avgRecovery}%
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-slate-800">Regeneration</p>
            <p className="text-xs text-slate-500">
              {stats.readyMuscles.length} bereit · {stats.tiredMuscles.length > 0
                ? `${stats.tiredMuscles.slice(0, 2).map(m => MUSCLE_NAMES_DE[m]).join(', ')} müde`
                : 'alle erholt'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </button>

        {/* ── Goals Quick Link ──────────────────────────────────────── */}
        <button
          onClick={() => router.push('/goals')}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2">
              <Target className="h-5 w-5 text-violet-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800">Ziele</p>
              <p className="text-xs text-slate-500">
                {activeGoals === 0 ? 'Noch keine Ziele gesetzt' : `${activeGoals} / 3 aktiv`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeGoals > 0 && (
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`h-2 w-2 rounded-full ${i < activeGoals ? 'bg-violet-500' : 'bg-slate-200'}`} />
                ))}
              </div>
            )}
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </button>

        {/* ── Personal Records ─────────────────────────────────────── */}
        {stats.personalRecords.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-800">Persönliche Rekorde</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {stats.personalRecords.map((r) => (
                <div key={r.exercise} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.exercise}</p>
                  <p className="text-xs text-slate-500">{r.weight}kg × {r.reps}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Smart Insights (top 3 only) ───────────────────────────── */}
        <SmartDashboard />

        {/* ── Achievements ─────────────────────────────────────────── */}
        <AchievementsPanel />

      </div>

      {/* ── Onboarding Modal ─────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">Willkommen 👋</h2>
            <p className="mt-1 text-sm text-slate-500">Wie sollen wir dich nennen?</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
                <input
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  placeholder="Dein Name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Trainingsziel (optional)</label>
                <input
                  value={onboardingGoal}
                  onChange={(e) => setOnboardingGoal(e.target.value)}
                  placeholder="z.B. Muskeln aufbauen"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { updateProfile({ hasCompletedOnboarding: true }); setShowOnboarding(false); }}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Überspringen
              </button>
              <button
                onClick={handleCompleteOnboarding}
                disabled={!onboardingName.trim()}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
