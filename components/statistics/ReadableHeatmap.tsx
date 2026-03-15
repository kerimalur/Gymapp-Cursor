'use client';

import { useMemo, useState, useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { getMuscleInvolvement } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, format, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

// Muscle labels in German
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

interface HeatmapData {
  date: Date;
  dayName: string;
  dayOfMonth: number;
  isToday: boolean;
  muscles: { muscle: MuscleGroup; sets: number }[];
  totalSets: number;
  intensity: 'none' | 'low' | 'medium' | 'high' | 'extreme';
}

export function ReadableHeatmap({ weeks = 12 }: { weeks?: number }) {
  const { workoutSessions } = useWorkoutStore();
  const [hoveredDay, setHoveredDay] = useState<HeatmapData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const heatmapData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: de, weekStartsOn: 1 });
    const startDate = subWeeks(weekStart, weeks - 1);
    const endDate = endOfWeek(now, { locale: de, weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return allDays.map(day => {
      // Find sessions on this day
      const daySessions = workoutSessions.filter(session => 
        isSameDay(new Date(session.startTime), day)
      );

      // Calculate muscle volume for this day
      const muscleVolume: Record<MuscleGroup, number> = {} as any;
      Object.keys(MUSCLE_LABELS).forEach(muscle => {
        muscleVolume[muscle as MuscleGroup] = 0;
      });

      daySessions.forEach(session => {
        session.exercises.forEach(ex => {
          // Only count completed sets with weight > 0
          const completedSets = ex.sets.filter(s => s.completed && s.weight > 0).length;
          if (completedSets === 0) return;

          const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
          muscleInvolvement.forEach(({ muscle, role }) => {
            if (role === 'primary') {
              muscleVolume[muscle] += completedSets;
            } else {
              muscleVolume[muscle] += Math.round(completedSets * 0.5);
            }
          });
        });
      });

      const muscles = Object.entries(muscleVolume)
        .filter(([_, sets]) => sets > 0)
        .map(([muscle, sets]) => ({ muscle: muscle as MuscleGroup, sets }))
        .sort((a, b) => b.sets - a.sets);

      const totalSets = muscles.reduce((sum, m) => sum + m.sets, 0);

      // Determine intensity level
      let intensity: HeatmapData['intensity'] = 'none';
      if (totalSets > 0 && totalSets <= 10) intensity = 'low';
      else if (totalSets > 10 && totalSets <= 20) intensity = 'medium';
      else if (totalSets > 20 && totalSets <= 35) intensity = 'high';
      else if (totalSets > 35) intensity = 'extreme';

      return {
        date: day,
        dayName: format(day, 'EEEE', { locale: de }),
        dayOfMonth: day.getDate(),
        isToday: isSameDay(day, now),
        muscles,
        totalSets,
        intensity,
      } as HeatmapData;
    });
  }, [workoutSessions, weeks]);

  // Group by weeks
  const weeklyData = useMemo(() => {
    const result: HeatmapData[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      result.push(heatmapData.slice(i, i + 7));
    }
    return result;
  }, [heatmapData]);

  const getIntensityColor = (intensity: HeatmapData['intensity']) => {
    switch (intensity) {
      case 'none': return 'bg-slate-100';
      case 'low': return 'bg-emerald-200';
      case 'medium': return 'bg-emerald-400';
      case 'high': return 'bg-emerald-600';
      case 'extreme': return 'bg-emerald-800';
    }
  };

  const getIntensityRing = (intensity: HeatmapData['intensity']) => {
    switch (intensity) {
      case 'none': return '';
      case 'low': return 'ring-emerald-200';
      case 'medium': return 'ring-emerald-400';
      case 'high': return 'ring-emerald-500';
      case 'extreme': return 'ring-emerald-700';
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-40 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="relative">
      {/* Day labels on the left */}
      <div className="flex">
        <div className="flex flex-col justify-between pr-2 py-1">
          {dayLabels.map((day, i) => (
            <span key={i} className="text-xs text-slate-400 h-[18px] flex items-center">
              {day}
            </span>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeklyData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    w-4 h-4 rounded-sm cursor-pointer
                    ${getIntensityColor(day.intensity)}
                    ${day.isToday ? `ring-2 ${getIntensityRing(day.intensity) || 'ring-blue-500'}` : ''}
                    hover:ring-2 hover:ring-blue-400
                    transition-all duration-150
                  `}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`${format(day.date, 'dd.MM.yyyy')} - ${day.totalSets} Sätze`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-500">Weniger</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-sm bg-slate-100" />
          <div className="w-4 h-4 rounded-sm bg-emerald-200" />
          <div className="w-4 h-4 rounded-sm bg-emerald-400" />
          <div className="w-4 h-4 rounded-sm bg-emerald-600" />
          <div className="w-4 h-4 rounded-sm bg-emerald-800" />
        </div>
        <span className="text-xs text-slate-500">Mehr</span>
      </div>

      {/* Legend Detail */}
      <div className="grid grid-cols-5 gap-2 mt-3 text-center">
        <div className="text-xs">
          <div className="w-4 h-4 rounded-sm bg-slate-100 mx-auto mb-1" />
          <span className="text-slate-400">Ruhetag</span>
        </div>
        <div className="text-xs">
          <div className="w-4 h-4 rounded-sm bg-emerald-200 mx-auto mb-1" />
          <span className="text-slate-500">1-10</span>
        </div>
        <div className="text-xs">
          <div className="w-4 h-4 rounded-sm bg-emerald-400 mx-auto mb-1" />
          <span className="text-slate-500">11-20</span>
        </div>
        <div className="text-xs">
          <div className="w-4 h-4 rounded-sm bg-emerald-600 mx-auto mb-1" />
          <span className="text-slate-500">21-35</span>
        </div>
        <div className="text-xs">
          <div className="w-4 h-4 rounded-sm bg-emerald-800 mx-auto mb-1" />
          <span className="text-slate-500">35+</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredDay.totalSets > 0 && (
        <div className="absolute z-20 top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white rounded-xl p-4 shadow-xl min-w-[200px] animate-fade-in">
          <div className="text-center mb-3">
            <p className="font-bold">{format(hoveredDay.date, 'EEEE', { locale: de })}</p>
            <p className="text-sm text-slate-300">{format(hoveredDay.date, 'd. MMMM yyyy', { locale: de })}</p>
          </div>
          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300">Gesamt Sätze:</span>
              <span className="font-bold text-emerald-400">{hoveredDay.totalSets}</span>
            </div>
            {hoveredDay.muscles.slice(0, 5).map(({ muscle, sets }) => (
              <div key={muscle} className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-400">{MUSCLE_LABELS[muscle]}</span>
                <span className="text-white">{sets} Sätze</span>
              </div>
            ))}
            {hoveredDay.muscles.length > 5 && (
              <p className="text-xs text-slate-400 mt-1 text-center">
                +{hoveredDay.muscles.length - 5} weitere
              </p>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45" />
        </div>
      )}
    </div>
  );
}
