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
    { id: 'overview', label: '?bersicht' },
    { id: 'builder', label: 'Training Builder' },
    { id: 'history', label: 'Historie' },
  ] as const;

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Tracker</h1>
            <p className="text-sm text-slate-500">Trainingstage und Pl?ne in einem Builder.</p>
          </div>
          <button
            onClick={() => router.push('/calendar')}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <CalendarDays className="h-4 w-4" />
            Woche planen
          </button>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                currentView === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentView === 'overview' && (
          <div className="space-y-6">
            {nextTrainingDay ? (
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl">
                <p className="mb-1 text-sm text-blue-100">Nächstes Training</p>
                <h2 className="text-3xl font-bold">{nextTrainingDay.name}</h2>
                <p className="mt-1 text-sm text-blue-100">
                  {nextTrainingDay.exercises.length} Übungen •{' '}
                  {nextTrainingDay.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} Sätze
                </p>
                <button
                  onClick={() => handleStartWorkout(nextTrainingDay.id)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-700 hover:bg-blue-50"
                >
                  <Dumbbell className="h-5 w-5" />
                  Training starten
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-slate-800">Noch kein Trainingstag vorhanden</p>
                <button
                  onClick={() => setShowCreateDayModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Trainingstag erstellen
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Trainingstage</p>
                <p className="mt-1 text-2xl font-black text-emerald-800">{trainingDays.length}</p>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Pl?ne</p>
                <p className="mt-1 text-2xl font-black text-violet-800">{trainingPlans.length}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Gesamt Trainings</p>
                <p className="mt-1 text-2xl font-black text-amber-800">{workoutSessions.length}</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'builder' && (
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Trainingstage</h2>
                <button
                  onClick={() => setShowCreateDayModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Neu
                </button>
              </div>
              <TrainingDayList />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-800">Pl?ne</h2>
              <TrainingPlanList />
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-800">Trainingshistorie</h2>
            <WorkoutHistory />
          </div>
        )}
      </div>

      <CreateTrainingDayModal isOpen={showCreateDayModal} onClose={() => setShowCreateDayModal(false)} />
    </DashboardLayout>
  );
}
