'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase, getMuscleInvolvement } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';
import { startOfWeek, subWeeks, isWithinInterval, endOfWeek } from 'date-fns';

// Optimal weekly set ranges per muscle group (based on research)
const VOLUME_RECOMMENDATIONS: Record<MuscleGroup, { min: number; optimal: number; max: number }> = {
  chest: { min: 10, optimal: 16, max: 22 },
  back: { min: 10, optimal: 16, max: 22 },
  shoulders: { min: 8, optimal: 14, max: 20 },
  biceps: { min: 8, optimal: 12, max: 18 },
  triceps: { min: 8, optimal: 12, max: 18 },
  forearms: { min: 4, optimal: 8, max: 12 },
  abs: { min: 6, optimal: 10, max: 15 },
  quadriceps: { min: 10, optimal: 16, max: 22 },
  hamstrings: { min: 8, optimal: 12, max: 18 },
  calves: { min: 8, optimal: 12, max: 18 },
  glutes: { min: 8, optimal: 14, max: 20 },
  traps: { min: 6, optimal: 10, max: 14 },
  lats: { min: 10, optimal: 14, max: 20 },
  adductors: { min: 4, optimal: 8, max: 12 },
  abductors: { min: 4, optimal: 8, max: 12 },
  lower_back: { min: 4, optimal: 8, max: 12 },
  neck: { min: 2, optimal: 4, max: 8 },
};

const muscleNames: Record<MuscleGroup, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern', biceps: 'Bizeps',
  triceps: 'Trizeps', forearms: 'Unterarme', abs: 'Bauch', quadriceps: 'Quadrizeps',
  hamstrings: 'Beinbeuger', calves: 'Waden', glutes: 'Gesäß', traps: 'Trapez', lats: 'Latissimus',
  adductors: 'Adduktoren', abductors: 'Abduktoren', lower_back: 'Unterer Rücken', neck: 'Nacken'
};

interface MuscleVolumeData {
  muscle: MuscleGroup;
  currentSets: number;
  recommendation: typeof VOLUME_RECOMMENDATIONS[MuscleGroup];
  status: 'under' | 'optimal' | 'over';
  trend: number; // Change from last week
}

export function VolumeRecommendations() {
  const { workoutSessions } = useWorkoutStore();

  const volumeData = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    // Calculate sets per muscle for this week
    const thisWeekSets: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
    const lastWeekSets: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;

    Object.keys(VOLUME_RECOMMENDATIONS).forEach(muscle => {
      thisWeekSets[muscle as MuscleGroup] = 0;
      lastWeekSets[muscle as MuscleGroup] = 0;
    });

    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const isThisWeek = isWithinInterval(sessionDate, { start: thisWeekStart, end: thisWeekEnd });
      const isLastWeek = isWithinInterval(sessionDate, { start: lastWeekStart, end: lastWeekEnd });

      if (!isThisWeek && !isLastWeek) return;

      session.exercises.forEach(ex => {
        const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
        const completedSets = ex.sets.filter(s => s.completed && !s.isWarmup && s.weight > 0).length;

        muscleInvolvement.forEach(({ muscle, role }) => {
          // Count full sets for primary muscles, half for secondary
          const setsToAdd = role === 'primary' ? completedSets : Math.round(completedSets * 0.5);
          
          if (isThisWeek) {
            thisWeekSets[muscle] += setsToAdd;
          } else if (isLastWeek) {
            lastWeekSets[muscle] += setsToAdd;
          }
        });
      });
    });

    // Generate volume data with recommendations
    const data: MuscleVolumeData[] = [];
    
    Object.entries(VOLUME_RECOMMENDATIONS).forEach(([muscle, rec]) => {
      const currentSets = thisWeekSets[muscle as MuscleGroup];
      const lastSets = lastWeekSets[muscle as MuscleGroup];
      
      let status: 'under' | 'optimal' | 'over' = 'optimal';
      if (currentSets < rec.min) status = 'under';
      else if (currentSets > rec.max) status = 'over';

      data.push({
        muscle: muscle as MuscleGroup,
        currentSets,
        recommendation: rec,
        status,
        trend: currentSets - lastSets,
      });
    });

    // Sort by status priority (under first, then optimal, then over) and then by deviation from optimal
    return data.sort((a, b) => {
      const statusOrder = { under: 0, over: 1, optimal: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      // Within same status, sort by how far from optimal
      const aDeviation = Math.abs(a.currentSets - a.recommendation.optimal);
      const bDeviation = Math.abs(b.currentSets - b.recommendation.optimal);
      return bDeviation - aDeviation;
    });
  }, [workoutSessions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'over': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under': return '📉';
      case 'over': return '⚠️';
      default: return '✅';
    }
  };

  const getRecommendationText = (data: MuscleVolumeData) => {
    if (data.status === 'under') {
      const needed = data.recommendation.min - data.currentSets;
      return `+${needed} Sätze bis Minimum`;
    } else if (data.status === 'over') {
      const excess = data.currentSets - data.recommendation.max;
      return `${excess} Sätze über Maximum`;
    }
    return 'Im optimalen Bereich';
  };

  const undertrainedCount = volumeData.filter(d => d.status === 'under').length;
  const overtrainedCount = volumeData.filter(d => d.status === 'over').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-amber-800 font-bold text-2xl">{undertrainedCount}</p>
          <p className="text-amber-600 text-sm">Untertrainiert</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-emerald-800 font-bold text-2xl">
            {volumeData.filter(d => d.status === 'optimal').length}
          </p>
          <p className="text-emerald-600 text-sm">Optimal</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-red-800 font-bold text-2xl">{overtrainedCount}</p>
          <p className="text-red-600 text-sm">Übertrainiert</p>
        </div>
      </div>

      {/* Muscle Volume Table */}
      <div className="space-y-2">
        {volumeData.slice(0, 10).map(data => (
          <div
            key={data.muscle}
            className={`p-4 rounded-xl border ${getStatusColor(data.status)} transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getStatusIcon(data.status)}</span>
                <div>
                  <p className="font-semibold">{muscleNames[data.muscle]}</p>
                  <p className="text-sm opacity-75">{getRecommendationText(data)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{data.currentSets} Sätze</p>
                <p className="text-xs opacity-75">
                  Optimal: {data.recommendation.min}-{data.recommendation.max}
                </p>
                {data.trend !== 0 && (
                  <p className={`text-xs font-medium ${data.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {data.trend > 0 ? '+' : ''}{data.trend} vs. letzte Woche
                  </p>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    data.status === 'under' ? 'bg-amber-500' :
                    data.status === 'over' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (data.currentSets / data.recommendation.max) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-60">
                <span>{data.recommendation.min}</span>
                <span>{data.recommendation.optimal}</span>
                <span>{data.recommendation.max}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      {undertrainedCount > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Empfehlungen</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {volumeData.filter(d => d.status === 'under').slice(0, 3).map(d => (
              <li key={d.muscle}>
                • {muscleNames[d.muscle]}: Füge {d.recommendation.min - d.currentSets}+ Sätze hinzu
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
