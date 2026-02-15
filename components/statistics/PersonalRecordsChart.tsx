'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { Trophy, TrendingUp, Zap, Award } from 'lucide-react';

interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  estimated1RM: number;
  date: Date;
  improvement?: number; // % improvement from first to latest
}

export function PersonalRecordsChart() {
  const { workoutSessions } = useWorkoutStore();

  const personalRecords = useMemo(() => {
    const records: Record<string, PersonalRecord> = {};
    const firstRecords: Record<string, number> = {}; // Track first 1RM for each exercise

    // Sort sessions by date
    const sortedSessions = [...workoutSessions].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    sortedSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exercise = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (!exercise) return;

        ex.sets.forEach(set => {
          if (!set.completed || set.weight === 0) return;

          // Calculate estimated 1RM (Epley formula)
          const estimated1RM = Math.round(set.weight * (1 + set.reps / 30));

          // Track first record
          if (!firstRecords[ex.exerciseId]) {
            firstRecords[ex.exerciseId] = estimated1RM;
          }

          const existingRecord = records[ex.exerciseId];

          if (!existingRecord || estimated1RM > existingRecord.estimated1RM) {
            const improvement = firstRecords[ex.exerciseId] > 0
              ? Math.round(((estimated1RM - firstRecords[ex.exerciseId]) / firstRecords[ex.exerciseId]) * 100)
              : 0;

            records[ex.exerciseId] = {
              exerciseId: ex.exerciseId,
              exerciseName: exercise.name,
              maxWeight: set.weight,
              maxReps: set.reps,
              estimated1RM,
              date: new Date(session.startTime),
              improvement,
            };
          }
        });
      });
    });

    return Object.values(records)
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .slice(0, 8);
  }, [workoutSessions]);

  // Stats summary
  const stats = useMemo(() => {
    if (personalRecords.length === 0) return null;

    const totalRecords = personalRecords.length;
    const avgImprovement = personalRecords.reduce((sum, r) => sum + (r.improvement || 0), 0) / totalRecords;
    const topExercise = personalRecords[0];
    const mostImproved = [...personalRecords].sort((a, b) => (b.improvement || 0) - (a.improvement || 0))[0];

    return {
      totalRecords,
      avgImprovement: Math.round(avgImprovement),
      topExercise,
      mostImproved,
    };
  }, [personalRecords]);

  if (workoutSessions.length === 0 || personalRecords.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">Keine Rekorde</p>
          <p className="text-sm text-gray-500">Trainiere um deine PRs zu setzen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">Stärkste Übung</span>
            </div>
            <p className="font-bold text-gray-900 truncate">{stats.topExercise?.exerciseName}</p>
            <p className="text-sm text-gray-500">{stats.topExercise?.estimated1RM} kg 1RM</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Beste Entwicklung</span>
            </div>
            <p className="font-bold text-gray-900 truncate">{stats.mostImproved?.exerciseName}</p>
            <p className="text-sm text-gray-500">+{stats.mostImproved?.improvement}% Steigerung</p>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-3">
        {personalRecords.map((record, index) => (
          <div
            key={record.exerciseId}
            className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-gray-100 hover:border-gray-200 transition-all group"
          >
            {/* Rank */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' :
              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
              index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white' :
              'bg-gray-100 text-gray-600'
            }`}>
              #{index + 1}
            </div>

            {/* Exercise Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{record.exerciseName}</p>
              <p className="text-sm text-gray-500">
                {record.maxWeight} kg × {record.maxReps} Wdh
              </p>
            </div>

            {/* 1RM */}
            <div className="text-right">
              <p className="font-bold text-primary-600">{record.estimated1RM} kg</p>
              <p className="text-xs text-gray-400">1RM</p>
            </div>

            {/* Improvement Badge */}
            {record.improvement && record.improvement > 0 && (
              <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold">
                +{record.improvement}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
