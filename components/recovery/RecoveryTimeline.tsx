'use client';

import { useState } from 'react';
import { Clock, CheckCircle, AlertCircle, X, Dumbbell, Calendar, Users } from 'lucide-react';
import { MuscleGroup, WorkoutSession } from '@/types';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { exerciseDatabase, getMuscleInvolvement } from '@/data/exerciseDatabase';

interface RecoveryTimelineProps {
  muscleRecovery: Record<string, number>;
  recoveryTimes?: Record<MuscleGroup, number>;
  lastTrainedDay?: Record<MuscleGroup, string | null>;
  lastTrainedRole?: Record<MuscleGroup, 'primary' | 'secondary' | null>;
  workoutSessions?: WorkoutSession[];
}

const muscleTranslations: Record<string, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  forearms: 'Unterarme',
  abs: 'Bauch',
  quadriceps: 'Quadrizeps',
  hamstrings: 'Beinbeuger',
  calves: 'Waden',
  glutes: 'Gesäß',
  traps: 'Trapez',
  lats: 'Latissimus',
  adductors: 'Adduktoren',
  abductors: 'Abduktoren',
  lower_back: 'Unterer Rücken',
  neck: 'Nacken',
};

// Default recovery times in hours (based on muscle size and training intensity)
// Small muscles: 24-48h, Medium muscles: 48-72h, Large muscles: 72-96h
const DEFAULT_RECOVERY_TIMES: Record<MuscleGroup, number> = {
  chest: 72,      // Large muscle, needs more recovery
  back: 72,       // Large muscle group
  shoulders: 48,  // Medium muscle
  biceps: 48,     // Small muscle but often overtrained
  triceps: 48,    // Small muscle
  forearms: 24,   // Small, recovers fast
  abs: 24,        // Recovers quickly
  quadriceps: 96, // Largest muscle, needs most recovery
  hamstrings: 72, // Large muscle
  calves: 48,     // Dense muscle, moderate recovery
  glutes: 72,     // Large muscle
  traps: 48,      // Medium muscle
  lats: 72,       // Large muscle
  adductors: 48,  // Medium muscle
  abductors: 48,  // Medium muscle
  lower_back: 72, // Often stressed, needs recovery
  neck: 24,       // Small muscle, recovers fast
};

interface MuscleExerciseInfo {
  exerciseName: string;
  date: Date;
  sets: number;
  totalVolume: number;
}

