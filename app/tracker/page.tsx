'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrainingDayList } from '@/components/tracker/TrainingDayList';
import { TrainingPlanList } from '@/components/tracker/TrainingPlanList';
import { WorkoutHistory } from '@/components/tracker/WorkoutHistory';
import { CreateTrainingDayModal } from '@/components/tracker/CreateTrainingDayModal';
import { CreateTrainingPlanModal } from '@/components/tracker/CreateTrainingPlanModal';
import { useWorkoutStore } from '@/store/useWorkoutStore';

type View = 'overview' | 'trainingDays' | 'trainingPlans' | 'history';

// Minimal icons
const Icons = {
  play: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  ),
  playSmall: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  lightning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  fire: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
};

export default function TrackerPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>('overview');
  const [showCreateDayModal, setShowCreateDayModal] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { 
    trainingPlans, 
    trainingDays, 
    workoutSessions,
    advanceToNextDay 
  } = useWorkoutStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get active training plan
  const activePlan = trainingPlans.find(p => p.isActive);
  
  // Get next training day from active plan
  const getNextTrainingDay = () => {
    if (!activePlan || activePlan.trainingDays.length === 0) return null;
    const currentIndex = activePlan.currentDayIndex ?? 0;
    const trainingDayId = activePlan.trainingDays[currentIndex];
    return trainingDays.find(d => d.id === trainingDayId);
  };
  
  const nextTrainingDay = getNextTrainingDay();

  // Get recent sessions count
  const recentSessionsCount = workoutSessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }).length;

  // Calculate streak
  const calculateStreak = () => {
    if (workoutSessions.length === 0) return 0;
    const sortedSessions = [...workoutSessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }
    return streak;
  };

  // Start workout for next training day
  const handleStartWorkout = () => {
    if (!nextTrainingDay) return;
    
    // Advance to next day in the plan
    if (activePlan) {
      advanceToNextDay(activePlan.id);
    }
    
    // Navigate to workout page
    router.push(`/workout?id=${nextTrainingDay.id}`);
  };

  // Start any training day directly (not following the plan)
  const handleStartAnyWorkout = (dayId: string) => {
    router.push(`/workout?id=${dayId}`);
  };

  // Get upcoming days preview
  const getNextDaysPreview = () => {
    if (!activePlan || activePlan.trainingDays.length === 0) return [];
    const currentIndex = activePlan.currentDayIndex ?? 0;
    const preview = [];
    for (let i = 0; i < Math.min(3, activePlan.trainingDays.length); i++) {
      const dayIndex = (currentIndex + i) % activePlan.trainingDays.length;
      const dayId = activePlan.trainingDays[dayIndex];
      const day = trainingDays.find(d => d.id === dayId);
      if (day) {
        preview.push({ ...day, isNext: i === 0 });
      }
    }
    return preview;
  };

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Icons.lightning },
    { id: 'trainingDays', label: 'Trainingstage', icon: Icons.calendar },
    { id: 'trainingPlans', label: 'Pläne', icon: Icons.folder },
    { id: 'history', label: 'Historie', icon: Icons.clock },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header - Klar und einfach */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">⚡ Tracker</h1>
          <p className="text-slate-500 mt-1">Dein Training im Überblick</p>
        </div>

        {/* Tab Navigation - Einfacher */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as View)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === tab.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Content */}
        {currentView === 'overview' && (
          <div className="space-y-6">
            {/* Nächstes Training - Groß und klar */}
            {activePlan && nextTrainingDay ? (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">Nächstes Training</p>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2">{nextTrainingDay.name}</h2>
                    <div className="flex items-center gap-4 text-blue-100 text-sm">
                      <span>{nextTrainingDay.exercises.length} Übungen</span>
                      <span>•</span>
                      <span>{nextTrainingDay.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} Sätze</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleStartWorkout}
                    className="flex items-center gap-3 px-6 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      {Icons.play}
                    </div>
                    Training starten
                  </button>
                </div>
              </div>
            ) : (
              /* Kein aktiver Plan */
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6">
                <div className="text-5xl mb-4">🏋️</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Kein aktiver Trainingsplan
                </h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Erstelle einen Trainingsplan um dein nächstes Training zu sehen.
                </p>
                <button
                  onClick={() => setCurrentView('trainingPlans')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Trainingspläne ansehen
                </button>
              </div>
            )}

            {/* Schnelle Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">Diese Woche</p>
                <p className="text-2xl font-bold text-blue-600">{recentSessionsCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">Streak</p>
                <p className="text-2xl font-bold text-orange-500">{calculateStreak()} Tage</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">Trainingstage</p>
                <p className="text-2xl font-bold text-slate-800">{trainingDays.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">Gesamt</p>
                <p className="text-2xl font-bold text-slate-800">{workoutSessions.length}</p>
              </div>
            </div>

            {/* Verfügbare Trainings - Einfach starten */}
            {trainingDays.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Schnellstart</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trainingDays.map((day) => (
                    <div 
                      key={day.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-800">{day.name}</p>
                          <p className="text-xs text-slate-500">
                            {day.exercises.length} Übungen • {day.exercises.reduce((s, e) => s + e.sets.length, 0)} Sätze
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartAnyWorkout(day.id)}
                        className="w-full py-2.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                      >
                        {Icons.playSmall}
                        Starten
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kommende Trainings - Falls mehr als 1 */}
            {activePlan && activePlan.trainingDays.length > 1 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Dein Plan</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {getNextDaysPreview().map((day, index) => (
                    <div 
                      key={`${day.id}-${index}`}
                      className={`flex-shrink-0 w-48 bg-white rounded-xl border p-4 ${
                        day.isNext ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mb-2 ${
                        day.isNext ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <p className={`font-semibold text-sm ${day.isNext ? 'text-blue-700' : 'text-slate-800'}`}>
                        {day.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {day.exercises.length} Übungen
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Letzte Trainings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800">Letzte Trainings</h3>
                <button
                  onClick={() => setCurrentView('history')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Alle anzeigen →
                </button>
              </div>
              <WorkoutHistory limit={3} />
            </div>
          </div>
        )}

        {/* Trainingstage View */}
        {currentView === 'trainingDays' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Trainingstage</h2>
              <button
                onClick={() => setShowCreateDayModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {Icons.plus}
                Neu
              </button>
            </div>
            <TrainingDayList />
          </div>
        )}

        {/* Trainingspläne View */}
        {currentView === 'trainingPlans' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Trainingspläne</h2>
              <button
                onClick={() => setShowCreatePlanModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
              >
                {Icons.plus}
                Neu
              </button>
            </div>
            <TrainingPlanList />
          </div>
        )}

        {/* Historie View */}
        {currentView === 'history' && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Trainingshistorie</h2>
            <WorkoutHistory />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTrainingDayModal 
        isOpen={showCreateDayModal} 
        onClose={() => setShowCreateDayModal(false)} 
      />
      <CreateTrainingPlanModal 
        isOpen={showCreatePlanModal} 
        onClose={() => setShowCreatePlanModal(false)} 
      />
    </DashboardLayout>
  );
}
