'use client';

import { useMemo } from 'react';
import { TrainingDay } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Modal } from '@/components/ui/Modal';
import { Dumbbell, Target, Repeat, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Helper to find exercise in both database and custom exercises
const findExercise = (exerciseId: string, customExercises: any[]) => {
  return exerciseDatabase.find(ex => ex.id === exerciseId) || 
         customExercises.find(ex => ex.id === exerciseId);
};

interface TrainingDayDetailModalProps {
  isOpen: boolean;
  trainingDay: TrainingDay | null;
  onClose: () => void;
  onStart?: (day: TrainingDay) => void;
}

interface ExerciseRecommendation {
  recommendedWeight: number;
  recommendedReps: number;
  lastWeight: number;
  lastReps: number;
  recommendation: 'increase' | 'maintain' | 'decrease';
  reason: string;
}

export function TrainingDayDetailModal({ isOpen, trainingDay, onClose, onStart }: TrainingDayDetailModalProps) {
  const { workoutSessions, customExercises } = useWorkoutStore();

  // Berechne Empfehlungen für jede Übung
  const exerciseRecommendations = useMemo(() => {
    const recommendations: Map<string, ExerciseRecommendation> = new Map();
    
    if (!trainingDay) return recommendations;

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentSessions = workoutSessions
      .filter(s => new Date(s.startTime) >= fourWeeksAgo)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    trainingDay.exercises.forEach(ex => {
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

      if (exerciseHistory.length === 0) return;

      const lastSession = exerciseHistory[0];
      const lastRIR = lastSession.rir ?? 2;

      let recommendedWeight = lastSession.weight;
      const recommendedReps = lastSession.reps;
      let recommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';
      let reason = '';

      if (lastRIR >= 3) {
        recommendation = 'increase';
        recommendedWeight = Math.round((lastSession.weight * 1.025) / 2.5) * 2.5;
        if (recommendedWeight === lastSession.weight) recommendedWeight += 2.5;
        reason = `RIR ${lastRIR} → Steigern`;
      } else if (lastRIR >= 1.5) {
        const avgRIR = exerciseHistory.slice(0, 3).reduce((sum, h) => sum + (h.rir ?? 2), 0) / Math.min(exerciseHistory.length, 3);
        if (avgRIR >= 2) {
          recommendation = 'increase';
          recommendedWeight = lastSession.weight + 2.5;
          reason = `Stabil → +2.5kg möglich`;
        } else {
          reason = `Gewicht halten`;
        }
      } else if (lastRIR >= 0.5) {
        reason = `Anpassung abwarten`;
      } else {
        recommendation = 'decrease';
        recommendedWeight = Math.round((lastSession.weight * 0.95) / 2.5) * 2.5;
        reason = `Zu hart → -5%`;
      }

      recommendations.set(ex.exerciseId, {
        recommendedWeight,
        recommendedReps,
        lastWeight: lastSession.weight,
        lastReps: lastSession.reps,
        recommendation,
        reason,
      });
    });

    return recommendations;
  }, [trainingDay, workoutSessions]);

  if (!trainingDay) return null;

  // Get exercise details from database or custom exercises
  const getExerciseDetails = (exerciseId: string) => {
    return findExercise(exerciseId, customExercises);
  };

  // Calculate total sets
  const totalSets = trainingDay.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  
  // Get unique muscle groups
  const uniqueMuscles = [...new Set(
    trainingDay.exercises.flatMap(ex => {
      const details = getExerciseDetails(ex.exerciseId);
      return details?.muscleGroups || [];
    })
  )];

  // Muscle name translations
  const muscleNames: Record<string, string> = {
    chest: 'Brust',
    back: 'Rücken',
    shoulders: 'Schultern',
    biceps: 'Bizeps',
    triceps: 'Trizeps',
    forearms: 'Unterarme',
    abs: 'Bauch',
    quadriceps: 'Quadrizeps',
    hamstrings: 'Beinbizeps',
    calves: 'Waden',
    glutes: 'Gesäß',
    traps: 'Trapez',
    lats: 'Latissimus',
    adductors: 'Adduktoren',
    abductors: 'Abduktoren',
    lower_back: 'Unterer Rücken',
    neck: 'Nacken',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={trainingDay.name}
      subtitle={`${trainingDay.exercises.length} Übungen • ${totalSets} Sätze`}
      icon={<Dumbbell className="w-6 h-6" />}
      iconColor="primary"
      footer={onStart ? (
        <div className="flex justify-end">
          <button
            onClick={() => onStart(trainingDay)}
            className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 transition-all"
          >
            Training starten
          </button>
        </div>
      ) : undefined}
    >
      <div className="p-6 space-y-6">
        {/* Muscle Groups Overview */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Trainierte Muskelgruppen
          </h3>
          <div className="flex flex-wrap gap-2">
            {uniqueMuscles.map(muscle => (
              <span
                key={muscle}
                className="px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium"
              >
                {muscleNames[muscle] || muscle}
              </span>
            ))}
          </div>
        </div>

        {/* Session Plan Summary */}
        {exerciseRecommendations.size > 0 && (() => {
          const recs = Array.from(exerciseRecommendations.values());
          const increases = recs.filter(r => r.recommendation === 'increase').length;
          const decreases = recs.filter(r => r.recommendation === 'decrease').length;
          const maintains = recs.filter(r => r.recommendation === 'maintain').length;
          const totalLastVol = recs.reduce((s, r) => s + r.lastWeight, 0);
          const totalNextVol = recs.reduce((s, r) => s + r.recommendedWeight, 0);
          const volDiff = totalNextVol - totalLastVol;
          return (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200">
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Heutiger Progressionsplan
              </p>
              <div className="flex items-center gap-3">
                {increases > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-200">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">{increases} steigern</span>
                  </div>
                )}
                {maintains > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-200">
                    <Minus className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">{maintains} halten</span>
                  </div>
                )}
                {decreases > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 border border-orange-200">
                    <TrendingDown className="w-3.5 h-3.5 text-orange-600" />
                    <span className="text-sm font-bold text-orange-700">{decreases} reduzieren</span>
                  </div>
                )}
                {volDiff !== 0 && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500">Gewicht ges.</p>
                    <p className={`text-sm font-bold ${volDiff > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {volDiff > 0 ? '+' : ''}{volDiff}kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Exercise List */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Übungen
          </h3>
          <div className="space-y-3">
            {trainingDay.exercises.map((ex, index) => {
              const details = getExerciseDetails(ex.exerciseId);
              const recommendation = exerciseRecommendations.get(ex.exerciseId);
              return (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-lg bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-slate-800">
                          {details?.name || ex.exerciseId}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {details?.muscleGroups.map((muscle: string) => (
                          <span
                            key={muscle}
                            className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-600 text-xs"
                          >
                            {muscleNames[muscle] || muscle}
                          </span>
                        ))}
                      </div>
                      {/* Empfehlung anzeigen */}
                      {recommendation && (
                        <div className={`mt-3 p-2.5 rounded-xl flex items-center justify-between ${
                          recommendation.recommendation === 'increase' 
                            ? 'bg-emerald-50 border border-emerald-200' 
                            : recommendation.recommendation === 'decrease'
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {recommendation.recommendation === 'increase' ? (
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                            ) : recommendation.recommendation === 'decrease' ? (
                              <TrendingDown className="w-4 h-4 text-orange-600" />
                            ) : (
                              <Minus className="w-4 h-4 text-blue-600" />
                            )}
                            <div>
                              <p className="text-xs text-slate-500">Ziel</p>
                              <p className="font-bold text-sm text-slate-800">
                                {recommendation.recommendedWeight}kg × {recommendation.recommendedReps}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Letztes Mal</p>
                            <p className="text-xs text-slate-600">{recommendation.lastWeight}kg × {recommendation.lastReps}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-lg font-bold text-primary-600">{ex.sets.length}</span>
                        <span className="text-slate-500 text-sm ml-1">Sätze</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
