'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { RestTimer } from '@/components/workout/RestTimer';
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal';
import toast from 'react-hot-toast';

// Helper to find exercise in both database and custom exercises
const findExercise = (exerciseId: string, customExercises: any[]) => {
  return exerciseDatabase.find(ex => ex.id === exerciseId) || 
         customExercises.find(ex => ex.id === exerciseId);
};

// Typen für Empfehlungen
interface ExerciseRecommendation {
  exerciseId: string;
  recommendedWeight: number;
  recommendedReps: number;
  targetRIR: number;
  lastWeight: number;
  lastReps: number;
  lastRIR: number | undefined;
  recommendation: 'increase' | 'maintain' | 'decrease';
  reason: string;
}

// Icons
const Icons = {
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  minus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  ),
  fire: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
  ),
  warmup: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  ),
  assisted: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Progress Ring Component
function ProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="progress-ring" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary-500 progress-ring-circle"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export function ActiveWorkout() {
  const {
    currentWorkout,
    setCurrentWorkout,
    addWorkoutSession,
    workoutSessions,
    customExercises,
    workoutSettings,
    startRestTimer
  } = useWorkoutStore();
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workout, setWorkout] = useState(currentWorkout);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [plateCalculatorWeight, setPlateCalculatorWeight] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Berechne Empfehlungen basierend auf historischen Daten
  const exerciseRecommendations = useMemo(() => {
    const recommendations: Map<string, ExerciseRecommendation> = new Map();
    
    if (!workout) return recommendations;

    // Letzte 4 Wochen Daten
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentSessions = workoutSessions
      .filter(s => new Date(s.startTime) >= fourWeeksAgo)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    workout.exercises.forEach(ex => {
      // Finde historische Daten für diese Übung
      const exerciseHistory: Array<{
        date: Date;
        weight: number;
        reps: number;
        rir: number | undefined;
      }> = [];

      recentSessions.forEach(session => {
        const matchingEx = session.exercises.find(e => e.exerciseId === ex.exerciseId);
        if (matchingEx) {
          const completedSets = matchingEx.sets.filter(s => s.completed && s.weight > 0);
          if (completedSets.length >= 2) {
            // Nimm den 2. Satz als Referenz (1. Satz ist oft Aufwärmsatz)
            const referenceSet = completedSets[1];
            
            exerciseHistory.push({
              date: new Date(session.startTime),
              weight: referenceSet.weight,
              reps: referenceSet.reps,
              rir: referenceSet.rir,
            });
          } else if (completedSets.length === 1) {
            // Fallback: Wenn nur 1 Satz, nimm diesen
            const referenceSet = completedSets[0];
            
            exerciseHistory.push({
              date: new Date(session.startTime),
              weight: referenceSet.weight,
              reps: referenceSet.reps,
              rir: referenceSet.rir,
            });
          }
        }
      });

      if (exerciseHistory.length === 0) {
        // Keine historischen Daten - nutze Standardwerte aus TrainingDay
        return;
      }

      const lastSession = exerciseHistory[0];
      const lastRIR = lastSession.rir ?? 2;

      let recommendedWeight = lastSession.weight;
      let recommendedReps = lastSession.reps;
      let targetRIR = 2;
      let recommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';
      let reason = '';

      // Auto-Regulation basierend auf RIR
      if (lastRIR >= 3) {
        // Zu leicht - Gewicht erhöhen
        recommendation = 'increase';
        recommendedWeight = Math.round((lastSession.weight * 1.025) / 2.5) * 2.5;
        if (recommendedWeight === lastSession.weight) {
          recommendedWeight = lastSession.weight + 2.5;
        }
        reason = `RIR ${lastRIR} war zu leicht → +${(recommendedWeight - lastSession.weight).toFixed(1)}kg`;
        targetRIR = 2;
      } else if (lastRIR >= 1.5) {
        // Guter Bereich - leicht steigern oder halten
        const avgRIR = exerciseHistory.slice(0, 3).reduce((sum, h) => sum + (h.rir ?? 2), 0) / Math.min(exerciseHistory.length, 3);
        if (avgRIR >= 2) {
          recommendation = 'increase';
          recommendedWeight = lastSession.weight + 2.5;
          reason = `Stabil bei RIR ${lastRIR.toFixed(1)} → Zeit für +2.5kg`;
        } else {
          recommendation = 'maintain';
          reason = `RIR ${lastRIR.toFixed(1)} - Gewicht halten`;
        }
        targetRIR = 2;
      } else if (lastRIR >= 0.5) {
        // Hart aber machbar - Gewicht halten
        recommendation = 'maintain';
        reason = `RIR ${lastRIR.toFixed(1)} - Anpassung abwarten`;
        targetRIR = 1;
      } else {
        // Zu schwer - Gewicht reduzieren
        recommendation = 'decrease';
        recommendedWeight = Math.round((lastSession.weight * 0.95) / 2.5) * 2.5;
        reason = `RIR ${lastRIR.toFixed(1)} zu hart → -5%`;
        targetRIR = 2;
      }

      recommendations.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        recommendedWeight,
        recommendedReps,
        targetRIR,
        lastWeight: lastSession.weight,
        lastReps: lastSession.reps,
        lastRIR: lastSession.rir,
        recommendation,
        reason,
      });
    });

    return recommendations;
  }, [workout, workoutSessions]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!workout) return 0;
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
      0
    );
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }, [workout]);

  // Calculate current volume (excluding warm-up sets)
  const currentVolume = useMemo(() => {
    if (!workout) return 0;
    return workout.exercises.reduce((total, ex) => {
      return total + ex.sets.reduce((exTotal, set) => {
        // Exclude warm-up sets and handle assisted exercises (use absolute value)
        if (set.isWarmup) return exTotal;
        return exTotal + (set.completed ? Math.abs(set.weight) * set.reps : 0);
      }, 0);
    }, 0);
  }, [workout]);

  if (!workout) return null;

  // Check if exercise supports assisted mode (like pull-ups, dips)
  const isAssistedExercise = (exerciseId: string) => {
    const assistedExercises = ['ex6', 'ex8', 'Dips', 'Klimmzüge', 'Pull-Ups', 'Chin-Ups'];
    const exercise = findExercise(exerciseId, customExercises);
    return assistedExercises.includes(exerciseId) || 
           (exercise && assistedExercises.some(name => exercise.name?.toLowerCase().includes(name.toLowerCase())));
  };

  const handleUpdateWeight = (exIdx: number, setIdx: number, delta: number) => {
    const newWorkout = { ...workout };
    const currentWeight = newWorkout.exercises[exIdx].sets[setIdx].weight;
    const isAssisted = newWorkout.exercises[exIdx].sets[setIdx].isAssisted;
    // Allow negative weights only for assisted exercises
    const minWeight = isAssisted ? -200 : 0;
    newWorkout.exercises[exIdx].sets[setIdx].weight = Math.max(minWeight, currentWeight + delta);
    setWorkout(newWorkout);
  };

  const handleUpdateReps = (exIdx: number, setIdx: number, delta: number) => {
    const newWorkout = { ...workout };
    const currentReps = newWorkout.exercises[exIdx].sets[setIdx].reps;
    newWorkout.exercises[exIdx].sets[setIdx].reps = Math.max(0, currentReps + delta);
    setWorkout(newWorkout);
  };

  const handleSetWeightDirect = (exIdx: number, setIdx: number, value: number) => {
    const newWorkout = { ...workout };
    const isAssisted = newWorkout.exercises[exIdx].sets[setIdx].isAssisted;
    // Allow negative weights only for assisted exercises
    const minWeight = isAssisted ? -200 : 0;
    newWorkout.exercises[exIdx].sets[setIdx].weight = Math.max(minWeight, value);
    setWorkout(newWorkout);
    // Check for auto-complete after state update
    checkAndAutoComplete(exIdx, setIdx, newWorkout);
  };

  const handleSetRepsDirect = (exIdx: number, setIdx: number, value: number) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exIdx].sets[setIdx].reps = Math.max(0, value);
    setWorkout(newWorkout);
    // Check for auto-complete after state update
    checkAndAutoComplete(exIdx, setIdx, newWorkout);
  };

  const handleUpdateRir = (exIdx: number, setIdx: number, value: number) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exIdx].sets[setIdx].rir = Math.max(0, Math.min(10, value));
    setWorkout(newWorkout);
    // Check for auto-complete after state update
    checkAndAutoComplete(exIdx, setIdx, newWorkout);
  };

  // Check if a set should be auto-completed (weight > 0, reps > 0, and rir is set)
  const checkAndAutoComplete = (exIdx: number, setIdx: number, workoutData: typeof workout) => {
    const set = workoutData.exercises[exIdx].sets[setIdx];
    // Auto-mark as completed if weight != 0 (can be negative for assisted), reps > 0, and RIR is defined
    const hasWeight = set.isAssisted ? set.weight !== 0 : set.weight > 0;
    if (hasWeight && set.reps > 0 && set.rir !== undefined && !set.completed) {
      const updatedWorkout = { ...workoutData };
      updatedWorkout.exercises[exIdx].sets[setIdx].completed = true;
      setWorkout(updatedWorkout);
      
      toast.success('Satz abgeschlossen! 💪', { duration: 1500 });
      
      // Start rest timer if enabled
      const exercise = updatedWorkout.exercises[exIdx];
      const remainingSets = exercise.sets.filter((s, i) => i > setIdx && !s.completed).length;
      if (remainingSets > 0 && workoutSettings.autoStartRestTimer) {
        startRestTimer();
      }
    }
  };

  const handleToggleWarmup = (exIdx: number, setIdx: number) => {
    const newWorkout = { ...workout };
    const isCurrentlyWarmup = newWorkout.exercises[exIdx].sets[setIdx].isWarmup;
    newWorkout.exercises[exIdx].sets[setIdx].isWarmup = !isCurrentlyWarmup;
    // If marking as warmup, reset completion status since warmups don't count
    if (!isCurrentlyWarmup) {
      // Reset completion for warmup sets - they can still be tracked but won't count for volume
    }
    setWorkout(newWorkout);
    toast.success(isCurrentlyWarmup ? 'Arbeitssatz' : 'Aufwärmsatz markiert', { duration: 1500 });
  };

  const handleToggleAssisted = (exIdx: number, setIdx: number) => {
    const newWorkout = { ...workout };
    const set = newWorkout.exercises[exIdx].sets[setIdx];
    set.isAssisted = !set.isAssisted;
    // If switching to assisted mode, invert weight sign
    if (set.isAssisted && set.weight > 0) {
      set.weight = -set.weight;
    } else if (!set.isAssisted && set.weight < 0) {
      set.weight = Math.abs(set.weight);
    }
    setWorkout(newWorkout);
    toast.success(set.isAssisted ? 'Assistiert aktiviert' : 'Assistiert deaktiviert', { duration: 1500 });
  };

  const handleToggleSet = (exIdx: number, setIdx: number) => {
    const newWorkout = { ...workout };
    const wasCompleted = newWorkout.exercises[exIdx].sets[setIdx].completed;
    newWorkout.exercises[exIdx].sets[setIdx].completed = !wasCompleted;
    setWorkout(newWorkout);

    if (!wasCompleted) {
      // Satz abgeschlossen - Timer starten
      toast.success('Satz abgeschlossen! 💪', { duration: 1500 });

      // Prüfen ob noch weitere Sätze übrig sind
      const exercise = newWorkout.exercises[exIdx];
      const remainingSets = exercise.sets.filter((s, i) => i > setIdx && !s.completed).length;

      if (remainingSets > 0 && workoutSettings.autoStartRestTimer) {
        // Rest-Timer automatisch starten
        startRestTimer();
      }
    }
  };

  const handleFinishWorkout = () => {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    
    // Auto-complete all sets that have weight and reps filled
    // Also set default RIR of 2 for sets without RIR
    const completedExercises = workout.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(set => ({
        ...set,
        // Auto-complete if weight > 0 and reps > 0
        completed: (set.weight > 0 && set.reps > 0) ? true : set.completed,
        // Default RIR to 2 if not set
        rir: set.rir ?? 2,
      }))
    }));

    const totalVolume = completedExercises.reduce((total, ex) => {
      return total + ex.sets.reduce((exTotal, set) => {
        return exTotal + (set.completed ? set.weight * set.reps : 0);
      }, 0);
    }, 0);

    const completedWorkout = {
      ...workout,
      exercises: completedExercises,
      endTime,
      duration,
      totalVolume,
    };

    addWorkoutSession(completedWorkout);
    setCurrentWorkout(null);
    
    toast.success(
      <div className="flex items-center gap-3">
        <span className="text-emerald-500">{Icons.trophy}</span>
        <div>
          <p className="font-bold">Training abgeschlossen!</p>
          <p className="text-sm opacity-80">{duration} Min • {Math.round(totalVolume).toLocaleString()} kg</p>
        </div>
      </div>,
      { duration: 4000 }
    );
  };

  const handleCancelWorkout = () => {
    if (confirm('Training wirklich abbrechen? Dein Fortschritt geht verloren.')) {
      setCurrentWorkout(null);
      toast.error('Training abgebrochen');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-32">
      {/* Fixed Header */}
      <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 glass-card border-0 border-b border-slate-200/50 mb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ProgressRing progress={progress} size={56} strokeWidth={5} />
              <div>
                <h1 className="text-xl font-bold text-slate-800">{workout.trainingDayName}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    {Icons.clock}
                    {formatTime(elapsedTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    {Icons.fire}
                    {Math.round(currentVolume).toLocaleString()} kg
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCancelWorkout}
              className="btn-icon text-red-400 hover:text-red-500 hover:bg-red-50"
            >
              {Icons.x}
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Navigation Pills */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {workout.exercises.map((exercise, idx) => {
            const isComplete = exercise.sets.every(s => s.completed);
            const isActive = idx === activeExerciseIndex;
            
            return (
              <button
                key={idx}
                onClick={() => setActiveExerciseIndex(idx)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : isComplete
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isComplete && !isActive && (
                    <span className="text-emerald-500">{Icons.check}</span>
                  )}
                  Übung {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercises */}
      <div className="max-w-4xl mx-auto space-y-4">
        {workout.exercises.map((exercise, exIdx) => {
          const exerciseData = findExercise(exercise.exerciseId, customExercises);
          const isActive = exIdx === activeExerciseIndex;
          const completedSets = exercise.sets.filter(s => s.completed).length;
          const totalSets = exercise.sets.length;
          const isComplete = completedSets === totalSets;
          const recommendation = exerciseRecommendations.get(exercise.exerciseId);

          return (
            <div 
              key={exIdx} 
              className={`exercise-card transition-all duration-300 ${
                isActive ? 'ring-2 ring-primary-500/30' : 'opacity-75 hover:opacity-100'
              }`}
              onClick={() => setActiveExerciseIndex(exIdx)}
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isComplete 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-primary-50 text-primary-600'
                  }`}>
                    {isComplete ? Icons.check : exIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {exerciseData?.name || exercise.exerciseId}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {exerciseData?.muscleGroups.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-600">
                    {completedSets}/{totalSets}
                  </p>
                  <p className="text-xs text-slate-400">Sätze</p>
                </div>
              </div>

              {/* Empfehlung Box - nur wenn Empfehlung vorhanden */}
              {recommendation && isActive && (
                <div className={`mb-4 p-3 rounded-xl border ${
                  recommendation.recommendation === 'increase' 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : recommendation.recommendation === 'decrease'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${
                        recommendation.recommendation === 'increase' ? 'text-emerald-600' 
                        : recommendation.recommendation === 'decrease' ? 'text-orange-600'
                        : 'text-blue-600'
                      }`}>
                        {recommendation.recommendation === 'increase' ? '📈' : recommendation.recommendation === 'decrease' ? '📉' : '➡️'}
                      </span>
                      <div>
                        <p className="text-xs text-slate-500">Ziel heute</p>
                        <p className="font-bold text-slate-800">
                          {recommendation.recommendedWeight}kg × {recommendation.recommendedReps} @ RIR {recommendation.targetRIR}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Letztes Mal</p>
                      <p className="text-sm text-slate-600">{recommendation.lastWeight}kg × {recommendation.lastReps}</p>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${
                    recommendation.recommendation === 'increase' ? 'text-emerald-700' 
                    : recommendation.recommendation === 'decrease' ? 'text-orange-700'
                    : 'text-blue-700'
                  }`}>
                    💡 {recommendation.reason}
                  </p>
                </div>
              )}

              {/* Sets */}
              <div className="space-y-2">
                {exercise.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className={`set-card ${set.completed ? 'set-card-completed' : ''} ${set.isWarmup ? 'opacity-75 border-orange-200' : ''}`}
                  >
                    {/* Set Number with Warmup/Assisted Indicators */}
                    <div className="flex items-center gap-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        set.isWarmup 
                          ? 'bg-orange-400 text-white'
                          : set.completed 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-200 text-slate-500'
                      }`}>
                        {set.isWarmup ? 'W' : setIdx + 1}
                      </div>
                      {/* Warmup Toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleWarmup(exIdx, setIdx); }}
                        className={`p-1 rounded-md transition-all ${
                          set.isWarmup 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'hover:bg-slate-100 text-slate-400'
                        }`}
                        title="Aufwärmsatz"
                      >
                        {Icons.warmup}
                      </button>
                      {/* Assisted Toggle - only for supported exercises */}
                      {isAssistedExercise(exercise.exerciseId) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleAssisted(exIdx, setIdx); }}
                          className={`p-1 rounded-md transition-all ${
                            set.isAssisted 
                              ? 'bg-purple-100 text-purple-600' 
                              : 'hover:bg-slate-100 text-slate-400'
                          }`}
                          title="Assistiert (z.B. mit Gummiband)"
                        >
                          {Icons.assisted}
                        </button>
                      )}
                    </div>

                    {/* Weight Control */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateWeight(exIdx, setIdx, -2.5); }}
                        className="btn-icon !p-1.5 bg-white border border-slate-200"
                      >
                        {Icons.minus}
                      </button>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleSetWeightDirect(exIdx, setIdx, parseFloat(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-16 px-2 py-1.5 border rounded-lg text-center font-semibold outline-none transition-all ${
                          set.isAssisted && set.weight < 0
                            ? 'bg-purple-50 border-purple-300 text-purple-800 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20'
                            : set.completed 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20' 
                              : 'bg-white border-slate-200 text-slate-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                        }`}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateWeight(exIdx, setIdx, 2.5); }}
                        className="btn-icon !p-1.5 bg-white border border-slate-200"
                      >
                        {Icons.plus}
                      </button>
                      <span className="text-xs text-slate-400 w-6">{set.isAssisted && set.weight < 0 ? '-kg' : 'kg'}</span>
                    </div>

                    <span className="text-slate-300">×</span>

                    {/* Reps Control */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateReps(exIdx, setIdx, -1); }}
                        className="btn-icon !p-1.5 bg-white border border-slate-200"
                      >
                        {Icons.minus}
                      </button>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleSetRepsDirect(exIdx, setIdx, parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-14 px-2 py-1.5 border rounded-lg text-center font-semibold outline-none transition-all ${
                          set.completed 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20' 
                            : 'bg-white border-slate-200 text-slate-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                        }`}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateReps(exIdx, setIdx, 1); }}
                        className="btn-icon !p-1.5 bg-white border border-slate-200"
                      >
                        {Icons.plus}
                      </button>
                    </div>

                    {/* RIR Control */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 w-8">RIR</span>
                      <select
                        value={set.rir ?? 2}
                        onChange={(e) => { e.stopPropagation(); handleUpdateRir(exIdx, setIdx, parseInt(e.target.value)); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-14 px-2 py-1.5 border rounded-lg text-center font-semibold outline-none transition-all cursor-pointer ${
                          set.completed 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        {[0, 1, 2, 3, 4, 5].map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>

                    {/* Complete Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleSet(exIdx, setIdx); }}
                      className={`ml-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        set.completed
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
                      }`}
                    >
                      {set.completed ? (
                        <span className="flex items-center gap-1.5">{Icons.check} Fertig</span>
                      ) : (
                        'Fertig'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-64 right-0 p-4 glass-card border-0 border-t border-slate-200/50 z-30">
        <div className="max-w-4xl mx-auto">
          {/* Check if any sets have weight and reps filled */}
          {(() => {
            const hasFilledSets = workout.exercises.some(ex => 
              ex.sets.some(set => set.weight > 0 && set.reps > 0)
            );
            const filledSetsCount = workout.exercises.reduce((total, ex) => 
              total + ex.sets.filter(set => set.weight > 0 && set.reps > 0).length, 0
            );
            const totalSetsCount = workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
            const filledProgress = totalSetsCount > 0 ? Math.round((filledSetsCount / totalSetsCount) * 100) : 0;
            
            return (
              <button
                onClick={handleFinishWorkout}
                disabled={!hasFilledSets}
                className={`w-full py-4 rounded-2xl text-lg font-bold transition-all duration-300 ${
                  filledProgress === 100
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:scale-[1.01]'
                    : hasFilledSets
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {filledProgress === 100 ? (
                  <span className="flex items-center justify-center gap-2">
                    {Icons.trophy}
                    Training abschließen
                  </span>
                ) : hasFilledSets ? (
                  `Training beenden (${filledSetsCount}/${totalSetsCount} Sätze)`
                ) : (
                  'Fülle Gewicht & Reps für mindestens einen Satz'
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Rest Timer - Floating Component */}
      <RestTimer />

      {/* Plate Calculator - Floating Button */}
      <button
        onClick={() => {
          // Get current active exercise weight
          const activeExercise = workout?.exercises[activeExerciseIndex];
          if (activeExercise && activeExercise.sets.length > 0) {
            const lastSet = activeExercise.sets[activeExercise.sets.length - 1];
            setPlateCalculatorWeight(lastSet.weight > 0 ? lastSet.weight : 100);
          }
          setShowPlateCalculator(true);
        }}
        className="fixed bottom-36 sm:bottom-40 right-4 sm:right-6 z-40 p-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95"
        title="Scheiben-Rechner"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
        </svg>
      </button>

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={showPlateCalculator}
        onClose={() => setShowPlateCalculator(false)}
        targetWeight={plateCalculatorWeight}
      />
    </div>
  );
}
