'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Droplets, Flame, ChevronRight, Dumbbell, Trophy, Clock, Zap,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { DailyCoachTip } from '@/components/coaching/DailyCoachTip';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useAppSettingsStore } from '@/store/useAppSettingsStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { ALL_MUSCLES, MUSCLE_NAMES_DE, calculateRecoveryFromWorkouts } from '@/lib/recovery';
import {
  calculateMomentum,
  analyzeWeakPoints,
  calculateFatigueIndex,
} from '@/lib/coachingEngine';


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
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayMeals = (trackedMeals || []).filter((m) => m.date === todayStr);
    const totalCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const totalProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const activePlan = trainingPlans.find((p) => p.isActive);
    const nextDayId = activePlan?.trainingDays[activePlan.currentDayIndex ?? 0];
    const nextTrainingDay = trainingDays.find((d) => d.id === nextDayId);
    const planned = trackingSettings?.plannedWorkoutDays || {};
    const getWeekKey = (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-ww');
    const thisWeekPlanned = planned[getWeekKey(now)] || [];
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
      .slice(0, 3)
      .map(([exercise, r]) => ({ exercise, ...r }));
    return {
      weekWorkouts: weekWorkouts.length,
      caloriesGoal: nutritionGoals?.dailyCalories || 2500,
      caloriesConsumed: Math.round(totalCalories),
      proteinConsumed: Math.round(totalProtein),
      waterGoal: nutritionGoals?.waterGoal || 3000,
      waterConsumed: dailyTracking?.waterIntake || 0,
      weeklyGoal: activePlan?.sessionsPerWeek || Math.max(3, thisWeekPlanned.length || 3),
      nextTrainingDay,
      avgRecovery, readyMuscles, tiredMuscles, personalRecords,
      recoveryMap, enabled,
    };
  }, [workoutSessions, trackedMeals, nutritionGoals, dailyTracking, trainingPlans, trainingDays, trackingSettings]);

  const momentum = useMemo(() => calculateMomentum(
    workoutSessions,
    { caloriesConsumed: stats.caloriesConsumed, proteinConsumed: stats.proteinConsumed, goals: nutritionGoals },
    stats.recoveryMap,
    stats.weeklyGoal,
  ), [workoutSessions, stats, nutritionGoals]);

  const weakPoints = useMemo(
    () => analyzeWeakPoints(workoutSessions, stats.enabled),
    [workoutSessions, stats.enabled]
  );

  const fatigue = useMemo(
    () => calculateFatigueIndex(workoutSessions),
    [workoutSessions]
  );

  const recentWorkouts = useMemo(() => {
    return [...workoutSessions]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 3);
  }, [workoutSessions]);

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
  const calPct = stats.caloriesGoal > 0 ? Math.min(100, Math.round((stats.caloriesConsumed / stats.caloriesGoal) * 100)) : 0;
  const waterPct = stats.waterGoal > 0 ? Math.min(100, Math.round((stats.waterConsumed / stats.waterGoal) * 100)) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── Greeting ──────────────────────────────────────────── */}
        <div className="pt-4 pb-1">
          <p className="text-[hsl(var(--fg-muted))] text-sm">{format(new Date(), 'EEEE, d. MMMM', { locale: de })}</p>
          <h1 className="text-2xl font-bold text-[hsl(var(--fg-primary))]">
            {greeting}, {displayName} 👋
          </h1>
        </div>

        {/* ── Momentum + Streak Badge ───────────────────────────── */}
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            momentum.score >= 60 ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
            : momentum.score >= 30 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
            : 'bg-red-400/10 text-red-400 border border-red-400/20'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            {momentum.score} Momentum
          </div>
          {momentum.streak > 0 && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-400/10 text-orange-400 border border-orange-400/20">
              🔥 {momentum.streak} Tage
            </div>
          )}
        </div>

        {/* ── Start Workout Hero Button ─────────────────────────── */}
        <button
          onClick={() => {
            if (stats.nextTrainingDay) {
              router.push(`/workout?id=${stats.nextTrainingDay.id}`);
            } else {
              router.push('/tracker');
            }
          }}
          className="w-full rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-5 text-left active:scale-[0.98] transition-transform shadow-lg shadow-cyan-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100/70 text-xs font-semibold uppercase tracking-wider">
                {stats.nextTrainingDay ? 'Nächstes Training' : 'Training starten'}
              </p>
              <p className="text-white text-xl font-bold mt-0.5">
                {stats.nextTrainingDay?.name || 'Trainingsplan erstellen'}
              </p>
              {stats.nextTrainingDay && (
                <p className="text-cyan-100/60 text-sm mt-0.5">
                  {stats.nextTrainingDay.exercises.length} Übungen · {stats.nextTrainingDay.exercises.reduce((s, e) => s + e.sets.length, 0)} Sätze
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>

        {/* ── Today's Progress Strip ────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => router.push('/nutrition')} className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3 text-left active:scale-[0.97] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] text-[hsl(var(--fg-muted))]">{calPct}%</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--fg-primary))]">{stats.caloriesConsumed}</p>
            <p className="text-[10px] text-[hsl(var(--fg-muted))]">/ {stats.caloriesGoal} kcal</p>
            <div className="mt-1.5 h-1 rounded-full bg-[hsl(225,12%,16%)] overflow-hidden">
              <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${calPct}%` }} />
            </div>
          </button>

          <button onClick={() => router.push('/nutrition')} className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3 text-left active:scale-[0.97] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] text-[hsl(var(--fg-muted))]">{waterPct}%</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--fg-primary))]">{(stats.waterConsumed / 1000).toFixed(1)}L</p>
            <p className="text-[10px] text-[hsl(var(--fg-muted))]">/ {stats.waterGoal / 1000}L</p>
            <div className="mt-1.5 h-1 rounded-full bg-[hsl(225,12%,16%)] overflow-hidden">
              <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${waterPct}%` }} />
            </div>
          </button>

          <button onClick={() => router.push('/tracker')} className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3 text-left active:scale-[0.97] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] text-[hsl(var(--fg-muted))]">{stats.weekWorkouts}/{stats.weeklyGoal}</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--fg-primary))]">{stats.weekWorkouts}</p>
            <p className="text-[10px] text-[hsl(var(--fg-muted))]">Trainings</p>
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: stats.weeklyGoal }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < stats.weekWorkouts ? 'bg-cyan-400' : 'bg-[hsl(225,12%,16%)]'}`} />
              ))}
            </div>
          </button>
        </div>

        {/* ── Recovery Quick ────────────────────────────────────── */}
        <button
          onClick={() => router.push('/recovery')}
          className="w-full flex items-center gap-3 rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3.5 active:scale-[0.99] transition-transform"
        >
          <div className="relative w-11 h-11 shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-[hsl(225,12%,16%)]" />
              <circle
                cx="22" cy="22" r="18" fill="none" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - stats.avgRecovery / 100)}`}
                className={stats.avgRecovery >= 80 ? 'stroke-emerald-400' : stats.avgRecovery >= 50 ? 'stroke-amber-400' : 'stroke-red-400'}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[hsl(var(--fg-primary))]">
              {stats.avgRecovery}%
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-[hsl(var(--fg-primary))]">Regeneration</p>
            <p className="text-xs text-[hsl(var(--fg-muted))]">
              {stats.readyMuscles.length} bereit{stats.tiredMuscles.length > 0
                ? ` · ${stats.tiredMuscles.slice(0, 2).map(m => MUSCLE_NAMES_DE[m]).join(', ')} müde`
                : ' · alle erholt'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[hsl(var(--fg-subtle))] shrink-0" />
        </button>

        {/* ── Fatigue Warning ──────────────────────────────────── */}
        {fatigue.index > 50 && (
          <div className={`rounded-xl p-3.5 border ${fatigue.needsDeload ? 'border-red-400/30 bg-red-400/5' : 'border-amber-400/30 bg-amber-400/5'}`}>
            <div className="flex items-center gap-3">
              <span className="text-lg">{fatigue.needsDeload ? '🛑' : '⚠️'}</span>
              <div>
                <p className="font-semibold text-sm text-[hsl(var(--fg-primary))]">Ermüdung: {fatigue.index}%</p>
                <p className="text-xs text-[hsl(var(--fg-muted))]">{fatigue.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Coach Tip ────────────────────────────────────────── */}
        <DailyCoachTip workoutSessions={workoutSessions} />

        {/* ── Recent Workouts Timeline ─────────────────────────── */}
        {recentWorkouts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[hsl(var(--fg-secondary))] uppercase tracking-wider">Letzte Trainings</h2>
              <button onClick={() => router.push('/tracker')} className="text-xs text-cyan-400 font-medium">Alle →</button>
            </div>
            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <div key={w.id} className="flex items-center gap-3 rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--fg-primary))] truncate">{w.trainingDayName}</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">
                      {format(new Date(w.startTime), 'EEEE, d. MMM', { locale: de })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-[hsl(var(--fg-muted))]">
                      <Clock className="w-3 h-3" />
                      {w.duration || '—'} min
                    </div>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">
                      {w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)} Sätze
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Weak Points ──────────────────────────────────────── */}
        {weakPoints.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[hsl(var(--fg-secondary))] uppercase tracking-wider mb-3">Schwachstellen</h2>
            <div className="space-y-2">
              {weakPoints.slice(0, 3).map((wp) => (
                <div key={wp.muscle} className="flex items-center justify-between rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <p className="text-sm font-medium text-[hsl(var(--fg-primary))]">{MUSCLE_NAMES_DE[wp.muscle] || wp.muscle}</p>
                  </div>
                  <p className="text-xs text-[hsl(var(--fg-muted))]">{wp.weeklyVolume} Sätze/Woche</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Personal Records ─────────────────────────────────── */}
        {stats.personalRecords.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-[hsl(var(--fg-secondary))] uppercase tracking-wider">Rekorde</h2>
            </div>
            <div className="space-y-2">
              {stats.personalRecords.map((r) => (
                <div key={r.exercise} className="flex items-center justify-between rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3">
                  <p className="text-sm font-medium text-[hsl(var(--fg-primary))] truncate">{r.exercise}</p>
                  <p className="text-sm font-bold text-amber-400 shrink-0 ml-2">{r.weight}kg × {r.reps}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Access Grid ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 pb-2">
          {[
            { label: 'Ernährung', icon: '🍎', href: '/nutrition' },
            { label: 'Kalender', icon: '📅', href: '/calendar' },
            { label: 'Ziele', icon: '🎯', href: '/goals' },
            { label: 'Muskelbalance', icon: '⚖️', href: '/muscle-balance' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-3 rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3.5 active:scale-[0.97] transition-transform"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium text-[hsl(var(--fg-primary))]">{item.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ── Onboarding Modal ─────────────────────────────────── */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[hsl(225,14%,11%)] border border-[hsl(225,10%,18%)] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Willkommen 👋</h2>
            <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">Wie sollen wir dich nennen?</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Name</label>
                <input
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  placeholder="Dein Name"
                  className="w-full rounded-xl border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-sm text-[hsl(var(--fg-primary))] outline-none focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Trainingsziel (optional)</label>
                <input
                  value={onboardingGoal}
                  onChange={(e) => setOnboardingGoal(e.target.value)}
                  placeholder="z.B. Muskeln aufbauen"
                  className="w-full rounded-xl border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-sm text-[hsl(var(--fg-primary))] outline-none focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { updateProfile({ hasCompletedOnboarding: true }); setShowOnboarding(false); }}
                className="flex-1 rounded-xl border border-[hsl(225,10%,20%)] py-3 text-sm font-medium text-[hsl(var(--fg-muted))] hover:bg-white/5"
              >
                Überspringen
              </button>
              <button
                onClick={handleCompleteOnboarding}
                disabled={!onboardingName.trim()}
                className="flex-1 rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-40"
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
