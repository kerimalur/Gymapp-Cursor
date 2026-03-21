'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  isBefore,
  getDay,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { Settings, X, Check } from 'lucide-react';

interface CalendarProps {
  currentMonth: Date;
  onDateClick: (date: Date) => void;
}

export function Calendar({ currentMonth, onDateClick }: CalendarProps) {
  const { workoutSessions, trainingPlans } = useWorkoutStore();
  const { trackingSettings, setPlannedWorkoutDays } = useNutritionStore();
  const [showWeekSettings, setShowWeekSettings] = useState<string | null>(null);
  const [tempSelectedDays, setTempSelectedDays] = useState<number[]>([]);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: de });
  const calendarEnd = endOfWeek(monthEnd, { locale: de });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = eachWeekOfInterval({ start: calendarStart, end: calendarEnd }, { locale: de });
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // Get active training plan
  const activePlan = trainingPlans.find(p => p.isActive);
  const sessionsPerWeek = activePlan?.sessionsPerWeek || 0;

  // Generate week key for storage
  const getWeekKey = (weekStart: Date) => format(weekStart, 'yyyy-ww');

  // Get planned days for a week
  const getPlannedDaysForWeek = (weekStart: Date): number[] => {
    const weekKey = getWeekKey(weekStart);
    return trackingSettings.plannedWorkoutDays?.[weekKey] || [];
  };

  const hasWorkoutOnDay = (date: Date) => {
    return workoutSessions.some((session) =>
      isSameDay(new Date(session.startTime), date)
    );
  };

  const getWorkoutCount = (date: Date) => {
    return workoutSessions.filter((session) =>
      isSameDay(new Date(session.startTime), date)
    ).length;
  };

  // Check if a day is manually planned
  const isPlannedWorkoutDay = (date: Date, weekStart: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only show for future dates (including today) in current month
    if (isBefore(date, today) || !isSameMonth(date, currentMonth)) return false;
    
    // Don't show if already has a workout
    if (hasWorkoutOnDay(date)) return false;
    
    // Get the day index (0=Mo, 6=So) - adjust for German locale
    const dayOfWeek = getDay(date);
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
    
    const plannedDays = getPlannedDaysForWeek(weekStart);
    return plannedDays.includes(dayIndex);
  };

  // Get workouts completed in a specific week
  const getWeekProgress = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { locale: de });
    const completed = workoutSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    }).length;
    
    const plannedDays = getPlannedDaysForWeek(weekStart);
    const target = plannedDays.length > 0 ? plannedDays.length : sessionsPerWeek;
    
    return {
      completed,
      target,
      percentage: target > 0 ? Math.min((completed / target) * 100, 100) : 0
    };
  };

  // Open week settings popup
  const openWeekSettings = (weekStart: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const weekKey = getWeekKey(weekStart);
    setShowWeekSettings(weekKey);
    setTempSelectedDays(getPlannedDaysForWeek(weekStart));
  };

  // Toggle a day selection
  const toggleDaySelection = (dayIndex: number) => {
    setTempSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  // Save week settings
  const saveWeekSettings = () => {
    if (showWeekSettings) {
      setPlannedWorkoutDays(showWeekSettings, tempSelectedDays);
      setShowWeekSettings(null);
    }
  };

  // Group days by week for rendering with progress circles
  const weekRows = weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { locale: de });
    const daysInWeek = days.filter(day => day >= weekStart && day <= weekEnd);
    const progress = getWeekProgress(weekStart);
    return { weekStart, daysInWeek, progress, weekKey: getWeekKey(weekStart) };
  });

  return (
    <div className="select-none">
      {/* Week Day Headers - with space for progress circle */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] mb-2">
        <div></div>
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-[hsl(var(--fg-muted))] py-2 text-xs uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Weekly Progress */}
      <div className="space-y-1">
        {weekRows.map(({ weekStart, daysInWeek, progress, weekKey }, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-[48px_repeat(7,1fr)] gap-2 items-center">
            {/* Weekly Progress Circle - Clickable for settings */}
            <button
              onClick={(e) => openWeekSettings(weekStart, e)}
              className="flex items-center justify-center group relative"
              title={`${progress.completed}/${progress.target} Trainings - Klicken zum Planen`}
            >
              <div className="relative w-9 h-9">
                {/* Background circle */}
                <svg className="w-9 h-9 transform -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="13"
                    fill="none"
                    stroke="hsl(225, 12%, 20%)"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="13"
                    fill="none"
                    stroke={progress.percentage >= 100 ? '#10b981' : '#3b82f6'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress.percentage / 100) * 81.7} 81.7`}
                    className="transition-all duration-500"
                  />
                </svg>
                {/* Center text / Settings icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[10px] font-bold group-hover:hidden ${progress.percentage >= 100 ? 'text-emerald-600' : 'text-cyan-400'}`}>
                    {progress.completed}
                  </span>
                  <Settings className="w-3 h-3 text-[hsl(var(--fg-subtle))] hidden group-hover:block" />
                </div>
              </div>
            </button>
            
            {/* Days */}
            {daysInWeek.map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const hasWorkout = hasWorkoutOnDay(day);
              const isPlanned = isPlannedWorkoutDay(day, weekStart);
              const workoutCount = getWorkoutCount(day);

              return (
                <button
                  key={dayIndex}
                  onClick={() => onDateClick(day)}
                  className={`
                    relative h-20 w-full flex items-center justify-center rounded-xl border text-sm font-semibold
                    transition-all duration-150
                    ${!isCurrentMonth ? 'text-[hsl(var(--fg-subtle))] opacity-40' : ''}
                    ${isCurrentDay 
                      ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm' 
                      : hasWorkout && isCurrentMonth
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/15'
                        : isPlanned && isCurrentMonth
                          ? 'border-2 border-dashed border-cyan-400/30 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/15'
                          : isCurrentMonth
                            ? 'border-[hsl(var(--border-light))] text-[hsl(var(--fg-secondary))] hover:bg-[hsl(var(--bg-tertiary))]'
                            : 'border-[hsl(225,10%,14%)] hover:bg-[hsl(225,12%,13%)]'
                    }
                  `}
                >
                  {format(day, 'd')}
                  {/* Workout indicator dot */}
                  {hasWorkout && !isCurrentDay && workoutCount > 0 && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                  {/* Planned indicator */}
                  {isPlanned && !hasWorkout && !isCurrentDay && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-[hsl(225,10%,14%)] flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-[hsl(var(--fg-muted))]">Absolviert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] text-[hsl(var(--fg-muted))]">Geplant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-500" />
          <span className="text-[10px] text-[hsl(var(--fg-muted))]">Heute</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Settings className="w-3 h-3 text-[hsl(var(--fg-subtle))]" />
          <span className="text-[10px] text-[hsl(var(--fg-muted))]">Kreis = Planen</span>
        </div>
      </div>

      {/* Week Planning Popup */}
      {showWeekSettings && (
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWeekSettings(null)}
        >
          <div 
            className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-xl max-w-sm w-full p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[hsl(var(--fg-primary))]">Trainingstage planen</h3>
              <button
                onClick={() => setShowWeekSettings(null)}
                className="p-1 hover:bg-[hsl(225,12%,18%)] rounded-lg"
              >
                <X className="w-5 h-5 text-[hsl(var(--fg-subtle))]" />
              </button>
            </div>
            
            <p className="text-sm text-[hsl(var(--fg-muted))] mb-4">
              W?hle die Tage aus, an denen du trainieren m?chtest:
            </p>
            
            {/* Day Selection */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, index) => (
                <button
                  key={day}
                  onClick={() => toggleDaySelection(index)}
                  className={`
                    h-12 rounded-lg text-sm font-medium transition-all
                    ${tempSelectedDays.includes(index)
                      ? 'bg-cyan-500 text-white'
                      : 'bg-[hsl(225,12%,15%)] text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,20%)]'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-[hsl(var(--fg-subtle))] text-center mb-4">
              {tempSelectedDays.length} Trainingstage ausgew?hlt
            </p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowWeekSettings(null)}
                className="flex-1 py-2 px-4 rounded-lg bg-[hsl(225,12%,15%)] text-[hsl(var(--fg-secondary))] font-medium hover:bg-[hsl(225,12%,20%)] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={saveWeekSettings}
                className="flex-1 py-2 px-4 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
