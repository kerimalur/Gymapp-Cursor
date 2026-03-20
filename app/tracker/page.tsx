'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, addDays, isSameDay, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dumbbell, Plus, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrainingDayList } from '@/components/tracker/TrainingDayList';
import { TrainingPlanList } from '@/components/tracker/TrainingPlanList';
import { WorkoutHistory } from '@/components/tracker/WorkoutHistory';
import { CreateTrainingDayModal } from '@/components/tracker/CreateTrainingDayModal';
import { SmartWorkoutRecommendation } from '@/components/tracker/SmartWorkoutRecommendation';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';

type View = 'uebersicht' | 'plaene' | 'verlauf';

export default function TrackerPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>('uebersicht');
  const [showCreateDayModal, setShowCreateDayModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const { trainingPlans, trainingDays, workoutSessions, advanceToNextDay } = useWorkoutStore();
  const { trackingSettings } = useNutritionStore();

  useEffect(() => { setMounted(true); }, []);

  const activePlan = trainingPlans.find((plan) => plan.isActive);

  const nextTrainingDay = useMemo(() => {
    if (activePlan && activePlan.trainingDays.length > 0) {
      const dayId = activePlan.trainingDays[activePlan.currentDayIndex ?? 0];
      return trainingDays.find((day) => day.id === dayId) || null;
    }
    return trainingDays[0] || null;
  }, [activePlan, trainingDays]);

  // Week strip data
  const weekDays = useMemo(() => {
    const now = new Date();
    const ws = startOfWeek(addDays(now, weekOffset * 7), { weekStartsOn: 1 });
    const planned = trackingSettings?.plannedWorkoutDays || {};
    const getWeekKey = (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-ww');
    const weekKey = getWeekKey(ws);
    const plannedDays = planned[weekKey] || [];

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(ws, i);
      const dayIdx = getDay(date) === 0 ? 6 : getDay(date) - 1;
      const isPlanned = plannedDays.includes(dayIdx);
      const hasWorkout = workoutSessions.some((s) => isSameDay(new Date(s.startTime), date));
      const isToday = isSameDay(date, now);
      return { date, isPlanned, hasWorkout, isToday };
    });
  }, [weekOffset, workoutSessions, trackingSettings]);

  const handleStartWorkout = (dayId: string) => {
    if (activePlan && nextTrainingDay?.id === dayId) {
      advanceToNextDay(activePlan.id);
    }
    router.push(`/workout?id=${dayId}`);
  };

  const tabs = [
    { id: 'uebersicht' as const, label: 'Übersicht' },
    { id: 'plaene' as const, label: 'Pläne' },
    { id: 'verlauf' as const, label: 'Verlauf' },
  ];

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="pt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[hsl(var(--fg-primary))]">Training</h1>
          <button
            onClick={() => setShowCreateDayModal(true)}
            className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── Week Strip ─────────────────────────────────────── */}
        <div className="rounded-xl bg-[hsl(225,14%,10%)] border border-[hsl(225,10%,16%)] p-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 text-[hsl(var(--fg-muted))] active:text-[hsl(var(--fg-primary))]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-xs font-semibold text-[hsl(var(--fg-secondary))]">
              {weekOffset === 0 ? 'Diese Woche' : format(weekDays[0].date, 'd. MMM', { locale: de }) + ' – ' + format(weekDays[6].date, 'd. MMM', { locale: de })}
            </p>
            <button onClick={() => setWeekOffset(w => Math.min(w + 1, 0))} className="p-1 text-[hsl(var(--fg-muted))] active:text-[hsl(var(--fg-primary))]" disabled={weekOffset >= 0}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(({ date, isPlanned, hasWorkout, isToday }) => (
              <div key={date.toISOString()} className={`flex flex-col items-center py-2 rounded-lg ${isToday ? 'bg-cyan-400/10 border border-cyan-400/20' : ''}`}>
                <span className="text-[10px] text-[hsl(var(--fg-muted))] uppercase">{format(date, 'EEEEE', { locale: de })}</span>
                <span className={`text-sm font-bold mt-0.5 ${isToday ? 'text-cyan-400' : 'text-[hsl(var(--fg-primary))]'}`}>
                  {format(date, 'd')}
                </span>
                <div className="flex gap-0.5 mt-1">
                  {hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  {isPlanned && !hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(225,12%,25%)]" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div className="flex gap-1 bg-[hsl(225,12%,10%)] p-1 rounded-xl border border-[hsl(225,10%,16%)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                currentView === tab.id
                  ? 'bg-[hsl(225,14%,16%)] text-[hsl(var(--fg-primary))] shadow-sm'
                  : 'text-[hsl(var(--fg-muted))]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Übersicht ──────────────────────────────────────── */}
        {currentView === 'uebersicht' && (
          <div className="space-y-4">
            <SmartWorkoutRecommendation onStart={handleStartWorkout} />

            {nextTrainingDay ? (
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 p-5 shadow-lg">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Nächstes Training</p>
                <h2 className="text-2xl font-bold text-white mt-1">{nextTrainingDay.name}</h2>
                <p className="text-white/60 text-sm mt-0.5">
                  {nextTrainingDay.exercises.length} Übungen · {nextTrainingDay.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} Sätze
                </p>
                <button
                  onClick={() => handleStartWorkout(nextTrainingDay.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-2.5 font-bold text-white active:scale-[0.97] transition-transform"
                >
                  <Dumbbell className="w-4 h-4" />
                  Training starten
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(225,12%,15%)]">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--fg-muted))]" />
                </div>
                <p className="font-semibold text-[hsl(var(--fg-primary))]">Noch kein Trainingstag</p>
                <p className="text-sm text-[hsl(var(--fg-muted))] mt-1">Erstelle deinen ersten Trainingstag</p>
                <button
                  onClick={() => setShowCreateDayModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.97] transition-transform shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Erstellen
                </button>
              </div>
            )}

            {/* Stats Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Tage</p>
                <p className="text-xl font-black text-emerald-300">{trainingDays.length}</p>
              </div>
              <div className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-400">Pläne</p>
                <p className="text-xl font-black text-violet-300">{trainingPlans.length}</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Trainings</p>
                <p className="text-xl font-black text-amber-300">{workoutSessions.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Pläne ──────────────────────────────────────────── */}
        {currentView === 'plaene' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Trainingstage</h2>
                <button
                  onClick={() => setShowCreateDayModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Neu
                </button>
              </div>
              <TrainingDayList />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))] mb-3">Pläne</h2>
              <TrainingPlanList />
            </div>
          </div>
        )}

        {/* ── Verlauf ────────────────────────────────────────── */}
        {currentView === 'verlauf' && (
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))] mb-3">Trainingshistorie</h2>
            <WorkoutHistory />
          </div>
        )}

      </div>

      <CreateTrainingDayModal isOpen={showCreateDayModal} onClose={() => setShowCreateDayModal(false)} />
    </DashboardLayout>
  );
}
