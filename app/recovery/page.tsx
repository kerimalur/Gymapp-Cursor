'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { exerciseDatabase, getMuscleInvolvement, SECONDARY_MUSCLE_RECOVERY_MULTIPLIER } from '@/data/exerciseDatabase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MuscleGroup, TrainingDay } from '@/types';
import { Clock, Dumbbell, ChevronRight, X, Activity, Zap, AlertTriangle, CheckCircle2, Timer, Sparkles } from 'lucide-react';
import { format, differenceInHours, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

// Standard recovery times in hours for each muscle group
const RECOVERY_TIMES: Record<MuscleGroup, number> = {
  chest: 72, back: 72, shoulders: 48, biceps: 48, triceps: 48,
  forearms: 24, abs: 24, quadriceps: 96, hamstrings: 72,
  calves: 48, glutes: 72, traps: 48, lats: 72,
  adductors: 48, abductors: 48, lower_back: 72, neck: 24,
};

const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'quadriceps', 'hamstrings', 'calves', 'glutes', 'traps', 'lats',
  'adductors', 'abductors', 'lower_back', 'neck'
];

const muscleNames: Record<MuscleGroup, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern', biceps: 'Bizeps',
  triceps: 'Trizeps', forearms: 'Unterarme', abs: 'Bauch', quadriceps: 'Quadrizeps',
  hamstrings: 'Beinbeuger', calves: 'Waden', glutes: 'Gesäß', traps: 'Trapez', lats: 'Latissimus',
  adductors: 'Adduktoren', abductors: 'Abduktoren', lower_back: 'Unterer Rücken', neck: 'Nacken'
};

interface MuscleFatigueEntry {
  time: Date;
  role: 'primary' | 'secondary';
  sets: number;
  avgRir: number;
  exerciseName: string;
}

interface MuscleExerciseInfo {
  exerciseName: string;
  date: Date;
  sets: number;
  totalVolume: number;
}

