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
      <div className="grid grid-cols-[40px_repeat(7,1fr)] mb-1">
        <div></div>
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-medium text-slate-400 py-1.5 text-[10px] uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Weekly Progress */}
      <div className="space-y-1">
        {weekRows.map(({ weekStart, daysInWeek, progress, weekKey }, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 items-center">
            {/* Weekly Progress Circle - Clickable for settings */}
            <button
              onClick={(e) => openWeekSettings(weekStart, e)}
              className="flex items-center justify-center group relative"
              title={`${progress.completed}/${progress.target} Trainings - Klicken zum Planen`}
            >
              <div className="relative w-8 h-8">
                {/* Background circle */}
                <svg className="w-8 h-8 transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke={progress.percentage >= 100 ? '#10b981' : '#3b82f6'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress.percentage / 100) * 75.4} 75.4`}
                    className="transition-all duration-500"
                  />
                </svg>
                {/* Center text / Settings icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[10px] font-bold group-hover:hidden ${progress.percentage >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {progress.completed}
                  </span>
                  <Settings className="w-3 h-3 text-slate-400 hidden group-hover:block" />
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
                    relative h-12 w-full flex items-center justify-center rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${!isCurrentMonth ? 'text-slate-300' : ''}
                    ${isCurrentDay 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : hasWorkout && isCurrentMonth
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : isPlanned && isCurrentMonth
                          ? 'bg-blue-50 text-blue-600 border-2 border-dashed border-blue-300 hover:bg-blue-100'
                          : isCurrentMonth
                            ? 'text-slate-600 hover:bg-slate-100'
                            : 'hover:bg-slate-50'
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
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-slate-100 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-slate-500">Absolviert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-slate-500">Geplant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] text-slate-500">Heute</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Settings className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-500">Kreis = Planen</span>
        </div>
      </div>

      {/* Week Planning Popup */}
      {showWeekSettings && (
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWeekSettings(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Trainingstage planen</h3>
              <button
                onClick={() => setShowWeekSettings(null)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">
              Wähle die Tage aus, an denen du trainieren möchtest:
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
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-slate-400 text-center mb-4">
              {tempSelectedDays.length} Trainingstage ausgewählt
            </p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowWeekSettings(null)}
                className="flex-1 py-2 px-4 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={saveWeekSettings}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
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
