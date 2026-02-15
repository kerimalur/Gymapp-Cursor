'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  isSameDay,
  isSameWeek,
  isSameMonth,
} from 'date-fns';
import { de } from 'date-fns/locale';

// Inline SVG Icons
const Icons = {
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  barChart: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

interface ProgressChartProps {
  period: 'week' | 'month' | 'year';
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 min-w-[140px] animate-scale-in">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              <span className="text-xs text-gray-600">Trainings</span>
            </div>
            <span className="text-sm font-bold text-primary-600">{payload[0]?.value || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600">Sätze</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">{payload[1]?.value || 0}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ProgressChart({ period }: ProgressChartProps) {
  const { workoutSessions } = useWorkoutStore();
  const [showInfo, setShowInfo] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'trainings' | 'sets'>('trainings');

  const generateData = () => {
    const now = new Date();

    if (period === 'week') {
      const weekStart = startOfWeek(now, { locale: de });
      const weekEnd = endOfWeek(now, { locale: de });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      return days.map(day => {
        const dayWorkouts = workoutSessions.filter(session =>
          isSameDay(new Date(session.startTime), day)
        );
        
        const completedSets = dayWorkouts.reduce((sum, workout) => {
          return sum + workout.exercises.reduce((exSum, exercise) => {
            return exSum + exercise.sets.filter(s => s.completed && s.weight > 0).length;
          }, 0);
        }, 0);

        return {
          name: format(day, 'EEE', { locale: de }),
          fullName: format(day, 'EEEE', { locale: de }),
          trainings: dayWorkouts.length,
          sets: completedSets,
        };
      });
    }

    if (period === 'month') {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { locale: de });

      return weeks.map((week, idx) => {
        const weekWorkouts = workoutSessions.filter(session =>
          isSameWeek(new Date(session.startTime), week, { locale: de })
        );
        
        const completedSets = weekWorkouts.reduce((sum, workout) => {
          return sum + workout.exercises.reduce((exSum, exercise) => {
            return exSum + exercise.sets.filter(s => s.completed && s.weight > 0).length;
          }, 0);
        }, 0);

        return {
          name: `W${idx + 1}`,
          fullName: `Woche ${idx + 1}`,
          trainings: weekWorkouts.length,
          sets: completedSets,
        };
      });
    }

    // year
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map(month => {
      const monthWorkouts = workoutSessions.filter(session =>
        isSameMonth(new Date(session.startTime), month)
      );
      
      const completedSets = monthWorkouts.reduce((sum, workout) => {
        return sum + workout.exercises.reduce((exSum, exercise) => {
          return exSum + exercise.sets.filter(s => s.completed && s.weight > 0).length;
        }, 0);
      }, 0);

      return {
        name: format(month, 'MMM', { locale: de }),
        fullName: format(month, 'MMMM', { locale: de }),
        trainings: monthWorkouts.length,
        sets: completedSets,
      };
    });
  };

  const data = generateData();

  const totals = data.reduce((acc, item) => ({
    trainings: acc.trainings + item.trainings,
    sets: acc.sets + item.sets,
  }), { trainings: 0, sets: 0 });

  if (workoutSessions.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-300">
            {Icons.barChart}
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">Noch keine Daten</p>
          <p className="text-sm text-gray-500">Starte dein erstes Training</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveMetric('trainings')}
          className={`flex-1 p-4 rounded-2xl transition-all duration-300 ${
            activeMetric === 'trainings'
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-glow'
              : 'bg-white/60 hover:bg-white/80 border border-gray-100'
          }`}
        >
          <p className={`text-xs font-medium mb-1 ${activeMetric === 'trainings' ? 'text-primary-100' : 'text-gray-500'}`}>
            Trainings
          </p>
          <p className="text-2xl font-bold">{totals.trainings}</p>
        </button>
        
        <button
          onClick={() => setActiveMetric('sets')}
          className={`flex-1 p-4 rounded-2xl transition-all duration-300 ${
            activeMetric === 'sets'
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white/60 hover:bg-white/80 border border-gray-100'
          }`}
        >
          <p className={`text-xs font-medium mb-1 ${activeMetric === 'sets' ? 'text-emerald-100' : 'text-gray-500'}`}>
            Sätze
          </p>
          <p className="text-2xl font-bold">{totals.sets}</p>
        </button>

        <button
          onClick={() => setShowInfo(true)}
          className="p-3 rounded-xl bg-white/60 border border-gray-100 text-gray-400 hover:text-primary-500 hover:border-primary-200 transition-all"
          title="Info"
        >
          {Icons.info}
        </button>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrainings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af" 
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#9ca3af" 
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="trainings"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorTrainings)"
              dot={activeMetric === 'trainings' ? { fill: '#6366f1', strokeWidth: 0, r: 4 } : false}
              activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="sets"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSets)"
              dot={activeMetric === 'sets' ? { fill: '#10b981', strokeWidth: 0, r: 4 } : false}
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-sm text-gray-600">Trainings</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-600">Sätze</span>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowInfo(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                  {Icons.info}
                </div>
                <h3 className="font-bold text-gray-900">Trainingsübersicht</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                {Icons.close}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary-500" />
                  Trainings
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Die Anzahl der absolvierten Trainingseinheiten im gewählten Zeitraum.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Sätze (mit Gewicht)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Nur Sätze, die tatsächlich mit Gewicht abgeschlossen wurden. 
                  Sätze mit 0 kg werden nicht berücksichtigt.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">💡 Tipp</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Tippe auf die Karten oben, um zwischen den Metriken zu wechseln 
                  und die Datenpunkte im Chart hervorzuheben.
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
