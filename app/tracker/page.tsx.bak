'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Dumbbell, History, Plus, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrainingDayList } from '@/components/tracker/TrainingDayList';
import { TrainingPlanList } from '@/components/tracker/TrainingPlanList';
import { WorkoutHistory } from '@/components/tracker/WorkoutHistory';
import { CreateTrainingDayModal } from '@/components/tracker/CreateTrainingDayModal';
import { SmartWorkoutRecommendation } from '@/components/tracker/SmartWorkoutRecommendation';
import { useWorkoutStore } from '@/store/useWorkoutStore';

type View = 'overview' | 'builder' | 'history';

export default function TrackerPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>('overview');
  const [showCreateDayModal, setShowCreateDayModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { trainingPlans, trainingDays, workoutSessions, advanceToNextDay } = useWorkoutStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePlan = trainingPlans.find((plan) => plan.isActive);

  const nextTrainingDay = useMemo(() => {
    if (activePlan && activePlan.trainingDays.length > 0) {
      const dayId = activePlan.trainingDays[activePlan.currentDayIndex ?? 0];
      return trainingDays.find((day) => day.id === dayId) || null;
    }
    return trainingDays[0] || null;
  }, [activePlan, trainingDays]);

  const handleStartWorkout = (dayId: string) => {
    if (activePlan && nextTrainingDay?.id === dayId) {
      advanceToNextDay(activePlan.id);
    }
    router.push(`/workout?id=${dayId}`);
  };

  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'builder', label: 'Training Builder' },
    { id: 'history', label: 'Historie' },
  ] as const;

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--fg-primary))]">Tracker</h1>
            <p className="text-sm text-[hsl(var(--fg-muted))]">Trainingstage und Pläne in einem Builder.</p>
          </div>
          <button
            onClick={() => router.push('/calendar')}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 shadow-lg shadow-violet-500/20"
          >
            <CalendarDays className="h-4 w-4" />
            Woche planen
          </button>
        </div>

        <div className="inline-flex rounded-xl bg-[hsl(225,12%,13%)] p-1 border border-[hsl(225,10%,16%)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                currentView === tab.id ? 'bg-[hsl(225,14%,18%)] text-[hsl(var(--fg-primary))] shadow-sm' : 'text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentView === 'overview' && (
          <div className="space-y-6">
            <SmartWorkoutRecommendation onStart={handleStartWorkout} />
            {nextTrainingDay ? (
              <div className="rounded-2xl bg-gradient-to-r from-cyan-500/90 to-violet-500/90 p-6 text-white shadow-xl">
                <p className="mb-1 text-sm text-white/70">Nächstes Training</p>
                <h2 className="text-3xl font-bold">{nextTrainingDay.name}</h2>
                <p className="mt-1 text-sm text-white/70">
                  {nextTrainingDay.exercises.length} Übungen •{' '}
                  {nextTrainingDay.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} Sätze
                </p>
                <button
                  onClick={() => handleStartWorkout(nextTrainingDay.id)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-3 font-bold text-white hover:bg-white/25"
                >
                  <Dumbbell className="h-5 w-5" />
                  Training starten
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[hsl(225,12%,15%)] text-[hsl(var(--fg-muted))]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-[hsl(var(--fg-primary))]">Noch kein Trainingstag vorhanden</p>
                <button
                  onClick={() => setShowCreateDayModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Trainingstag erstellen
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Trainingstage</p>
                <p className="mt-1 text-2xl font-black text-emerald-300">{trainingDays.length}</p>
              </div>
              <div className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">Pläne</p>
                <p className="mt-1 text-2xl font-black text-violet-300">{trainingPlans.length}</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Gesamt Trainings</p>
                <p className="mt-1 text-2xl font-black text-amber-300">{workoutSessions.length}</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'builder' && (
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Trainingstage</h2>
                <button
                  onClick={() => setShowCreateDayModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Neu
                </button>
              </div>
              <TrainingDayList />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold text-[hsl(var(--fg-primary))]">Pläne</h2>
              <TrainingPlanList />
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-[hsl(var(--fg-primary))]">Trainingshistorie</h2>
            <WorkoutHistory />
          </div>
        )}
      </div>

      <CreateTrainingDayModal isOpen={showCreateDayModal} onClose={() => setShowCreateDayModal(false)} />
    </DashboardLayout>
  );
}