export function RecoveryTimeline({ 
  muscleRecovery, 
  recoveryTimes = DEFAULT_RECOVERY_TIMES, 
  lastTrainedDay,
  lastTrainedRole,
  workoutSessions = []
}: RecoveryTimelineProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Sort muscles by recovery percentage
  const sortedMuscles = Object.entries(muscleRecovery).sort(
    ([, a], [, b]) => a - b
  );

  const getStatusColor = (recovery: number) => {
    if (recovery >= 80) return 'bg-emerald-500';
    if (recovery >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getColor = (recovery: number) => {
    if (recovery >= 80) return '#10b981'; // green
    if (recovery >= 50) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  // Get exercises that trained this muscle (only with weight > 0)
  const getMuscleExercises = (muscle: string): MuscleExerciseInfo[] => {
    const exercises: MuscleExerciseInfo[] = [];
    const muscleKey = muscle as MuscleGroup;
    
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (exerciseData && exerciseData.muscleGroups.includes(muscleKey)) {
          // Only count sets with weight > 0
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
    
    // Sort by date descending and take last 5
    return exercises
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  // Get time since last training for this muscle
  const getTimeSinceTraining = (muscle: string): string => {
    const muscleKey = muscle as MuscleGroup;
    let lastTrainedTime: Date | null = null;
    
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (exerciseData && exerciseData.muscleGroups.includes(muscleKey)) {
          // Only consider if there were valid sets with weight > 0
          const hasValidSets = ex.sets.some(s => s.completed && s.weight > 0);
          if (hasValidSets) {
            const sessionTime = new Date(session.endTime || session.startTime);
            if (!lastTrainedTime || sessionTime > lastTrainedTime) {
              lastTrainedTime = sessionTime;
            }
          }
        }
      });
    });
    
    if (!lastTrainedTime) return 'Noch nie trainiert';
    
    const now = new Date();
    const hours = differenceInHours(now, lastTrainedTime);
    const minutes = differenceInMinutes(now, lastTrainedTime);
    
    if (hours < 1) {
      return `vor ${minutes} Min`;
    } else if (hours < 24) {
      return `vor ${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    }
  };

  const muscleInfo = selectedMuscle ? (() => {
    const recovery = muscleRecovery[selectedMuscle] || 0;
    const muscleKey = selectedMuscle as MuscleGroup;
    const totalRecoveryTime = recoveryTimes[muscleKey] || 48;
    const hoursRemaining = Math.max(0, Math.ceil(((100 - recovery) / 100) * totalRecoveryTime));
    const trainedDay = lastTrainedDay?.[muscleKey];
    const role = lastTrainedRole?.[muscleKey];
    const isSecondary = role === 'secondary';
    
    return {
      name: muscleTranslations[selectedMuscle] || selectedMuscle,
      recovery,
      hoursRemaining,
      trainedDay,
      role,
      isSecondary,
      color: getColor(recovery),
      status: recovery >= 80 ? 'Bereit' : recovery >= 50 ? 'Regeneriert' : 'Müde',
    };
  })() : null;

  const muscleExercises = selectedMuscle ? getMuscleExercises(selectedMuscle) : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="space-y-4">
        {sortedMuscles.map(([muscle, recovery]) => {
          const muscleKey = muscle as MuscleGroup;
          const totalRecoveryTime = recoveryTimes[muscleKey] || 48;
          const hoursRemaining = Math.max(0, Math.ceil(((100 - recovery) / 100) * totalRecoveryTime));
          const trainedDay = lastTrainedDay?.[muscleKey];
          const isReady = recovery >= 80;
          const isRecovering = recovery >= 50 && recovery < 80;
          const isSecondaryMuscle = lastTrainedRole?.[muscleKey] === 'secondary';

          return (
            <div
              key={muscle}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setClickPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
                setSelectedMuscle(muscle);
              }}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isReady
                    ? 'bg-green-100'
                    : isRecovering
                    ? 'bg-orange-100'
                    : 'bg-red-100'
                }`}
              >
                {isReady ? (
                  <CheckCircle
                    className={`w-5 h-5 ${
                      isReady
                        ? 'text-green-600'
                        : isRecovering
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                  />
                ) : (
                  <Clock
                    className={`w-5 h-5 ${
                      isReady
                        ? 'text-green-600'
                        : isRecovering
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                  />
                )}
              </div>

              {/* Muscle Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {muscleTranslations[muscle] || muscle}
                    </h4>
                    {isSecondaryMuscle && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium" title="Hilfsmuskel">
                        <Users className="w-3 h-3" />
                        Hilfs
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {recovery}%
                    </span>
                    {!isReady && hoursRemaining > 0 && (
                      <p className="text-xs text-gray-500">
                        noch {hoursRemaining}h
                      </p>
                    )}
                    {trainedDay && (
                      <p className="text-xs text-gray-400">
                        {trainedDay}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isReady
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : isRecovering
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      ref={(el) => { if (el) el.style.width = `${recovery}%`; }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isReady
                    ? 'bg-green-100 text-green-700'
                    : isRecovering
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isReady ? 'Bereit' : isRecovering ? 'Regeneriert' : 'Müde'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Regenerations-Hinweis
            </p>
            <p className="text-sm text-blue-700">
              Klicke auf einen Muskel, um Details zu sehen. Nur Sätze mit Gewicht werden berücksichtigt.
            </p>
          </div>
        </div>
      </div>

      {/* Muscle Detail Modal */}
      {selectedMuscle && muscleInfo && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header - same as MuscleMap */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(muscleInfo.recovery)}`} />
                <h2 className="text-xl font-bold text-gray-900">{muscleInfo.name}</h2>
                {muscleInfo.isSecondary && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Hilfsmuskel
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedMuscle(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Schließen"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Role Info Banner - same as MuscleMap */}
              {muscleInfo.isSecondary && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Users className="w-5 h-5 text-slate-500" />
                  <p className="text-sm text-slate-600">
                    Dieser Muskel wurde zuletzt als <strong>Hilfsmuskel</strong> trainiert und regeneriert schneller.
                  </p>
                </div>
              )}

              {/* Recovery Status - same as MuscleMap */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Regeneration</span>
                  <span className="text-2xl font-bold text-gray-900">{muscleInfo.recovery}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    ref={(el) => { if (el) { el.style.width = `${muscleInfo.recovery}%`; el.style.backgroundColor = muscleInfo.color; }}}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(muscleInfo.recovery)}`}>
                    {muscleInfo.status}
                  </span>
                  {muscleInfo.hoursRemaining > 0 && (
                    <span className="text-sm text-gray-500">
                      Noch {muscleInfo.hoursRemaining}h bis 100%
                    </span>
                  )}
                </div>
              </div>

              {/* Time Since Training */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Zeit seit Training</p>
                  <p className="font-semibold text-gray-900">{getTimeSinceTraining(selectedMuscle)}</p>
                </div>
              </div>

              {/* Recent Exercises */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Letzte Übungen</h3>
                </div>
                
                {muscleExercises.length > 0 ? (
                  <div className="space-y-3">
                    {muscleExercises.map((exercise, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{exercise.exerciseName}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span>{exercise.sets} Sätze</span>
                              <span>•</span>
                              <span>{exercise.totalVolume.toLocaleString()} kg</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {format(exercise.date, 'dd.MM', { locale: de })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">Noch keine Übungen für diesen Muskel</p>
                  </div>
                )}
              </div>

              {/* Recovery Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Regenerationszeit</h4>
                <p className="text-sm text-gray-600">
                  Dieser Muskel benötigt typischerweise <span className="font-semibold">{recoveryTimes[selectedMuscle as MuscleGroup] || 48} Stunden</span> für vollständige Regeneration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
