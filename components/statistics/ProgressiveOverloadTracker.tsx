'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { format, subWeeks, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, CheckCircle, ChevronRight } from 'lucide-react';

interface ExerciseProgressStatus {
  exerciseId: string;
  exerciseName: string;
  status: 'progressing' | 'stagnant' | 'regressing' | 'new';
  currentMax: number;
  previousMax: number;
  percentChange: number;
  weeksSinceProgress: number;
  lastTrainedDate: Date | null;
  volumeTrend: number; // percentage change in volume
  suggestion?: string;
}

export function ProgressiveOverloadTracker() {
  const { workoutSessions } = useWorkoutStore();

  const progressData = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = subWeeks(now, 2);
    const fourWeeksAgo = subWeeks(now, 4);
    const eightWeeksAgo = subWeeks(now, 8);

    // Group sessions by exercise
    const exerciseHistory: Record<string, {
      sessions: Array<{
        date: Date;
        maxWeight: number;
        totalVolume: number;
        bestSet: { weight: number; reps: number };
      }>;
    }> = {};

    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      
      session.exercises.forEach(ex => {
        if (!exerciseHistory[ex.exerciseId]) {
          exerciseHistory[ex.exerciseId] = { sessions: [] };
        }

        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0);
        if (completedSets.length === 0) return;

        const maxWeight = Math.max(...completedSets.map(s => s.weight));
        const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        const bestSet = completedSets.reduce((best, s) => 
          (s.weight * s.reps) > (best.weight * best.reps) ? s : best
        , { weight: 0, reps: 0 });

        exerciseHistory[ex.exerciseId].sessions.push({
          date: sessionDate,
          maxWeight,
          totalVolume,
          bestSet: { weight: bestSet.weight, reps: bestSet.reps },
        });
      });
    });

    // Analyze each exercise
    const progressStatuses: ExerciseProgressStatus[] = [];

    Object.entries(exerciseHistory).forEach(([exerciseId, data]) => {
      const exerciseInfo = exerciseDatabase.find(e => e.id === exerciseId);
      if (!exerciseInfo) return;

      // Sort sessions by date
      const sortedSessions = [...data.sessions].sort((a, b) => b.date.getTime() - a.date.getTime());
      
      if (sortedSessions.length === 0) return;

      // Get recent sessions (last 2 weeks)
      const recentSessions = sortedSessions.filter(s => isAfter(s.date, twoWeeksAgo));
      
      // Get previous period (2-4 weeks ago)
      const previousSessions = sortedSessions.filter(s => 
        isAfter(s.date, fourWeeksAgo) && !isAfter(s.date, twoWeeksAgo)
      );

      // Get older sessions for trend analysis (4-8 weeks ago)
      const olderSessions = sortedSessions.filter(s =>
        isAfter(s.date, eightWeeksAgo) && !isAfter(s.date, fourWeeksAgo)
      );

      const currentMax = recentSessions.length > 0 
        ? Math.max(...recentSessions.map(s => s.maxWeight))
        : sortedSessions[0]?.maxWeight || 0;

      const previousMax = previousSessions.length > 0
        ? Math.max(...previousSessions.map(s => s.maxWeight))
        : olderSessions.length > 0 
          ? Math.max(...olderSessions.map(s => s.maxWeight))
          : currentMax;

      // Calculate volume trend
      const recentVolume = recentSessions.reduce((sum, s) => sum + s.totalVolume, 0) / Math.max(recentSessions.length, 1);
      const previousVolume = previousSessions.reduce((sum, s) => sum + s.totalVolume, 0) / Math.max(previousSessions.length, 1);
      const volumeTrend = previousVolume > 0 
        ? Math.round(((recentVolume - previousVolume) / previousVolume) * 100)
        : 0;

      const percentChange = previousMax > 0 
        ? Math.round(((currentMax - previousMax) / previousMax) * 100)
        : 0;

      // Find weeks since last progress (weight increase)
      let weeksSinceProgress = 0;
      let lastProgressWeight = currentMax;
      for (let i = 1; i < sortedSessions.length && weeksSinceProgress < 12; i++) {
        if (sortedSessions[i].maxWeight < lastProgressWeight) {
          break;
        }
        lastProgressWeight = sortedSessions[i].maxWeight;
        weeksSinceProgress++;
      }
      weeksSinceProgress = Math.floor(weeksSinceProgress / 2); // Approximate weeks

      // Determine status
      let status: ExerciseProgressStatus['status'];
      let suggestion: string | undefined;

      if (sortedSessions.length < 3) {
        status = 'new';
        suggestion = 'Noch zu wenig Daten für eine Analyse';
      } else if (percentChange > 2) {
        status = 'progressing';
        suggestion = 'Weiter so! Gute Progression 💪';
      } else if (percentChange < -5) {
        status = 'regressing';
        suggestion = 'Überprüfe Schlaf, Ernährung und Recovery. Eventuell Deload einplanen.';
      } else if (weeksSinceProgress >= 3) {
        status = 'stagnant';
        if (volumeTrend < -10) {
          suggestion = 'Versuche das Volumen zu erhöhen (mehr Sätze)';
        } else if (volumeTrend > 10) {
          suggestion = 'Volumen ist hoch, versuche Gewicht zu steigern statt mehr Sätze';
        } else {
          suggestion = 'Probiere eine Variation der Übung oder ändere Rep-Range';
        }
      } else {
        status = 'progressing';
      }

      progressStatuses.push({
        exerciseId,
        exerciseName: exerciseInfo.name,
        status,
        currentMax,
        previousMax,
        percentChange,
        weeksSinceProgress,
        lastTrainedDate: sortedSessions[0]?.date || null,
        volumeTrend,
        suggestion,
      });
    });

    // Sort: stagnant/regressing first, then by weeks since progress
    return progressStatuses.sort((a, b) => {
      const statusOrder = { regressing: 0, stagnant: 1, new: 2, progressing: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.weeksSinceProgress - a.weeksSinceProgress;
    });
  }, [workoutSessions]);

  const statusCounts = useMemo(() => {
    return {
      progressing: progressData.filter(p => p.status === 'progressing').length,
      stagnant: progressData.filter(p => p.status === 'stagnant').length,
      regressing: progressData.filter(p => p.status === 'regressing').length,
      new: progressData.filter(p => p.status === 'new').length,
    };
  }, [progressData]);

  const getStatusIcon = (status: ExerciseProgressStatus['status']) => {
    switch (status) {
      case 'progressing':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'stagnant':
        return <Minus className="w-5 h-5 text-amber-500" />;
      case 'regressing':
        return <TrendingDown className="w-5 h-5 text-rose-500" />;
      case 'new':
        return <CheckCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: ExerciseProgressStatus['status']) => {
    switch (status) {
      case 'progressing':
        return 'bg-emerald-50 border-emerald-200';
      case 'stagnant':
        return 'bg-amber-50 border-amber-200';
      case 'regressing':
        return 'bg-rose-50 border-rose-200';
      case 'new':
        return 'bg-slate-50 border-slate-200';
    }
  };

  if (progressData.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Noch keine Übungsdaten vorhanden</p>
        <p className="text-sm text-slate-400">Absolviere einige Trainings für die Progressions-Analyse</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 bg-emerald-50 rounded-xl">
          <p className="text-2xl font-bold text-emerald-600">{statusCounts.progressing}</p>
          <p className="text-xs text-emerald-700">Progression</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl">
          <p className="text-2xl font-bold text-amber-600">{statusCounts.stagnant}</p>
          <p className="text-xs text-amber-700">Stagniert</p>
        </div>
        <div className="text-center p-3 bg-rose-50 rounded-xl">
          <p className="text-2xl font-bold text-rose-600">{statusCounts.regressing}</p>
          <p className="text-xs text-rose-700">Rückgang</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <p className="text-2xl font-bold text-slate-600">{statusCounts.new}</p>
          <p className="text-xs text-slate-600">Neu</p>
        </div>
      </div>

      {/* Alerts for stagnant/regressing exercises */}
      {(statusCounts.stagnant > 0 || statusCounts.regressing > 0) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Achtung: Mögliche Stagnation</p>
              <p className="text-sm text-amber-700 mt-1">
                {statusCounts.stagnant > 0 && `${statusCounts.stagnant} Übung(en) stagnieren. `}
                {statusCounts.regressing > 0 && `${statusCounts.regressing} Übung(en) zeigen Rückgang.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {progressData.map((exercise) => (
          <div 
            key={exercise.exerciseId}
            className={`p-4 rounded-xl border ${getStatusColor(exercise.status)} transition-all hover:shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(exercise.status)}
                <div>
                  <p className="font-semibold text-slate-800">{exercise.exerciseName}</p>
                  <p className="text-sm text-slate-500">
                    Max: {exercise.currentMax}kg
                    {exercise.percentChange !== 0 && (
                      <span className={`ml-2 ${exercise.percentChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ({exercise.percentChange > 0 ? '+' : ''}{exercise.percentChange}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {exercise.lastTrainedDate && (
                  <p className="text-xs text-slate-400">
                    {format(exercise.lastTrainedDate, 'dd.MM', { locale: de })}
                  </p>
                )}
                {exercise.volumeTrend !== 0 && (
                  <p className={`text-xs ${exercise.volumeTrend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Vol: {exercise.volumeTrend > 0 ? '+' : ''}{exercise.volumeTrend}%
                  </p>
                )}
              </div>
            </div>
            {exercise.suggestion && (exercise.status === 'stagnant' || exercise.status === 'regressing') && (
              <div className="mt-3 pt-3 border-t border-slate-200/50">
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  {exercise.suggestion}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
