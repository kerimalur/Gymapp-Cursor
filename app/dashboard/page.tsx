'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Droplets, Flame, Target, Trophy, Zap,
  ChevronRight, Dumbbell, TrendingUp, Brain, Sparkles
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { MomentumScore } from '@/components/coaching/MomentumScore';
import { CoachInsights } from '@/components/coaching/CoachInsights';
import { WeakPointCard } from '@/components/coaching/WeakPointCard';
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
  generateCoachInsights,
  analyzeWeakPoints,
  calculateFatigueIndex,
} from '@/lib/coachingEngine';


// ─── Stat Card (Dark Glassmorphism) ──────────────────────────────────────────

function StatCard({
  title, value, sub, gradient, onClick, icon,
}: {
  title: string; value: string; sub: string;
  gradient: string; onClick?: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl ${gradient} p-4 text-left shadow-lg transition-all active:scale-[0.97] hover:-translate-y-0.5 hover:shadow-xl border border-white/5`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">{title}</p>
        <div className="rounded-lg bg-white/10 p-1.5 backdrop-blur-sm">{icon}</div>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/50 font-medium">{sub}</p>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { workoutSessions, trainingPlans, trainingDays, strengthGoals, weeklyVolumeGoalSets } = useWorkoutStore();
  const { nutritionGoals, dailyTracking, trackedMeals, trackingSettings, resetDailyTrackingIfNeeded, sleepEntries } = useNutritionStore();
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
    const totalCarbs = todayMeals.reduce((s, m) => s + (m.carbs || 0), 0);
    const totalFats = todayMeals.reduce((s, m) => s + (m.fats || 0), 0);
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
      proteinConsumed: Math.round(totalProtein),
      carbsConsumed: Math.round(totalCarbs),
      fatsConsumed: Math.round(totalFats),
      waterGoal: nutritionGoals?.waterGoal || 3000,
      waterConsumed: dailyTracking?.waterIntake || 0,
      weeklyGoal: activePlan?.sessionsPerWeek || Math.max(3, thisWeekPlanned.length || 3),
      nextTrainingDay, nextPlannedDate,
      hasPlannedTraining: !!nextPlannedDate || thisWeekPlanned.length > 0,
      plannedThisWeek: thisWeekPlanned.length,
      avgRecovery, readyMuscles, tiredMuscles, personalRecords,
      recoveryMap, enabled,
    };
  }, [workoutSessions, trackedMeals, nutritionGoals, dailyTracking, trainingPlans, trainingDays, trackingSettings]);

  // ── Coaching Engine ──
  const momentum = useMemo(() => calculateMomentum(
    workoutSessions,
    { caloriesConsumed: stats.caloriesConsumed, proteinConsumed: stats.proteinConsumed, goals: nutritionGoals },
    stats.recoveryMap,
    stats.weeklyGoal,
  ), [workoutSessions, stats, nutritionGoals]);

  const coachInsights = useMemo(() => {
    const lastSleep = sleepEntries?.length > 0 ? sleepEntries[sleepEntries.length - 1] : null;
    return generateCoachInsights(
      workoutSessions,
      {
        caloriesConsumed: stats.caloriesConsumed,
        proteinConsumed: stats.proteinConsumed,
        carbsConsumed: stats.carbsConsumed,
        fatsConsumed: stats.fatsConsumed,
        waterIntake: stats.waterConsumed,
        goals: nutritionGoals,
        sleepHours: lastSleep?.hoursSlept,
        sleepQuality: lastSleep?.quality,
      },
      stats.enabled,
      stats.weeklyGoal,
      strengthGoals,
      bodyWeightGoal ? { targetWeight: bodyWeightGoal.targetWeight, startWeight: bodyWeightGoal.startWeight } : null,
    );
  }, [workoutSessions, stats, nutritionGoals, strengthGoals, bodyWeightGoal, sleepEntries]);

  const weakPoints = useMemo(
    () => analyzeWeakPoints(workoutSessions, stats.enabled),
    [workoutSessions, stats.enabled]
  );

  const fatigue = useMemo(
    () => calculateFatigueIndex(workoutSessions),
    [workoutSessions]
  );

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
      <div className="mx-auto max-w-3xl space-y-4 pb-24 lg:pb-6">

        {/* ── Hero: Greeting + Next Workout ─────────────────────────── */}
        <div className="rounded-3xl bg-gradient-to-br from-[hsl(225,14%,11%)] via-[hsl(225,14%,10%)] to-[hsl(225,14%,8%)] p-5 border border-[hsl(225,10%,16%)] shadow-xl relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-cyan-400/8 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-violet-500/5 to-transparent pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-400">{greeting}, {displayName} 👋</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--fg-subtle))]">{format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}</p>
              </div>
              {/* Momentum mini badge */}
              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${
                momentum.score >= 60 ? 'bg-emerald-400/10 border border-emerald-400/20' : 
                momentum.score >= 30 ? 'bg-amber-400/10 border border-amber-400/20' : 
                'bg-red-400/10 border border-red-400/20'
              }`}>
                <span className="text-lg font-black text-[hsl(var(--fg-primary))]">{momentum.score}</span>
                <span className="text-[8px] text-[hsl(var(--fg-muted))] -mt-0.5">Score</span>
              </div>
            </div>

            {stats.nextTrainingDay ? (
              <button
                onClick={() => router.push('/tracker')}
                className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 text-left hover:bg-white/[0.07] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-400/15 p-2.5">
                    <Dumbbell className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[hsl(var(--fg-subtle))] uppercase tracking-wider">Nächstes Training</p>
                    <p className="font-bold text-[hsl(var(--fg-primary))]">{stats.nextTrainingDay.name}</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">{stats.nextTrainingDay.exercises.length} Übungen</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[hsl(var(--fg-subtle))]" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/tracker')}
                className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 hover:bg-white/[0.07] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-400/15 p-2.5">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[hsl(var(--fg-subtle))] uppercase tracking-wider">Kein Plan aktiv</p>
                    <p className="font-bold text-[hsl(var(--fg-primary))]">Training starten</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[hsl(var(--fg-subtle))]" />
              </button>
            )}
          </div>
        </div>

        {/* ── 3 Key Metrics ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            title="Kalorien"
            value={`${stats.caloriesConsumed}`}
            sub={`/ ${stats.caloriesGoal}`}
            gradient="bg-gradient-to-br from-orange-500/90 to-rose-600/90"
            icon={<Flame className="h-4 w-4 text-white" />}
            onClick={() => router.push('/nutrition')}
          />
          <StatCard
            title="Wasser"
            value={`${(stats.waterConsumed / 1000).toFixed(1)}L`}
            sub={`/ ${stats.waterGoal / 1000}L`}
            gradient="bg-gradient-to-br from-cyan-500/90 to-blue-600/90"
            icon={<Droplets className="h-4 w-4 text-white" />}
            onClick={() => router.push('/nutrition')}
          />
          <StatCard
            title="Trainings"
            value={`${stats.weekWorkouts}/${stats.weeklyGoal}`}
            sub="diese Woche"
            gradient="bg-gradient-to-br from-emerald-500/90 to-teal-600/90"
            icon={<Zap className="h-4 w-4 text-white" />}
            onClick={() => router.push('/tracker')}
          />
        </div>

        {/* ── Coach Insights ───────────────────────────────────────── */}
        <CoachInsights insights={coachInsights} maxShow={3} />

        {/* ── Momentum Score ───────────────────────────────────────── */}
        <MomentumScore data={momentum} />

        {/* ── Recovery Quick Status ─────────────────────────────────── */}
        <button
          onClick={() => router.push('/recovery')}
          className="flex w-full items-center gap-4 rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-4 hover:border-[hsl(var(--primary))/0.2] hover:shadow-lg transition-all active:scale-[0.99]"
        >
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90 momentum-ring" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" strokeWidth="5" className="stroke-[hsl(225,12%,16%)]" />
              <circle
                cx="28" cy="28" r="24" fill="none" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - stats.avgRecovery / 100)}`}
                className={stats.avgRecovery >= 80 ? 'stroke-emerald-400' : stats.avgRecovery >= 50 ? 'stroke-amber-400' : 'stroke-red-400'}
                style={{ filter: `drop-shadow(0 0 4px ${stats.avgRecovery >= 80 ? 'rgba(52,211,153,0.4)' : stats.avgRecovery >= 50 ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)'})` }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-[hsl(var(--fg-primary))]">
              {stats.avgRecovery}%
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[hsl(var(--fg-primary))]">Regeneration</p>
            <p className="text-xs text-[hsl(var(--fg-muted))]">
              {stats.readyMuscles.length} bereit · {stats.tiredMuscles.length > 0
                ? `${stats.tiredMuscles.slice(0, 2).map(m => MUSCLE_NAMES_DE[m]).join(', ')} müde`
                : 'alle erholt'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-[hsl(var(--fg-subtle))] shrink-0" />
        </button>

        {/* ── Fatigue Warning ──────────────────────────────────────── */}
        {fatigue.index > 50 && (
          <div className={`rounded-2xl p-4 border ${fatigue.needsDeload ? 'border-red-400/30 bg-red-400/5' : 'border-amber-400/30 bg-amber-400/5'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{fatigue.needsDeload ? '🛑' : '⚠️'}</span>
              <div>
                <p className="font-bold text-sm text-[hsl(var(--fg-primary))]">
                  Ermüdungsindex: {fatigue.index}%
                </p>
                <p className="text-xs text-[hsl(var(--fg-muted))]">{fatigue.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Weak Points ─────────────────────────────────────────── */}
        {weakPoints.length > 0 && <WeakPointCard weakPoints={weakPoints} />}

        {/* ── Goals Quick Link ──────────────────────────────────────── */}
        <button
          onClick={() => router.push('/goals')}
          className="flex w-full items-center justify-between rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-4 hover:border-violet-400/20 hover:shadow-lg transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-400/15 p-2">
              <Target className="h-5 w-5 text-violet-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[hsl(var(--fg-primary))]">Ziele</p>
              <p className="text-xs text-[hsl(var(--fg-muted))]">
                {activeGoals === 0 ? 'Noch keine Ziele gesetzt' : `${activeGoals} / 3 aktiv`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeGoals > 0 && (
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`h-2 w-2 rounded-full ${i < activeGoals ? 'bg-violet-400 shadow-[0_0_4px_rgba(167,139,250,0.4)]' : 'bg-[hsl(225,12%,20%)]'}`} />
                ))}
              </div>
            )}
            <ChevronRight className="h-4 w-4 text-[hsl(var(--fg-subtle))]" />
          </div>
        </button>

        {/* ── Personal Records ─────────────────────────────────────── */}
        {stats.personalRecords.length > 0 && (
          <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-[hsl(var(--fg-primary))]">Persönliche Rekorde</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {stats.personalRecords.map((r) => (
                <div key={r.exercise} className="rounded-xl bg-[hsl(225,12%,13%)] p-3 border border-[hsl(225,10%,18%)]">
                  <p className="truncate text-sm font-semibold text-[hsl(var(--fg-primary))]">{r.exercise}</p>
                  <p className="text-xs text-[hsl(var(--fg-muted))]">{r.weight}kg × {r.reps}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Daily Coach Tip ──────────────────────────────────────── */}
        <DailyCoachTip workoutSessions={workoutSessions} />



      </div>

      {/* ── Onboarding Modal ─────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
