'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { Meal } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { format, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Activity, Flame, Trophy, Droplets, Target, ArrowRight, TrendingUp, Zap, Moon, Award, Dumbbell } from 'lucide-react';
import { BodyWeightWidget } from '@/components/dashboard/BodyWeightWidget';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Animated Counter with smooth easing
function AnimatedCounter({ value, suffix = '', duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number>();

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    startTime.current = null;
    animationFrame.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [value, duration]);
  
  return <>{displayValue.toLocaleString()}{suffix}</>;
}

// Animated Progress Ring with smooth transition
function ProgressRing({ 
  value, 
  max, 
  size = 100, 
  strokeWidth = 8, 
  color = '#3b82f6',
  bgColor = '#f1f5f9',
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min((value / max) * 100, 100);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);
  
  const offset = circumference - (animatedProgress / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg 
        className="transform -rotate-90 drop-shadow-sm" 
        width={size} 
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: 'drop-shadow(0 0 6px ' + color + '40)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-800">
          <AnimatedCounter value={value} />
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Modern Gradient Card
function GradientCard({ 
  children, 
  gradient, 
  className = '',
  onClick
}: { 
  children: React.ReactNode;
  gradient: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br ${gradient}
        shadow-lg hover:shadow-xl
        transform hover:-translate-y-1 hover:scale-[1.02]
        transition-all duration-300 ease-out
        cursor-pointer group
        ${className}
      `}
      onClick={onClick}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
      {children}
    </div>
  );
}

// Glass Card
function GlassCard({ 
  children, 
  className = '',
  delay = 0 
}: { 
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div 
      className={`
        bg-white/80 backdrop-blur-sm
        rounded-2xl border border-slate-200/60
        p-5 shadow-sm
        hover:shadow-md hover:bg-white
        transition-all duration-300
        animate-fade-in-up
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { workoutSessions, trainingPlans, trainingDays } = useWorkoutStore();
  const { nutritionGoals, dailyTracking, meals } = useNutritionStore();
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

    const weekWorkouts = workoutSessions.filter(s =>
      isWithinInterval(new Date(s.startTime), { start: weekStart, end: weekEnd })
    );

    const totalCalories = (meals || [])
      .filter((m: Meal) => format(new Date(m.date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'))
      .reduce((sum: number, m: Meal) => sum + (m.totalCalories || 0), 0);

    const activePlan = trainingPlans.find(p => p.isActive);
    const nextDayId = activePlan?.trainingDays[activePlan.currentDayIndex ?? 0];
    const nextTrainingDay = trainingDays.find(d => d.id === nextDayId);

    // Weekly goal progress
    const weeklyGoal = activePlan?.sessionsPerWeek || 4;
    const weekProgress = Math.min((weekWorkouts.length / weeklyGoal) * 100, 100);

    // Calculate Personal Records based on estimated 1RM (One Rep Max)
    // Formula: 1RM ≈ weight × (1 + reps/30) - Epley Formula
    const personalRecords: { exercise: string; weight: number; reps: number; date: string; estimated1RM: number }[] = [];
    const exerciseMaxes: Record<string, { weight: number; reps: number; date: string; estimated1RM: number }> = {};

    workoutSessions.forEach(session => {
      session.exercises.forEach((ex) => {
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        const exerciseName = exerciseData?.name || ex.exerciseId;

        ex.sets.forEach(set => {
          // Only count completed sets with weight > 0 and reps > 0
          if (set.completed && set.weight > 0 && set.reps > 0) {
            // Calculate estimated 1RM using Epley formula
            const estimated1RM = set.weight * (1 + set.reps / 30);

            // Update if this is a new exercise or if the estimated 1RM is higher
            if (!exerciseMaxes[exerciseName] || estimated1RM > exerciseMaxes[exerciseName].estimated1RM) {
              exerciseMaxes[exerciseName] = {
                weight: set.weight,
                reps: set.reps,
                date: typeof session.startTime === 'string' ? session.startTime : session.startTime.toISOString(),
                estimated1RM: estimated1RM
              };
            }
          }
        });
      });
    });

    // Sort by estimated 1RM (best records first)
    Object.entries(exerciseMaxes)
      .sort((a, b) => b[1].estimated1RM - a[1].estimated1RM)
      .slice(0, 5)
      .forEach(([exercise, record]) => {
        personalRecords.push({ exercise, ...record });
      });

    return {
      weekWorkouts: weekWorkouts.length,
      caloriesGoal: nutritionGoals?.dailyCalories || 2500,
      caloriesConsumed: Math.round(totalCalories),
      waterGoal: nutritionGoals?.waterGoal || 3000,
      waterConsumed: dailyTracking?.waterIntake || 0,
      activePlan,
      nextTrainingDay,
      weeklyGoal,
      weekProgress,
      personalRecords,
    };
  }, [workoutSessions, nutritionGoals, dailyTracking, meals, trainingPlans, trainingDays]);

  if (!mounted) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* ═══ HERO SECTION ═══ */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-8 text-white animate-fade-in">
          {/* Decorative elements - reduced on mobile */}
          <div className="absolute top-0 right-0 w-40 sm:w-80 h-40 sm:h-80 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-60 h-32 sm:h-60 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
            <div>
              <p className="text-blue-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2 animate-fade-in-up">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {user?.displayName?.split(' ')[0] || 'Athlet'} 👋
              </h1>
              <p className="text-slate-400 text-sm sm:text-base animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ MAIN METRICS ROW ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Kalorien */}
          <GradientCard
            gradient="from-orange-500 to-rose-500"
            onClick={() => router.push('/nutrition')}
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex-1">
                <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Kalorien heute</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  <AnimatedCounter value={stats.caloriesConsumed} />
                </p>
                <p className="text-white/60 text-xs sm:text-sm mt-1">von {stats.caloriesGoal} kcal</p>
              </div>
              <div className="relative flex-shrink-0 hidden sm:block">
                <ProgressRing
                  value={stats.caloriesConsumed}
                  max={stats.caloriesGoal}
                  size={70}
                  strokeWidth={6}
                  color="#fff"
                  bgColor="rgba(255,255,255,0.2)"
                />
              </div>
            </div>
          </GradientCard>

          {/* Wasser */}
          <GradientCard
            gradient="from-cyan-500 to-blue-500"
            onClick={() => router.push('/nutrition')}
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex-1">
                <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Wasser heute</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {(stats.waterConsumed / 1000).toFixed(1)}L
                </p>
                <p className="text-white/60 text-xs sm:text-sm mt-1">von {stats.waterGoal / 1000}L</p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl flex-shrink-0">
                <Droplets className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </GradientCard>

          {/* Trainings diese Woche */}
          <GradientCard
            gradient="from-emerald-500 to-teal-500"
            onClick={() => router.push('/tracker')}
            className="sm:col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex-1">
                <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Trainings</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  <AnimatedCounter value={stats.weekWorkouts} /> / {stats.weeklyGoal}
                </p>
                <p className="text-white/60 text-xs sm:text-sm mt-1">diese Woche</p>
              </div>
              <div className="relative flex-shrink-0 hidden sm:block">
                <ProgressRing
                  value={stats.weekWorkouts}
                  max={stats.weeklyGoal}
                  size={70}
                  strokeWidth={6}
                  color="#fff"
                  bgColor="rgba(255,255,255,0.2)"
                />
              </div>
            </div>
          </GradientCard>
        </div>

        {/* ═══ NEXT WORKOUT ═══ */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">

          {/* Nächstes Training */}
          <GlassCard delay={100}>
            {stats.nextTrainingDay ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg flex-shrink-0">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Nächstes Training</p>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{stats.nextTrainingDay.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    {stats.nextTrainingDay.exercises.length} Übungen
                  </span>
                  <span>•</span>
                  <span>{stats.nextTrainingDay.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} Sätze</span>
                </div>
                <button
                  onClick={() => router.push('/tracker')}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 text-sm sm:text-base"
                >
                  Training starten
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-4">
                <Target className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium text-sm sm:text-base">Kein Training geplant</p>
                <button
                  onClick={() => router.push('/tracker')}
                  className="mt-3 sm:mt-4 px-5 sm:px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-colors text-sm sm:text-base"
                >
                  Plan erstellen
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ═══ PERSONAL RECORDS ═══ */}
        <GlassCard delay={300}>
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-100 flex-shrink-0">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Persönliche Rekorde</h3>
            </div>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
          </div>

          {stats.personalRecords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {stats.personalRecords.slice(0, 4).map((record, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-100 hover:shadow-md transition-all animate-fade-in-up"
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '💪'}
                    </span>
                    <span className="font-medium text-slate-700 text-sm sm:text-base truncate">{record.exercise}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-base sm:text-lg font-bold text-slate-800">{record.weight}kg</span>
                    <span className="text-xs text-slate-400 ml-1">× {record.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-slate-400">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs sm:text-sm">Noch keine Rekorde</p>
              <p className="text-xs mt-1">Absolviere dein erstes Training!</p>
            </div>
          )}
        </GlassCard>

        {/* ═══ QUICK ACTIONS ═══ */}
        <GlassCard delay={400}>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Schnellzugriff</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Training', icon: Activity, href: '/tracker', gradient: 'from-blue-500 to-indigo-500' },
              { label: 'Ernährung', icon: Flame, href: '/nutrition', gradient: 'from-orange-500 to-rose-500' },
              { label: 'Regeneration', icon: Moon, href: '/recovery', gradient: 'from-indigo-500 to-purple-500' },
              { label: 'Statistiken', icon: TrendingUp, href: '/statistics', gradient: 'from-emerald-500 to-teal-500' },
            ].map((action, i) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="group flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${500 + i * 50}ms` }}
              >
                <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-700 text-xs sm:text-sm text-center sm:text-left">{action.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ═══ BODY WEIGHT TRACKING ═══ */}
        <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <BodyWeightWidget compact />
        </div>

      </div>
    </DashboardLayout>
  );
}
