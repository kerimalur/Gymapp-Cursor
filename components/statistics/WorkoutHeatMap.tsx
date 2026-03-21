'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { format, eachDayOfInterval, startOfYear, endOfYear, isSameDay, subYears, getDay, startOfWeek, addDays, getWeek, differenceInCalendarWeeks } from 'date-fns';
import { de } from 'date-fns/locale';

interface WorkoutHeatMapProps {
  year?: number;
}

export function WorkoutHeatMap({ year }: WorkoutHeatMapProps) {
  const { workoutSessions } = useWorkoutStore();
  const currentYear = year || new Date().getFullYear();
  
  // Calculate workout data for each day
  const heatMapData = useMemo(() => {
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 0, 1));
    
    // Get all days in the year
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    
    // Create a map of workout counts per day
    const workoutMap = new Map<string, number>();
    
    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const dateKey = format(sessionDate, 'yyyy-MM-dd');
      workoutMap.set(dateKey, (workoutMap.get(dateKey) || 0) + 1);
    });
    
    // Map days to heat data
    return allDays.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const count = workoutMap.get(dateKey) || 0;
      return {
        date: day,
        dateKey,
        count,
        level: count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count >= 3 ? 3 : 0
      };
    });
  }, [workoutSessions, currentYear]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const totalWorkouts = workoutSessions.filter(s => {
      const d = new Date(s.startTime);
      return d.getFullYear() === currentYear;
    }).length;
    
    const workoutDays = heatMapData.filter(d => d.count > 0).length;
    
    // Calculate current streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    
    // Sort days from most recent to oldest for current streak
    const sortedDays = [...heatMapData]
      .filter(d => d.date <= today)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Calculate current streak (consecutive days from today)
    for (const day of sortedDays) {
      if (day.count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate max streak
    for (const day of heatMapData) {
      if (day.count > 0) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return {
      totalWorkouts,
      workoutDays,
      currentStreak,
      maxStreak,
      avgPerWeek: Math.round((totalWorkouts / 52) * 10) / 10
    };
  }, [heatMapData, workoutSessions, currentYear]);
  
  // Group days by week for rendering
  const weeks = useMemo(() => {
    const result: typeof heatMapData[] = [];
    let currentWeek: typeof heatMapData = [];
    
    // Find the first Sunday of the year or the last Sunday of the previous year
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const firstDay = startOfWeek(yearStart, { weekStartsOn: 0 });
    
    // Pad the beginning if the year doesn't start on Sunday
    const dayOfWeek = getDay(yearStart);
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({
        date: addDays(firstDay, i),
        dateKey: '',
        count: -1, // -1 indicates empty cell
        level: -1
      });
    }
    
    heatMapData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Push remaining days
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [heatMapData, currentYear]);
  
  const months = ['Jan', 'Feb', 'Maer', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  
  const getLevelColor = (level: number) => {
    switch (level) {
      case -1: return 'bg-transparent';
      case 0: return 'bg-[hsl(225,12%,15%)] border border-[hsl(225,10%,18%)]';
      case 1: return 'bg-emerald-400/30 border border-emerald-400/40';
      case 2: return 'bg-emerald-400/60 border border-emerald-400/70';
      case 3: return 'bg-emerald-500 border border-emerald-600';
      default: return 'bg-[hsl(225,12%,15%)] border border-[hsl(225,10%,18%)]';
    }
  };
  
  return (
    <div className="bg-[hsl(225,14%,11%)] rounded-2xl border border-[hsl(225,10%,16%)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Trainings-Aktivität {currentYear}</h3>
          <p className="text-sm text-[hsl(var(--fg-muted))] mt-1">
            {stats.totalWorkouts} Trainings an {stats.workoutDays} Tagen
          </p>
        </div>
        
        {/* Stats badges */}
        <div className="flex gap-3">
          <div className="bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-emerald-400 font-medium">Aktueller Streak</p>
            <p className="text-lg font-bold text-emerald-300">{stats.currentStreak} Tage</p>
          </div>
          <div className="bg-orange-400/10 border border-orange-400/20 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-orange-400 font-medium">Bester Streak</p>
            <p className="text-lg font-bold text-orange-300">{stats.maxStreak} Tage</p>
          </div>
          <div className="bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-cyan-400 font-medium">Ø pro Woche</p>
            <p className="text-lg font-bold text-cyan-300">{stats.avgPerWeek}</p>
          </div>
        </div>
      </div>
      
      {/* Month labels */}
      <div className="flex mb-2 ml-8">
        {months.map((month, i) => (
          <div key={month} className="flex-1 text-xs text-[hsl(var(--fg-muted))] font-medium">
            {month}
          </div>
        ))}
      </div>
      
      {/* Heat map grid */}
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-2 text-xs text-[hsl(var(--fg-muted))]">
          {dayLabels.map((day, i) => (
            <div key={day} className="h-[14px] flex items-center">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="flex gap-[3px] flex-1 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <div
                  key={day.dateKey || `empty-${weekIndex}-${dayIndex}`}
                  className={`w-[14px] h-[14px] rounded-sm ${getLevelColor(day.level)} cursor-pointer transition-all hover:scale-125 hover:shadow-md`}
                  title={day.level >= 0 ? `${format(day.date, 'dd.MM.yyyy', { locale: de })}: ${day.count} Training${day.count !== 1 ? 's' : ''}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-[hsl(var(--fg-muted))]">
        <span>Weniger</span>
        <div className={`w-[14px] h-[14px] rounded-sm ${getLevelColor(0)}`} />
        <div className={`w-[14px] h-[14px] rounded-sm ${getLevelColor(1)}`} />
        <div className={`w-[14px] h-[14px] rounded-sm ${getLevelColor(2)}`} />
        <div className={`w-[14px] h-[14px] rounded-sm ${getLevelColor(3)}`} />
        <span>Mehr</span>
      </div>
    </div>
  );
}
