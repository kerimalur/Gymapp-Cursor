'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { getMuscleInvolvement, getPrimaryMuscles } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, format } from 'date-fns';
import { de } from 'date-fns/locale';

// Recommended sets per week per muscle group
const RECOMMENDED_VOLUME: Record<MuscleGroup, { min: number; max: number; optimal: number }> = {
  chest: { min: 10, max: 20, optimal: 14 },
  back: { min: 10, max: 20, optimal: 14 },
  shoulders: { min: 8, max: 16, optimal: 12 },
  biceps: { min: 6, max: 14, optimal: 10 },
  triceps: { min: 6, max: 14, optimal: 10 },
  forearms: { min: 4, max: 10, optimal: 6 },
  abs: { min: 6, max: 12, optimal: 8 },
  quadriceps: { min: 10, max: 20, optimal: 14 },
  hamstrings: { min: 8, max: 16, optimal: 12 },
  calves: { min: 8, max: 16, optimal: 12 },
  glutes: { min: 8, max: 16, optimal: 12 },
  traps: { min: 6, max: 12, optimal: 8 },
  lats: { min: 10, max: 18, optimal: 14 },
  adductors: { min: 4, max: 10, optimal: 6 },
  abductors: { min: 4, max: 10, optimal: 6 },
  lower_back: { min: 4, max: 10, optimal: 6 },
  neck: { min: 4, max: 8, optimal: 6 },
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
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

interface WeeklyVolumeData {
  muscle: MuscleGroup;
  label: string;
  primarySets: number;
  secondarySets: number;
  totalSets: number;
  effectiveSets: number; // Primary + 0.5 * Secondary
  recommended: { min: number; max: number; optimal: number };
  status: 'low' | 'optimal' | 'high';
  percentOfOptimal: number;
}

const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'quadriceps', 'hamstrings', 'calves', 'glutes', 'traps', 'lats',
  'adductors', 'abductors', 'lower_back', 'neck'
];

export function WeeklyVolumeTracker({ showComparison = false }: { showComparison?: boolean }) {
  const { workoutSessions } = useWorkoutStore();
  const { trackingSettings } = useNutritionStore();
  
  // Use the same muscles as the training frequency filter
  const enabledMuscles = trackingSettings?.enabledMuscles || ALL_MUSCLES;

  const volumeData = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { locale: de, weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { locale: de, weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    // Initialize volume tracking
    const thisWeekVolume: Record<MuscleGroup, { primary: number; secondary: number }> = {} as any;
    const lastWeekVolume: Record<MuscleGroup, { primary: number; secondary: number }> = {} as any;

    ALL_MUSCLES.forEach(muscle => {
      thisWeekVolume[muscle] = { primary: 0, secondary: 0 };
      lastWeekVolume[muscle] = { primary: 0, secondary: 0 };
    });

    // Process sessions
    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const isThisWeek = isWithinInterval(sessionDate, { start: thisWeekStart, end: thisWeekEnd });
      const isLastWeek = isWithinInterval(sessionDate, { start: lastWeekStart, end: lastWeekEnd });

      if (!isThisWeek && !isLastWeek) return;

      const volumeTarget = isThisWeek ? thisWeekVolume : lastWeekVolume;

      session.exercises.forEach(ex => {
        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0).length;
        if (completedSets === 0) return;

        const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
        
        muscleInvolvement.forEach(({ muscle, role }) => {
          if (role === 'primary') {
            volumeTarget[muscle].primary += completedSets;
          } else {
            volumeTarget[muscle].secondary += completedSets;
          }
        });
      });
    });

    // Calculate data for each muscle (only for enabled muscles)
    const data: WeeklyVolumeData[] = enabledMuscles.map(muscle => {
      const thisWeek = thisWeekVolume[muscle];
      const totalSets = thisWeek.primary + thisWeek.secondary;
      const effectiveSets = thisWeek.primary + (thisWeek.secondary * 0.5);
      const recommended = RECOMMENDED_VOLUME[muscle];
      const percentOfOptimal = Math.round((effectiveSets / recommended.optimal) * 100);

      let status: WeeklyVolumeData['status'];
      if (effectiveSets < recommended.min) {
        status = 'low';
      } else if (effectiveSets > recommended.max) {
        status = 'high';
      } else {
        status = 'optimal';
      }

      return {
        muscle,
        label: MUSCLE_LABELS[muscle],
        primarySets: thisWeek.primary,
        secondarySets: thisWeek.secondary,
        totalSets,
        effectiveSets: Math.round(effectiveSets * 10) / 10,
        recommended,
        status,
        percentOfOptimal,
      };
    });

    // Sort by effectiveSets descending
    return data.sort((a, b) => b.effectiveSets - a.effectiveSets);
  }, [workoutSessions, enabledMuscles]);

  const statusCounts = useMemo(() => ({
    low: volumeData.filter(d => d.status === 'low').length,
    optimal: volumeData.filter(d => d.status === 'optimal').length,
    high: volumeData.filter(d => d.status === 'high').length,
  }), [volumeData]);

  const getStatusColor = (status: WeeklyVolumeData['status']) => {
    switch (status) {
      case 'low': return 'text-amber-600 bg-amber-50';
      case 'optimal': return 'text-emerald-600 bg-emerald-50';
      case 'high': return 'text-rose-600 bg-rose-50';
    }
  };

  const getBarColor = (status: WeeklyVolumeData['status']) => {
    switch (status) {
      case 'low': return 'bg-amber-500';
      case 'optimal': return 'bg-emerald-500';
      case 'high': return 'bg-rose-500';
    }
  };

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span>Primär-Sätze</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-slate-300" />
          <span>Sekundär (×0.5)</span>
        </div>
      </div>

      {/* Volume Bars */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
        {volumeData.map((data) => (
          <div key={data.muscle}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">{data.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(data.status)}`}>
                  {data.effectiveSets} / {data.recommended.optimal}
                </span>
              </div>
            </div>
            <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
              {/* Optimal zone indicator */}
              <div 
                className="absolute top-0 h-full bg-emerald-100 opacity-50"
                style={{
                  left: `${(data.recommended.min / data.recommended.max) * 100}%`,
                  width: `${((data.recommended.optimal - data.recommended.min) / data.recommended.max) * 100}%`,
                }}
              />
              {/* Primary sets bar */}
              <div 
                className={`absolute top-0 h-full ${getBarColor(data.status)} transition-all duration-500`}
                style={{ width: `${Math.min((data.primarySets / data.recommended.max) * 100, 100)}%` }}
              />
              {/* Secondary sets bar (lighter) */}
              <div 
                className="absolute top-0 h-full bg-slate-400 opacity-50 transition-all duration-500"
                style={{ 
                  left: `${Math.min((data.primarySets / data.recommended.max) * 100, 100)}%`,
                  width: `${Math.min((data.secondarySets * 0.5 / data.recommended.max) * 100, 100 - (data.primarySets / data.recommended.max) * 100)}%` 
                }}
              />
              {/* Labels */}
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <span className="text-xs font-medium text-white drop-shadow">
                  {data.primarySets > 0 && `${data.primarySets}P`}
                  {data.secondarySets > 0 && ` + ${data.secondarySets}S`}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>{data.recommended.min} min</span>
              <span>{data.recommended.max} max</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
