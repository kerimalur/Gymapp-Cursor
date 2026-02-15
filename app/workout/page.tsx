'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { WorkoutSession, ExerciseSet } from '@/types';
import { ArrowLeft, Clock, CheckCircle, X, Plus, Minus, RefreshCw, Flame, Timer, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

function WorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingDayId = searchParams.get('id') || '';
  
  const workoutStore = useWorkoutStore();
  const { trainingDays, workoutSessions, addWorkoutSession, workoutSettings } = workoutStore;
  const { syncData, user } = useAuthStore();
  const nutritionStore = useNutritionStore();
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Rest Timer State
  const [restTimer, setRestTimer] = useState({
    isActive: false,
    seconds: 0,
    targetSeconds: 90,
  });

  // Check if exercise supports assisted mode
  const isAssistedExercise = useCallback((exerciseId: string) => {
    const assistedPatterns = ['klimmzug', 'klimmzüge', 'pull-up', 'chin-up', 'dip', 'muscle-up'];
    const exercise = exerciseDatabase.find(e => e.id === exerciseId);
    const name = exercise?.name?.toLowerCase() || '';
    return assistedPatterns.some(pattern => name.includes(pattern));
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Rest Timer countdown
  useEffect(() => {
    if (!restTimer.isActive || restTimer.seconds <= 0) return;
    
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev.seconds <= 1) {
          // Timer finished - play sound/vibrate
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          toast.success('⏱️ Pausenzeit vorbei! Nächster Satz!', { duration: 3000 });
          return { ...prev, isActive: false, seconds: 0 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.seconds]);

  // Start rest timer function
  const startRestTimer = useCallback((seconds?: number) => {
    const targetSeconds = seconds || workoutSettings?.defaultRestTime || 90;
    setRestTimer({
      isActive: true,
      seconds: targetSeconds,
      targetSeconds,
    });
    toast.success(`⏱️ ${Math.floor(targetSeconds / 60)}:${(targetSeconds % 60).toString().padStart(2, '0')} Pause`, { duration: 2000 });
  }, [workoutSettings?.defaultRestTime]);

  // Stop rest timer
  const stopRestTimer = useCallback(() => {
    setRestTimer(prev => ({ ...prev, isActive: false, seconds: 0 }));
  }, []);

  // Initialize workout
  useEffect(() => {
    if (!trainingDayId) {
      router.push('/tracker');
      return;
    }

    const trainingDay = trainingDays.find(d => d.id === trainingDayId);
    if (!trainingDay) {
      router.push('/tracker');
      return;
    }

    // Find last workout for this training day (for ghost data)
    const lastWorkout = workoutSessions
      .filter(s => s.trainingDayId === trainingDayId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

    // Create new workout with empty sets but ghost data
    const newWorkout: WorkoutSession = {
      id: `workout-${Date.now()}`,
      userId: 'local-user',
      trainingDayId: trainingDay.id,
      trainingDayName: trainingDay.name,
      exercises: trainingDay.exercises.map(ex => {
        // Find ghost data from last workout
        const lastEx = lastWorkout?.exercises.find(e => e.exerciseId === ex.exerciseId);
        
        return {
          ...ex,
          sets: ex.sets.map((set, idx) => ({
            id: `set-${Date.now()}-${idx}`,
            reps: 0,
            weight: 0,
            completed: false,
            rir: undefined,
            // Ghost data
            ghostWeight: lastEx?.sets[idx]?.weight,
            ghostReps: lastEx?.sets[idx]?.reps,
          })),
        };
      }),
      startTime: startTime,
      totalVolume: 0,
    };

    setWorkout(newWorkout);
  }, [trainingDayId, trainingDays, workoutSessions, router, startTime]);

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpdateWeight = (exIdx: number, setIdx: number, delta: number) => {
    const newWorkout = { ...workout };
    const set = newWorkout.exercises[exIdx].sets[setIdx];
    const currentWeight = set.weight;
    const minWeight = set.isAssisted ? -200 : 0;
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
    const set = newWorkout.exercises[exIdx].sets[setIdx];
    const minWeight = set.isAssisted ? -200 : 0;
    newWorkout.exercises[exIdx].sets[setIdx].weight = Math.max(minWeight, value);
    setWorkout(newWorkout);
  };

  const handleSetRepsDirect = (exIdx: number, setIdx: number, value: number) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exIdx].sets[setIdx].reps = Math.max(0, value);
    setWorkout(newWorkout);
  };

  const handleSetRIR = (exIdx: number, setIdx: number, rir: number | undefined) => {
    const newWorkout = { ...workout };
    const set = newWorkout.exercises[exIdx].sets[setIdx];
    set.rir = rir;
    
    // Auto-complete: Only when weight, reps AND RIR are all filled
    const hasWeight = set.isAssisted ? set.weight !== 0 : set.weight > 0;
    if (hasWeight && set.reps > 0 && rir !== undefined && !set.completed) {
      set.completed = true;
      toast.success('Satz abgeschlossen! 💪', { duration: 1500 });
      
      // Start rest timer if enabled and more sets remain
      const exercise = newWorkout.exercises[exIdx];
      const remainingSets = exercise.sets.filter((s, i) => i > setIdx && !s.completed).length;
      if (remainingSets > 0 && workoutSettings?.autoStartRestTimer) {
        startRestTimer();
      }
    }
    
    setWorkout(newWorkout);
  };

  // Toggle warmup set
  const handleToggleWarmup = (exIdx: number, setIdx: number) => {
    const newWorkout = { ...workout };
    const set = newWorkout.exercises[exIdx].sets[setIdx];
    set.isWarmup = !set.isWarmup;
    setWorkout(newWorkout);
    toast.success(set.isWarmup ? '🔥 Aufwärmsatz markiert' : 'Arbeitssatz', { duration: 1500 });
  };

  // Toggle assisted exercise
  const handleToggleAssisted = (exIdx: number, setIdx: number) => {
    const newWorkout = { ...workout };
    const set = newWorkout.exercises[exIdx].sets[setIdx];
    set.isAssisted = !set.isAssisted;
    // Invert weight sign when toggling
    if (set.isAssisted && set.weight > 0) {
      set.weight = -set.weight;
    } else if (!set.isAssisted && set.weight < 0) {
      set.weight = Math.abs(set.weight);
    }
    setWorkout(newWorkout);
    toast.success(set.isAssisted ? '⚡ Assistiert aktiviert' : 'Assistiert deaktiviert', { duration: 1500 });
  };

  const handleToggleSet = (exIdx: number, setIdx: number) => {
    const newWorkout = { ...workout };
    const set = newWorkout.exercises[exIdx].sets[setIdx];
    
    // Only require weight and reps to manually complete
    const hasWeight = set.isAssisted ? set.weight !== 0 : set.weight > 0;
    if (!set.completed && (!hasWeight || set.reps === 0)) {
      toast.error('Bitte Gewicht und Wiederholungen eingeben');
      return;
    }
    
    const wasCompleted = set.completed;
    set.completed = !wasCompleted;
    setWorkout(newWorkout);
    
    // Start rest timer when completing a set (not uncompleting)
    if (!wasCompleted) {
      toast.success('Satz abgeschlossen! 💪', { duration: 1500 });
      
      const exercise = newWorkout.exercises[exIdx];
      const remainingSets = exercise.sets.filter((s, i) => i > setIdx && !s.completed).length;
      if (remainingSets > 0 && workoutSettings?.autoStartRestTimer) {
        startRestTimer();
      }
    }
  };

  const handleRemoveExercise = (exIdx: number) => {
    if (confirm('Übung wirklich entfernen?')) {
      const newWorkout = { ...workout };
      newWorkout.exercises.splice(exIdx, 1);
      setWorkout(newWorkout);
      toast.success('Übung entfernt');
    }
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const newWorkout = { ...workout };
    // Mindestens 1 Satz behalten
    if (newWorkout.exercises[exIdx].sets.length <= 1) {
      toast.error('Mindestens ein Satz muss bleiben');
      return;
    }
    newWorkout.exercises[exIdx].sets.splice(setIdx, 1);
    setWorkout(newWorkout);
    toast.success('Satz entfernt');
  };

  const handleAddSet = (exIdx: number) => {
    const newWorkout = { ...workout };
    const lastSet = newWorkout.exercises[exIdx].sets[newWorkout.exercises[exIdx].sets.length - 1];
    newWorkout.exercises[exIdx].sets.push({
      id: `set-${Date.now()}`,
      reps: 0,
      weight: lastSet?.weight || 0, // Gewicht vom letzten Satz übernehmen
      completed: false,
      ghostWeight: lastSet?.ghostWeight,
      ghostReps: lastSet?.ghostReps,
    });
    setWorkout(newWorkout);
    toast.success('Satz hinzugefügt');
  };

  const handleAddExercise = (exerciseId: string) => {
    const exercise = exerciseDatabase.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newWorkout = { ...workout };
    newWorkout.exercises.push({
      exerciseId: exercise.id,
      sets: [
        { id: `set-${Date.now()}-0`, reps: 0, weight: 0, completed: false },
        { id: `set-${Date.now()}-1`, reps: 0, weight: 0, completed: false },
        { id: `set-${Date.now()}-2`, reps: 0, weight: 0, completed: false },
      ],
    });
    setWorkout(newWorkout);
    setShowExerciseSelector(false);
    toast.success(`${exercise.name} hinzugefügt`);
  };

  const handleFinishWorkout = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    
    const totalVolume = workout.exercises.reduce((total, ex) => {
      return total + ex.sets.reduce((exTotal, set) => {
        return exTotal + (set.completed ? set.weight * set.reps : 0);
      }, 0);
    }, 0);

    const completedWorkout: WorkoutSession = {
      ...workout,
      endTime,
      duration,
      totalVolume,
    };

    // Get current sessions from store directly (most up-to-date)
    const currentSessions = useWorkoutStore.getState().workoutSessions;
    const updatedSessions = [...currentSessions, completedWorkout];
    
    // Update local store first
    useWorkoutStore.getState().setWorkoutSessions(updatedSessions);
    
    // Force immediate sync to Firebase
    if (user) {
      try {
        const currentState = useWorkoutStore.getState();
        await syncData(
          {
            trainingDays: currentState.trainingDays,
            trainingPlans: currentState.trainingPlans,
            workoutSessions: updatedSessions,
          },
          {
            nutritionGoals: nutritionStore.nutritionGoals,
            meals: nutritionStore.meals,
            supplements: nutritionStore.supplements,
            mealTemplates: nutritionStore.mealTemplates,
            customFoods: nutritionStore.customFoods,
            supplementPresets: nutritionStore.supplementPresets,
            sleepEntries: nutritionStore.sleepEntries,
            trackingSettings: nutritionStore.trackingSettings,
            trackedMeals: nutritionStore.trackedMeals,
          }
        );
        console.log('Training erfolgreich in Firebase gespeichert:', completedWorkout.id);
      } catch (error) {
        console.error('Fehler beim Speichern in Firebase:', error);
        toast.error('Fehler beim Speichern in der Cloud');
      }
    }
    
    toast.success(`Training abgeschlossen! ${duration} Min • ${Math.round(totalVolume)} kg Volumen`);
    router.push('/tracker');
  };

  const handleCancelWorkout = () => {
    if (confirm('Training wirklich abbrechen?')) {
      router.push('/tracker');
    }
  };

  const completedSets = workout.exercises.reduce((total, ex) => 
    total + ex.sets.filter(s => s.completed).length, 0
  );
  const totalSets = workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleCancelWorkout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {workout.trainingDayName}
              </h1>
              <p className="text-gray-600">Training läuft...</p>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</p>
              <p className="text-sm text-gray-600">Zeit</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{completedSets}/{totalSets}</p>
              <p className="text-sm text-gray-600">Sätze</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <motion.div
                animate={{ rotate: elapsedTime % 2 === 0 ? 0 : 180 }}
                transition={{ duration: 0.5 }}
              >
                <RefreshCw className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              </motion.div>
              <p className="text-2xl font-bold text-purple-600">{workout.exercises.length}</p>
              <p className="text-sm text-gray-600">Übungen</p>
            </div>
          </div>
        </motion.div>

        {/* Exercises */}
        <AnimatePresence>
          {workout.exercises.map((ex, exIdx) => {
            const exercise = exerciseDatabase.find(e => e.id === ex.exerciseId);
            
            return (
              <motion.div
                key={`${ex.exerciseId}-${exIdx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: exIdx * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 mb-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {exercise?.name || ex.exerciseId}
                  </h3>
                  <button
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  {ex.sets.map((set, setIdx) => (
                    <motion.div
                      key={set.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: setIdx * 0.05 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        set.completed
                          ? 'bg-green-50 border-green-300'
                          : set.isWarmup
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Set Number + Warmup/Assisted Toggles */}
                        <div className="flex items-center gap-1">
                          <span className={`font-semibold w-14 px-2 py-1 rounded-lg text-center text-sm ${
                            set.isWarmup 
                              ? 'bg-orange-400 text-white' 
                              : set.completed 
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {set.isWarmup ? 'W' : `Satz ${setIdx + 1}`}
                          </span>
                          
                          {/* Warmup Toggle */}
                          <button
                            onClick={() => handleToggleWarmup(exIdx, setIdx)}
                            className={`p-1.5 rounded-lg transition-all ${
                              set.isWarmup 
                                ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300' 
                                : 'hover:bg-orange-50 text-gray-400 hover:text-orange-500'
                            }`}
                            title="Aufwärmsatz"
                          >
                            <Flame className="w-4 h-4" />
                          </button>
                          
                          {/* Assisted Toggle - only for supported exercises */}
                          {isAssistedExercise(ex.exerciseId) && (
                            <button
                              onClick={() => handleToggleAssisted(exIdx, setIdx)}
                              className={`p-1.5 rounded-lg transition-all ${
                                set.isAssisted 
                                  ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-300' 
                                  : 'hover:bg-purple-50 text-gray-400 hover:text-purple-500'
                              }`}
                              title="Assistiert (z.B. Gummiband)"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Weight */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-xs text-gray-500 block mb-1">
                            Gewicht {set.ghostWeight && <span className="text-gray-400">({set.ghostWeight}kg)</span>}
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateWeight(exIdx, setIdx, -2.5)}
                              className="p-1.5 bg-white rounded-lg hover:bg-gray-100 transition-colors border"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => handleSetWeightDirect(exIdx, setIdx, parseFloat(e.target.value) || 0)}
                              className={`w-16 px-2 py-1.5 text-center border-2 rounded-lg focus:outline-none font-semibold text-sm ${
                                set.isAssisted && set.weight < 0
                                  ? 'border-purple-300 bg-purple-50 text-purple-700 focus:border-purple-500'
                                  : set.completed
                                  ? 'border-green-300 bg-green-50 focus:border-green-500'
                                  : 'border-gray-300 focus:border-primary-500'
                              }`}
                              placeholder="0"
                            />
                            <button
                              onClick={() => handleUpdateWeight(exIdx, setIdx, 2.5)}
                              className="p-1.5 bg-white rounded-lg hover:bg-gray-100 transition-colors border"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Reps */}
                        <div className="flex-1 min-w-[100px]">
                          <label className="text-xs text-gray-500 block mb-1">
                            Wdh. {set.ghostReps && <span className="text-gray-400">({set.ghostReps}x)</span>}
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateReps(exIdx, setIdx, -1)}
                              className="p-1.5 bg-white rounded-lg hover:bg-gray-100 transition-colors border"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => handleSetRepsDirect(exIdx, setIdx, parseInt(e.target.value) || 0)}
                              className={`w-14 px-2 py-1.5 text-center border-2 rounded-lg focus:outline-none font-semibold text-sm ${
                                set.completed
                                  ? 'border-green-300 bg-green-50 focus:border-green-500'
                                  : 'border-gray-300 focus:border-primary-500'
                              }`}
                              placeholder="0"
                            />
                            <button
                              onClick={() => handleUpdateReps(exIdx, setIdx, 1)}
                              className="p-1.5 bg-white rounded-lg hover:bg-gray-100 transition-colors border"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* RIR */}
                        <div className="min-w-[80px]">
                          <label className="text-xs text-gray-500 block mb-1">RIR</label>
                          <select
                            value={set.rir !== undefined ? set.rir : ''}
                            onChange={(e) => handleSetRIR(exIdx, setIdx, e.target.value === '' ? undefined : parseInt(e.target.value))}
                            className={`w-full px-2 py-1.5 border-2 rounded-lg focus:outline-none text-sm font-semibold ${
                              set.rir !== undefined
                                ? 'border-blue-300 bg-blue-50 text-blue-700 focus:border-blue-500'
                                : 'border-gray-300 focus:border-primary-500'
                            }`}
                          >
                            <option value="">-</option>
                            {[0, 1, 2, 3, 4, 5].map(rir => (
                              <option key={rir} value={rir}>{rir}</option>
                            ))}
                          </select>
                        </div>

                        {/* Complete Button */}
                        <button
                          onClick={() => handleToggleSet(exIdx, setIdx)}
                          className={`p-2.5 rounded-lg transition-all ${
                            set.completed
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>

                        {/* Remove Set Button */}
                        <button
                          onClick={() => handleRemoveSet(exIdx, setIdx)}
                          className="p-2.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Satz entfernen"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add Set Button */}
                  <button
                    onClick={() => handleAddSet(exIdx)}
                    className="w-full mt-2 p-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-500 hover:text-blue-600 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Satz hinzufügen
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Exercise Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowExerciseSelector(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all text-gray-600 hover:text-primary-600 font-medium mb-6"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Übung hinzufügen
        </motion.button>

        {/* Finish Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <button
            onClick={handleCancelWorkout}
            className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleFinishWorkout}
            className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Training abschließen
          </button>
        </motion.div>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Übung hinzufügen</h2>
              <button
                onClick={() => setShowExerciseSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3">
              {exerciseDatabase.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleAddExercise(exercise.id)}
                  className="p-4 text-left border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <p className="font-semibold text-gray-900">{exercise.name}</p>
                  <p className="text-sm text-gray-500">{exercise.category}</p>
                </button>
              ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Rest Timer */}
      <AnimatePresence>
        {restTimer.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <div className={`p-4 rounded-2xl shadow-2xl ${
              restTimer.seconds <= 10 
                ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white' 
                : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Timer className="w-8 h-8" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: restTimer.targetSeconds, ease: "linear", repeat: 0 }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs opacity-80">Pause</p>
                  <p className="text-2xl font-bold font-mono">
                    {Math.floor(restTimer.seconds / 60)}:{(restTimer.seconds % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <button
                  onClick={stopRestTimer}
                  className="ml-2 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Quick time buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startRestTimer(60)}
                  className="flex-1 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  1:00
                </button>
                <button
                  onClick={() => startRestTimer(90)}
                  className="flex-1 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  1:30
                </button>
                <button
                  onClick={() => startRestTimer(120)}
                  className="flex-1 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  2:00
                </button>
                <button
                  onClick={() => startRestTimer(180)}
                  className="flex-1 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  3:00
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Timer Start Button (when timer not active) */}
      {!restTimer.isActive && (
        <button
          onClick={() => startRestTimer()}
          className="fixed bottom-24 right-4 z-50 p-4 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          title="Pause Timer starten"
        >
          <Timer className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <WorkoutContent />
    </Suspense>
  );
}
