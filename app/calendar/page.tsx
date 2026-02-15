'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Calendar } from '@/components/calendar/Calendar';
import { DayDetailModal } from '@/components/calendar/DayDetailModal';
import { WorkoutHeatMap } from '@/components/statistics/WorkoutHeatMap';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { ChevronLeft, ChevronRight, Grid3X3, Calendar as CalendarIcon, TrendingUp, Target, Flame, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isWithinInterval, isSameMonth, differenceInDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

type CalendarView = 'month' | 'year';
type PopupType = 'completed' | 'planned' | 'fulfillment' | 'streak' | null;

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const { workoutSessions, trainingPlans } = useWorkoutStore();

  // Calculate monthly stats dynamically
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Count workouts in current month
    const monthWorkouts = workoutSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
    });
    
    // Get active plan's sessions per week
    const activePlan = trainingPlans.find(p => p.isActive);
    const plannedPerWeek = activePlan?.sessionsPerWeek || 0;
    
    // Calculate planned workouts for the month (approximately 4.3 weeks per month)
    const weeksInMonth = 4.3;
    const plannedWorkouts = Math.round(plannedPerWeek * weeksInMonth);
    
    // Calculate fulfillment percentage
    const fulfillment = plannedWorkouts > 0 
      ? Math.round((monthWorkouts.length / plannedWorkouts) * 100)
      : 0;
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    const sortedSessions = [...workoutSessions]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    if (sortedSessions.length > 0) {
      const weekStart = startOfWeek(today, { locale: de });
      const weekEnd = endOfWeek(today, { locale: de });
      
      // Count consecutive weeks with workouts
      let checkWeek = weekStart;
      while (true) {
        const weekHasWorkout = workoutSessions.some(session => {
          const sessionDate = new Date(session.startTime);
          return isWithinInterval(sessionDate, { 
            start: checkWeek, 
            end: endOfWeek(checkWeek, { locale: de }) 
          });
        });
        
        if (weekHasWorkout) {
          streak++;
          checkWeek = new Date(checkWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          break;
        }
        
        if (streak > 52) break; // Max 1 year
      }
    }
    
    return {
      completed: monthWorkouts.length,
      planned: plannedWorkouts,
      fulfillment: Math.min(fulfillment, 100),
      streak,
      monthWorkouts, // Include the actual workouts for the popup
    };
  }, [currentMonth, workoutSessions, trainingPlans]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-1 text-primary mb-2">
                Trainingskalender
              </h1>
              <p className="text-secondary">
                Plane deine Workouts und behalte den Überblick
              </p>
            </div>
            {/* View Toggle */}
            <div className="flex bg-[hsl(var(--bg-secondary))] rounded-xl p-1">
              <button
                onClick={() => setCalendarView('month')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  calendarView === 'month'
                    ? 'bg-[hsl(var(--bg-primary))] text-primary shadow-sm'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Monat
              </button>
              <button
                onClick={() => setCalendarView('year')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  calendarView === 'year'
                    ? 'bg-[hsl(var(--bg-primary))] text-primary shadow-sm'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Jahr
              </button>
            </div>
          </div>
        </div>

        {calendarView === 'month' ? (
          <>
            {/* Month Navigation */}
            <div className="card card-elevated p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="heading-2 text-primary">
                    {format(currentMonth, 'MMMM yyyy', { locale: de })}
                  </h2>
                  <p className="text-muted mt-1 text-sm">
                    {format(startOfMonth(currentMonth), 'd.', { locale: de })} -{' '}
                    {format(endOfMonth(currentMonth), 'd. MMMM', { locale: de })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToday}
                    className="btn btn-secondary"
                  >
                    Heute
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={handlePreviousMonth}
                      className="btn-icon"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="btn-icon"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats with Popups */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Trainings diesen Monat */}
              <div 
                className="card card-interactive group relative cursor-pointer"
                onClick={() => setActivePopup(activePopup === 'completed' ? null : 'completed')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Target className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="stat-number text-primary">{monthStats.completed}</p>
                    <p className="text-sm text-muted">Trainings diesen Monat</p>
                  </div>
                </div>
                {/* Popup */}
                {activePopup === 'completed' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border-2 border-slate-300 p-5 z-[100]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-800">Trainings im {format(currentMonth, 'MMMM', { locale: de })}</h4>
                      <button onClick={(e) => { e.stopPropagation(); setActivePopup(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {monthStats.monthWorkouts.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {monthStats.monthWorkouts.map((w, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                            <span className="font-medium text-slate-700">{w.trainingDayName}</span>
                            <span className="text-slate-500">{format(new Date(w.startTime), 'dd.MM', { locale: de })}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Noch keine Trainings diesen Monat</p>
                    )}
                  </div>
                )}
              </div>

              {/* Geplante Workouts */}
              <div 
                className="card card-interactive group relative cursor-pointer"
                onClick={() => setActivePopup(activePopup === 'planned' ? null : 'planned')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[hsl(var(--success))] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="stat-number text-primary">{monthStats.planned}</p>
                    <p className="text-sm text-muted">Geplante Workouts</p>
                  </div>
                </div>
                {/* Popup */}
                {activePopup === 'planned' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border-2 border-slate-300 p-5 z-[100]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-800">Geplante Workouts</h4>
                      <button onClick={(e) => { e.stopPropagation(); setActivePopup(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Basierend auf deinem aktiven Plan mit <strong>{trainingPlans.find(p => p.isActive)?.sessionsPerWeek || 0}</strong> Sessions/Woche
                    </p>
                    <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                      <span className="text-sm text-emerald-700">Noch offen:</span>
                      <span className="font-bold text-emerald-700">{Math.max(0, monthStats.planned - monthStats.completed)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Plan-Einhaltung */}
              <div 
                className="card card-interactive group relative cursor-pointer"
                onClick={() => setActivePopup(activePopup === 'fulfillment' ? null : 'fulfillment')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-xl font-bold">{monthStats.fulfillment}%</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">Erfüllung</p>
                    <p className="text-sm text-muted">Plan-Einhaltung</p>
                  </div>
                </div>
                {/* Popup */}
                {activePopup === 'fulfillment' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border-2 border-slate-300 p-5 z-[100]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-800">Plan-Einhaltung</h4>
                      <button onClick={(e) => { e.stopPropagation(); setActivePopup(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Fortschritt</span>
                        <span className="font-bold text-slate-800">{monthStats.completed} / {monthStats.planned}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${monthStats.fulfillment}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {monthStats.fulfillment >= 100 ? '🎉 Ziel erreicht!' : 
                       monthStats.fulfillment >= 75 ? '💪 Gut dabei!' : 
                       monthStats.fulfillment >= 50 ? '👍 Weiter so!' : '🚀 Los geht\'s!'}
                    </p>
                  </div>
                )}
              </div>

              {/* Streak */}
              <div 
                className="card card-interactive group relative overflow-visible cursor-pointer"
                onClick={() => setActivePopup(activePopup === 'streak' ? null : 'streak')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Flame className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="stat-number text-primary">{monthStats.streak}</p>
                    <p className="text-sm text-muted">Wochen Streak 🔥</p>
                  </div>
                </div>
                {/* Popup */}
                {activePopup === 'streak' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border-2 border-slate-300 p-5 z-[100]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-800">Wochen-Streak</h4>
                      <button onClick={(e) => { e.stopPropagation(); setActivePopup(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl">🔥</div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{monthStats.streak} Wochen</p>
                        <p className="text-sm text-slate-500">ununterbrochen trainiert</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 bg-orange-50 p-2 rounded-lg">
                      Ein Streak zählt jede Woche, in der du mindestens einmal trainiert hast.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="card card-elevated p-6">
              <Calendar
                currentMonth={currentMonth}
                onDateClick={(date) => setSelectedDate(date)}
              />
            </div>
          </>
        ) : (
          /* Year View - Heatmap */
          <div className="animate-slide-up">
            <WorkoutHeatMap year={new Date().getFullYear()} />
          </div>
        )}

        {/* Day Detail Modal */}
        {selectedDate && (
          <DayDetailModal
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