export default function RecoveryPage() {
  const { workoutSessions, trainingDays } = useWorkoutStore();
  const { sleepEntries, trackingSettings } = useNutritionStore();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedTrainingDay, setSelectedTrainingDay] = useState<string | null>(null);
  
  const enabledMuscles = trackingSettings?.enabledMuscles || ALL_MUSCLES;

  // Calculate muscle recovery from workout data
  const muscleData = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = subDays(now, 3);
    const recentSleepData = sleepEntries.filter(e => new Date(e.date) >= threeDaysAgo);
    
    // Sleep affects recovery speed
    let sleepRecoveryMultiplier = 1.0;
    if (recentSleepData.length > 0) {
      const avgQuality = recentSleepData.reduce((sum, s) => sum + s.quality, 0) / recentSleepData.length;
      const avgHours = recentSleepData.reduce((sum, s) => sum + s.hoursSlept, 0) / recentSleepData.length;
      sleepRecoveryMultiplier = 0.7 + (avgQuality - 1) * 0.125;
      if (avgHours < 6) sleepRecoveryMultiplier *= 0.85;
      else if (avgHours < 7) sleepRecoveryMultiplier *= 0.95;
      else if (avgHours > 9) sleepRecoveryMultiplier *= 1.05;
      sleepRecoveryMultiplier = Math.max(0.6, Math.min(1.3, sleepRecoveryMultiplier));
    }
    
    const recovery: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
    const lastTrainedTime: Record<MuscleGroup, Date | null> = {} as Record<MuscleGroup, Date | null>;
    const lastExercise: Record<MuscleGroup, string | null> = {} as Record<MuscleGroup, string | null>;
    const muscleFatigue: Record<MuscleGroup, MuscleFatigueEntry[]> = {} as Record<MuscleGroup, MuscleFatigueEntry[]>;

    // Initialize
    ALL_MUSCLES.forEach(m => {
      recovery[m] = 100;
      lastTrainedTime[m] = null;
      lastExercise[m] = null;
      muscleFatigue[m] = [];
    });

    // Collect fatigue data from workouts
    workoutSessions.forEach(session => {
      const sessionTime = session.endTime ? new Date(session.endTime) : new Date(session.startTime);
      session.exercises.forEach(ex => {
        const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0);
        const avgRir = completedSets.length > 0
          ? completedSets.reduce((sum, s) => sum + (s.rir ?? 2), 0) / completedSets.length
          : 2;
        
        if (completedSets.length === 0) return;

        muscleInvolvement.forEach(({ muscle, role }) => {
          muscleFatigue[muscle].push({
            time: sessionTime, role, sets: completedSets.length, avgRir,
            exerciseName: exerciseData?.name || ex.exerciseId,
          });

          if (!lastTrainedTime[muscle] || sessionTime > lastTrainedTime[muscle]!) {
            lastTrainedTime[muscle] = sessionTime;
            lastExercise[muscle] = exerciseData?.name || null;
          }
        });
      });
    });

    // Calculate recovery percentage based on time since training
    Object.keys(muscleFatigue).forEach(muscleKey => {
      const muscle = muscleKey as MuscleGroup;
      const fatigueEntries = muscleFatigue[muscle];
      
      if (fatigueEntries.length === 0) {
        recovery[muscle] = 100;
        return;
      }

      const sortedEntries = [...fatigueEntries].sort((a, b) => b.time.getTime() - a.time.getTime());
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentEntries = sortedEntries.filter(e => e.time >= sevenDaysAgo);

      if (recentEntries.length === 0) {
        recovery[muscle] = 100;
        return;
      }

      let totalFatigue = 0;
      const baseRecoveryTime = RECOVERY_TIMES[muscle];

      recentEntries.forEach(entry => {
        const hoursSinceTraining = (now.getTime() - entry.time.getTime()) / (1000 * 60 * 60);
        const baseEffectiveTime = entry.role === 'primary' 
          ? baseRecoveryTime 
          : baseRecoveryTime * SECONDARY_MUSCLE_RECOVERY_MULTIPLIER;
        const effectiveRecoveryTime = baseEffectiveTime / sleepRecoveryMultiplier;
        const rirFactor = 1 - (entry.avgRir / 20);
        const setsFactor = Math.min(1, 0.5 + (Math.log2(entry.sets + 1) / 6));
        const fatigueContribution = Math.max(0, 1 - (hoursSinceTraining / effectiveRecoveryTime));
        const weightedFatigue = fatigueContribution * rirFactor * setsFactor;
        totalFatigue = Math.max(totalFatigue, weightedFatigue);
      });

      recovery[muscle] = Math.round(Math.max(0, Math.min(100, (1 - totalFatigue) * 100)));
    });

    return { recovery, lastTrainedTime, lastExercise };
  }, [workoutSessions, sleepEntries]);

  const { recovery, lastTrainedTime, lastExercise } = muscleData;

  // Get recent exercises for selected muscle
  const getMuscleExercises = (muscle: MuscleGroup): MuscleExerciseInfo[] => {
    const exercises: MuscleExerciseInfo[] = [];
    
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (exerciseData && exerciseData.muscleGroups.includes(muscle)) {
          const validSets = ex.sets.filter(s => s.completed && s.weight > 0);
          if (validSets.length > 0) {
            const totalVolume = validSets.reduce((sum, set) => 
              sum + (set.weight * set.reps), 0
            );
            exercises.push({
              exerciseName: exerciseData.name,
              date: new Date(session.startTime),
              sets: validSets.length,
              totalVolume,
            });
          }
        }
      });
    });
    
    return exercises.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };

  // Calculate stats
  const averageRecovery = Math.round(
    enabledMuscles.reduce((sum, m) => sum + recovery[m], 0) / enabledMuscles.length
  );
  const readyCount = enabledMuscles.filter(m => recovery[m] >= 80).length;
  const recoveringCount = enabledMuscles.filter(m => recovery[m] >= 50 && recovery[m] < 80).length;
  const tiredCount = enabledMuscles.filter(m => recovery[m] < 50).length;

  // Calculate hours remaining for a muscle
  const getHoursRemaining = (muscle: MuscleGroup) => {
    const rec = recovery[muscle];
    if (rec >= 100) return 0;
    const totalRecoveryTime = RECOVERY_TIMES[muscle];
    return Math.max(0, Math.ceil(((100 - rec) / 100) * totalRecoveryTime));
  };

  // Training day readiness - connects to tracker
  const trainingDayReadiness = useMemo(() => {
    return trainingDays.map(day => {
      const musclesInDay: { muscle: MuscleGroup; rec: number; hoursLeft: number }[] = [];
      const seenMuscles = new Set<MuscleGroup>();
      
      day.exercises.forEach(ex => {
        const exercise = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (exercise) {
          exercise.muscleGroups.forEach(m => {
            if (enabledMuscles.includes(m) && !seenMuscles.has(m)) {
              seenMuscles.add(m);
              musclesInDay.push({
                muscle: m,
                rec: recovery[m],
                hoursLeft: getHoursRemaining(m)
              });
            }
          });
        }
      });
      
      const avgRecovery = musclesInDay.length > 0
        ? Math.round(musclesInDay.reduce((sum, m) => sum + m.rec, 0) / musclesInDay.length)
        : 100;
      
      const readyMuscles = musclesInDay.filter(m => m.rec >= 80);
      const recoveringMuscles = musclesInDay.filter(m => m.rec >= 50 && m.rec < 80);
      const tiredMuscles = musclesInDay.filter(m => m.rec < 50);
      
      return {
        id: day.id,
        name: day.name,
        avgRecovery,
        muscleCount: musclesInDay.length,
        muscles: musclesInDay,
        readyMuscles,
        recoveringMuscles,
        tiredMuscles
      };
    });
  }, [trainingDays, recovery, enabledMuscles]);

  const getTimeSince = (date: Date | null): string => {
    if (!date) return 'Nie';
    const hours = differenceInHours(new Date(), date);
    if (hours < 1) return 'Gerade';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}T`;
  };

  const getStatusColor = (rec: number) => {
    if (rec >= 80) return 'bg-emerald-500';
    if (rec >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusBg = (rec: number) => {
    if (rec >= 80) return 'bg-emerald-50 border-emerald-200';
    if (rec >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Regeneration</h1>
          <p className="text-slate-500 text-sm">Basierend auf deinen Trainings aus dem Tracker</p>
        </div>

        {/* Overview Card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Big percentage ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle 
                    cx="40" cy="40" r="34" fill="none" 
                    stroke={averageRecovery >= 80 ? '#10b981' : averageRecovery >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${averageRecovery * 2.14} 214`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">{averageRecovery}%</span>
                </div>
              </div>
              
              <div>
                <p className="font-semibold text-slate-700">
                  {averageRecovery >= 80 ? 'Bereit für Training!' : 
                   averageRecovery >= 50 ? 'Teilweise erholt' : 'Ruhe empfohlen'}
                </p>
                <p className="text-sm text-slate-500">Durchschnittliche Regeneration</p>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="flex gap-2">
              <div className="text-center px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-lg font-bold text-emerald-600">{readyCount}</p>
                <p className="text-xs text-emerald-600">Bereit</p>
              </div>
              <div className="text-center px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-lg font-bold text-amber-600">{recoveringCount}</p>
                <p className="text-xs text-amber-600">Erholend</p>
              </div>
              <div className="text-center px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-lg font-bold text-red-600">{tiredCount}</p>
                <p className="text-xs text-red-600">Müde</p>
              </div>
            </div>
          </div>
        </div>

        {/* Training Days Readiness - Connected to Tracker */}
        {trainingDayReadiness.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-bold text-slate-800">Trainingstage Bereitschaft</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingDayReadiness.map(day => (
                <button 
                  key={day.id}
                  onClick={() => setSelectedTrainingDay(day.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${
                    day.avgRecovery >= 80 
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 hover:border-emerald-400' 
                      : day.avgRecovery >= 50 
                        ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-300 hover:border-amber-400' 
                        : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300 hover:border-red-400'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg">{day.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {day.muscleCount} Muskelgruppen
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                      day.avgRecovery >= 80 
                        ? 'bg-emerald-500 text-white' 
                        : day.avgRecovery >= 50 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-red-500 text-white'
                    }`}>
                      {day.avgRecovery}%
                    </div>
                  </div>
                  
                  {/* Progress Ring */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-16 h-16 -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle 
                          cx="32" cy="32" r="26" fill="none" 
                          stroke={day.avgRecovery >= 80 ? '#10b981' : day.avgRecovery >= 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${day.avgRecovery * 1.63} 163`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {day.avgRecovery >= 80 ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : day.avgRecovery >= 50 ? (
                          <Timer className="w-6 h-6 text-amber-500" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${
                        day.avgRecovery >= 80 ? 'text-emerald-700' : 
                        day.avgRecovery >= 50 ? 'text-amber-700' : 'text-red-700'
                      }`}>
                        {day.avgRecovery >= 80 ? '✓ Bereit!' : 
                         day.avgRecovery >= 50 ? '○ Fast bereit' : '✗ Ruhe empfohlen'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tippen für Details
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick muscle status */}
                  <div className="flex gap-2">
                    {day.readyMuscles.length > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-200/50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700">{day.readyMuscles.length}</span>
                      </div>
                    )}
                    {day.recoveringMuscles.length > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-200/50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-amber-700">{day.recoveringMuscles.length}</span>
                      </div>
                    )}
                    {day.tiredMuscles.length > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-200/50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs font-medium text-red-700">{day.tiredMuscles.length}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Muscles List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">Alle Muskeln</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Tippe auf einen Muskel für Details</p>
          
          <div className="space-y-2">
            {enabledMuscles.map(muscle => {
              const rec = recovery[muscle];
              const lastTime = lastTrainedTime[muscle];
              const hoursLeft = getHoursRemaining(muscle);
              
              return (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left group hover:scale-[1.01] ${
                    rec >= 80 
                      ? 'bg-gradient-to-r from-emerald-50 to-transparent hover:from-emerald-100 border border-emerald-100' 
                      : rec >= 50 
                        ? 'bg-gradient-to-r from-amber-50 to-transparent hover:from-amber-100 border border-amber-100' 
                        : 'bg-gradient-to-r from-red-50 to-transparent hover:from-red-100 border border-red-100'
                  }`}
                >
                  {/* Status indicator */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    rec >= 80 ? 'bg-emerald-500' : rec >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {rec >= 80 ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : rec >= 50 ? (
                      <Timer className="w-5 h-5 text-white" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  {/* Muscle name and last exercise */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{muscleNames[muscle]}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {lastExercise[muscle] || 'Noch nicht trainiert'} • {getTimeSince(lastTime)}
                    </p>
                  </div>
                  
                  {/* Hours remaining + Percentage */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${
                      rec >= 80 ? 'text-emerald-600' : rec >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>{rec}%</p>
                    {rec < 100 && (
                      <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {hoursLeft}h
                      </p>
                    )}
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Bereit (80%+)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
              <Timer className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Erholend (50-79%)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-xs font-medium text-red-700">Müde (&lt;50%)</span>
            </div>
          </div>
        </div>

        {/* Muscle Detail Modal */}
        {selectedMuscle && (
          <div 
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMuscle(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(recovery[selectedMuscle])}`} />
                  <h2 className="text-lg font-bold text-slate-800">{muscleNames[selectedMuscle]}</h2>
                </div>
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-60px)]">
                {/* Recovery Status */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Regeneration</span>
                    <span className="text-2xl font-bold text-slate-800">{recovery[selectedMuscle]}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getStatusColor(recovery[selectedMuscle])}`}
                      style={{ width: `${recovery[selectedMuscle]}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    {recovery[selectedMuscle] >= 80 ? '✓ Bereit für Training' : 
                     recovery[selectedMuscle] >= 50 ? '○ Teilweise erholt' : '✗ Ruhe empfohlen'}
                  </p>
                </div>
                
                {/* Recovery Explanation */}
                {recovery[selectedMuscle] < 100 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">Warum nicht bei 0%?</h4>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      Die Regeneration startet nie bei 0%, da der Körper sofort nach dem Training mit der Erholung beginnt. 
                      Der angezeigte Wert basiert auf:
                    </p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-400">•</span>
                        <span><strong>RIR (Reps in Reserve):</strong> Je mehr Wiederholungen du noch hättest machen können, desto weniger Ermüdung</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-400">•</span>
                        <span><strong>Satzanzahl:</strong> Mehr Sätze = mehr Ermüdung, aber logarithmisch (10 Sätze ≠ 10x so müde wie 1 Satz)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-400">•</span>
                        <span><strong>Zeit seit Training:</strong> Die Erholung beginnt sofort und steigt kontinuierlich</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-400">•</span>
                        <span><strong>Schlafqualität:</strong> Guter Schlaf beschleunigt die Regeneration um bis zu 30%</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-400">•</span>
                        <span><strong>Primär/Sekundär:</strong> Sekundär beanspruchte Muskeln erholen sich schneller</span>
                      </li>
                    </ul>
                    <p className="text-xs text-blue-500 mt-2 italic">
                      Beispiel: 3 Sätze Bankdrücken mit RIR 2 → Brust startet bei ca. 15-25% Ermüdung (75-85% Regeneration)
                    </p>
                  </div>
                )}
                
                {/* Time info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Zuletzt</span>
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">
                      {lastTrainedTime[selectedMuscle] 
                        ? format(lastTrainedTime[selectedMuscle]!, 'dd.MM HH:mm', { locale: de })
                        : 'Noch nie'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs font-medium">Erholungszeit</span>
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">{RECOVERY_TIMES[selectedMuscle]}h</p>
                  </div>
                </div>
                
                {/* Recent exercises from tracker */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Dumbbell className="w-4 h-4 text-slate-400" />
                    <h3 className="font-semibold text-slate-700">Letzte Übungen</h3>
                  </div>
                  
                  {getMuscleExercises(selectedMuscle).length > 0 ? (
                    <div className="space-y-2">
                      {getMuscleExercises(selectedMuscle).map((ex, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-700 text-sm truncate">{ex.exerciseName}</p>
                            <p className="text-xs text-slate-400">{ex.sets} Sätze • {ex.totalVolume.toLocaleString()} kg</p>
                          </div>
                          <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                            {format(ex.date, 'dd.MM', { locale: de })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-lg">
                      Noch keine Übungen für diesen Muskel im Tracker
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Training Day Detail Modal */}
        {selectedTrainingDay && (() => {
          const dayData = trainingDayReadiness.find(d => d.id === selectedTrainingDay);
          if (!dayData) return null;
          
          return (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedTrainingDay(null)}
            >
              <div 
                className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Header with gradient */}
                <div className={`p-6 ${
                  dayData.avgRecovery >= 80 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                    : dayData.avgRecovery >= 50 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <h2 className="text-2xl font-bold">{dayData.name}</h2>
                      <p className="text-white/80 text-sm mt-1">
                        {dayData.muscleCount} Muskelgruppen werden trainiert
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTrainingDay(null)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  
                  {/* Big recovery score */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="6" />
                        <circle 
                          cx="40" cy="40" r="34" fill="none" 
                          stroke="white"
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${dayData.avgRecovery * 2.14} 214`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{dayData.avgRecovery}%</span>
                      </div>
                    </div>
                    <div className="text-white">
                      <p className="font-semibold text-lg">
                        {dayData.avgRecovery >= 80 ? '✓ Bereit für Training!' : 
                         dayData.avgRecovery >= 50 ? '○ Fast bereit' : '✗ Ruhe empfohlen'}
                      </p>
                      <p className="text-white/70 text-sm">Durchschnittliche Regeneration</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-2xl font-bold text-emerald-600">{dayData.readyMuscles.length}</p>
                      <p className="text-xs text-emerald-600 font-medium">Bereit</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-2xl font-bold text-amber-600">{dayData.recoveringMuscles.length}</p>
                      <p className="text-xs text-amber-600 font-medium">Erholend</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-2xl font-bold text-red-600">{dayData.tiredMuscles.length}</p>
                      <p className="text-xs text-red-600 font-medium">Müde</p>
                    </div>
                  </div>
                  
                  {/* Ready Muscles */}
                  {dayData.readyMuscles.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-slate-800">Bereit für Training</h3>
                      </div>
                      <div className="space-y-2">
                        {dayData.readyMuscles.map(m => (
                          <div key={m.muscle} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium text-slate-700">{muscleNames[m.muscle]}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600">{m.rec}%</p>
                              <p className="text-xs text-emerald-500">✓ Bereit</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recovering Muscles */}
                  {dayData.recoveringMuscles.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Timer className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-slate-800">Noch in Erholung</h3>
                      </div>
                      <div className="space-y-2">
                        {dayData.recoveringMuscles.map(m => (
                          <div key={m.muscle} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                                <Timer className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium text-slate-700">{muscleNames[m.muscle]}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-amber-600">{m.rec}%</p>
                              <p className="text-xs text-amber-500 flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" />
                                noch {m.hoursLeft}h
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tired Muscles */}
                  {dayData.tiredMuscles.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-slate-800">Ruhe empfohlen</h3>
                      </div>
                      <div className="space-y-2">
                        {dayData.tiredMuscles.map(m => (
                          <div key={m.muscle} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium text-slate-700">{muscleNames[m.muscle]}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">{m.rec}%</p>
                              <p className="text-xs text-red-500 flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" />
                                noch {m.hoursLeft}h
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
