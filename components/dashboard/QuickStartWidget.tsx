'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { TrainingDayDetailModal } from '@/components/tracker/TrainingDayDetailModal';
import { Play, ChevronRight, Dumbbell, Clock, Zap, Info } from 'lucide-react';

export function QuickStartWidget() {
  const router = useRouter();
  const { trainingPlans, trainingDays, currentWorkout } = useWorkoutStore();
  const [showDetails, setShowDetails] = useState(false);

  // Get active plan and next training day
  const activePlan = trainingPlans.find(p => p.isActive);
  const nextDayId = activePlan?.trainingDays[activePlan.currentDayIndex ?? 0];
  const nextTrainingDay = trainingDays.find(d => d.id === nextDayId);

  // If there's an active workout, show continue option
  if (currentWorkout) {
    const currentDay = trainingDays.find(d => d.id === currentWorkout.trainingDayId);
    
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-white/80">Aktives Training</p>
            <h3 className="font-bold text-lg">{currentDay?.name || 'Training'}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-4 text-sm text-white/90">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Läuft...</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>{currentWorkout.exercises.length} Übungen</span>
          </div>
        </div>

        <button
          onClick={() => router.push(`/workout?id=${currentWorkout.trainingDayId}`)}
          className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Training fortsetzen
        </button>
      </div>
    );
  }

  // No active plan
  if (!activePlan || !nextTrainingDay) {
    return (
      <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-300 rounded-xl">
            <Dumbbell className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Kein aktiver Plan</p>
            <h3 className="font-bold text-lg text-slate-800">Training starten</h3>
          </div>
        </div>
        
        <button
          onClick={() => router.push('/tracker')}
          className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
        >
          <ChevronRight className="w-5 h-5" />
          Trainingsplan erstellen
        </button>
      </div>
    );
  }

  // Show next scheduled training
  const exerciseCount = nextTrainingDay.exercises?.length || 0;

  return (
    <>
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/80">Nächstes Training</p>
            <h3 className="font-bold text-lg">{nextTrainingDay.name}</h3>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            title="Details anzeigen"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-4 text-sm text-white/90">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>{exerciseCount} Übungen</span>
          </div>
          <span className="text-white/50">•</span>
          <span>{activePlan.name}</span>
        </div>

        <button
          onClick={() => router.push(`/workout?id=${nextTrainingDay.id}`)}
          className="w-full py-3 bg-white text-primary-600 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Jetzt starten
        </button>
      </div>
      
      <TrainingDayDetailModal
        isOpen={showDetails}
        trainingDay={nextTrainingDay}
        onClose={() => setShowDetails(false)}
        onStart={(day) => {
          setShowDetails(false);
          router.push(`/workout?id=${day.id}`);
        }}
      />
    </>
  );
}
