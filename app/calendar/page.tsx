'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Grid3X3, Timer } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Calendar } from '@/components/calendar/Calendar';
import { DayDetailModal } from '@/components/calendar/DayDetailModal';
import { WorkoutHeatMap } from '@/components/statistics/WorkoutHeatMap';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';

type CalendarView = 'month' | 'week' | 'year';

function dayIndexFromDate(date: Date) {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
}

function weekKeyFromDate(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-ww');
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { workoutSessions } = useWorkoutStore();
  const { trackingSettings } = useNutritionStore();

  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthWorkouts = workoutSessions.filter((session) =>
      isWithinInterval(new Date(session.startTime), { start: monthStart, end: monthEnd })
    );

    const plannedDays = trackingSettings?.plannedWorkoutDays || {};
    let plannedCount = 0;

    const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    allDaysInMonth.forEach((day) => {
      const key = weekKeyFromDate(day);
      const plannedForWeek = plannedDays[key] || [];
      if (plannedForWeek.includes(dayIndexFromDate(day))) {
        plannedCount += 1;
      }
    });

    const fulfillment = plannedCount > 0 ? Math.min(100, Math.round((monthWorkouts.length / plannedCount) * 100)) : 0;

    return {
      completed: monthWorkouts.length,
      planned: plannedCount,
      fulfillment,
    };
  }, [currentDate, workoutSessions, trackingSettings]);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const moveBackward = () => {
    if (calendarView === 'month') setCurrentDate((prev) => subMonths(prev, 1));
    else if (calendarView === 'week') setCurrentDate((prev) => subWeeks(prev, 1));
    else setCurrentDate((prev) => subYears(prev, 1));
  };

  const moveForward = () => {
    if (calendarView === 'month') setCurrentDate((prev) => addMonths(prev, 1));
    else if (calendarView === 'week') setCurrentDate((prev) => addWeeks(prev, 1));
    else setCurrentDate((prev) => addYears(prev, 1));
  };

  const headerTitle =
    calendarView === 'month'
      ? format(currentDate, 'MMMM yyyy', { locale: de })
      : calendarView === 'week'
      ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM', { locale: de })} - ${format(
          endOfWeek(currentDate, { weekStartsOn: 1 }),
          'dd.MM.yyyy',
          { locale: de }
        )}`
      : format(currentDate, 'yyyy', { locale: de });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Kalender</h1>
            <p className="mt-1 text-sm text-slate-500">Monat, Woche und Jahr mit Planung pro Tag.</p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[
              { key: 'month', label: 'Monat', Icon: CalendarIcon },
              { key: 'week', label: 'Woche', Icon: Timer },
              { key: 'year', label: 'Jahr', Icon: Grid3X3 },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setCalendarView(key as CalendarView)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  calendarView === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Trainings Monat</p>
            <p className="mt-1 text-2xl font-black text-blue-800">{monthStats.completed}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Geplant Monat</p>
            <p className="mt-1 text-2xl font-black text-emerald-800">{monthStats.planned}</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Erfüllung</p>
            <p className="mt-1 text-2xl font-black text-violet-800">{monthStats.fulfillment}%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-800">{headerTitle}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Heute
              </button>
              <button
                onClick={moveBackward}
                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                title="Zurück"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={moveForward}
                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                title="Vor"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {calendarView === 'month' && (
            <Calendar currentMonth={currentDate} onDateClick={(date) => { setCurrentDate(date); setCalendarView('week'); }} />
          )}

          {calendarView === 'week' && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
              {weekDays.map((day) => {
                const weekKey = weekKeyFromDate(day);
                const planned = trackingSettings?.plannedWorkoutDays?.[weekKey] || [];
                const isPlanned = planned.includes(dayIndexFromDate(day));
                const dayWorkouts = workoutSessions.filter((session) =>
                  isSameDay(new Date(session.startTime), day)
                );

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      dayWorkouts.length > 0
                        ? 'border-emerald-300 bg-emerald-50'
                        : isPlanned
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {format(day, 'EEE', { locale: de })}
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{format(day, 'd')}</p>

                    <div className="mt-3 space-y-1 text-xs">
                      <p className={dayWorkouts.length > 0 ? 'text-emerald-700' : 'text-slate-500'}>
                        {dayWorkouts.length > 0 ? `${dayWorkouts.length} Training` : 'Kein Training'}
                      </p>
                      <p className={isPlanned ? 'text-blue-700' : 'text-slate-400'}>
                        {isPlanned ? 'Geplant' : 'Nicht geplant'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {calendarView === 'year' && <WorkoutHeatMap year={currentDate.getFullYear()} />}
        </div>

        {selectedDate && <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />}
      </div>
    </DashboardLayout>
  );
}
