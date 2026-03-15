'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, subWeeks, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import { useState } from 'react';

interface VolumeData {
  week: string;
  date: Date;
  volume: number;
  sets: number;
  workouts: number;
}

export function VolumeProgressChart() {
  const { workoutSessions } = useWorkoutStore();
  const [selectedExercise, setSelectedExercise] = useState<string>('all');

  // Get unique exercises from workout history
  const availableExercises = useMemo(() => {
    const exerciseSet = new Set<string>();
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        exerciseSet.add(ex.exerciseId);
      });
    });
    return Array.from(exerciseSet)
      .map(id => exerciseDatabase.find(e => e.id === id))
      .filter(Boolean) as typeof exerciseDatabase;
  }, [workoutSessions]);

  // Calculate weekly volume data
  const volumeData = useMemo(() => {
    const weeks: VolumeData[] = [];
    const now = new Date();
    
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = subWeeks(now, i);
      const weekEnd = subWeeks(now, i - 1);
      
      const weekSessions = workoutSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return isAfter(sessionDate, weekStart) && !isAfter(sessionDate, weekEnd);
      });

      let volume = 0;
      let sets = 0;

      weekSessions.forEach(session => {
        session.exercises.forEach(ex => {
          if (selectedExercise !== 'all' && ex.exerciseId !== selectedExercise) return;
          
          ex.sets.forEach(set => {
            if (set.completed && set.weight > 0) {
              volume += set.weight * set.reps;
              sets++;
            }
          });
        });
      });

      weeks.push({
        week: `W${12 - i}`,
        date: weekStart,
        volume: Math.round(volume),
        sets,
        workouts: weekSessions.length
      });
    }

    return weeks;
  }, [workoutSessions, selectedExercise]);

  // Calculate trend
  const trend = useMemo(() => {
    if (volumeData.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const recentWeeks = volumeData.slice(-4);
    const olderWeeks = volumeData.slice(-8, -4);
    
    const recentAvg = recentWeeks.reduce((sum, w) => sum + w.volume, 0) / recentWeeks.length;
    const olderAvg = olderWeeks.reduce((sum, w) => sum + w.volume, 0) / olderWeeks.length;
    
    if (olderAvg === 0) return { direction: 'neutral', percentage: 0 };
    
    const percentage = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
    
    return {
      direction: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral',
      percentage: Math.abs(percentage)
    };
  }, [volumeData]);

  // Stats
  const stats = useMemo(() => {
    const totalVolume = volumeData.reduce((sum, w) => sum + w.volume, 0);
    const avgVolume = Math.round(totalVolume / volumeData.length);
    const maxVolume = Math.max(...volumeData.map(w => w.volume));
    const totalSets = volumeData.reduce((sum, w) => sum + w.sets, 0);
    
    return { totalVolume, avgVolume, maxVolume, totalSets };
  }, [volumeData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[hsl(225,14%,10%)] rounded-xl shadow-lg border border-[hsl(225,10%,14%)] p-4 min-w-[160px]">
          <p className="text-sm font-semibold text-[hsl(var(--fg-primary))] mb-2">
            {format(data.date, 'dd. MMM', { locale: de })}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Volumen:</span>
              <span className="text-sm font-bold text-primary-600">
                {data.volume.toLocaleString()} kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[hsl(var(--fg-muted))]">SÃƒÂ¤tze:</span>
              <span className="text-sm font-semibold text-[hsl(var(--fg-secondary))]">{data.sets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[hsl(var(--fg-muted))]">Trainings:</span>
              <span className="text-sm font-semibold text-[hsl(var(--fg-secondary))]">{data.workouts}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (workoutSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-[hsl(var(--fg-primary))] mb-1">Keine Daten</p>
          <p className="text-sm text-[hsl(var(--fg-muted))]">Starte dein erstes Training</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exercise Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedExercise('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            selectedExercise === 'all'
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-[hsl(225,12%,13%)] text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,18%)]'
          }`}
        >
          Alle ÃƒÅ“bungen
        </button>
        {availableExercises.slice(0, 5).map(ex => (
          <button
            key={ex.id}
            onClick={() => setSelectedExercise(ex.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedExercise === ex.id
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-[hsl(225,12%,13%)] text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,18%)]'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[hsl(225,12%,13%)] rounded-xl p-4">
          <p className="text-xs text-[hsl(var(--fg-muted))] mb-1">12-Wochen Volumen</p>
          <p className="text-xl font-bold text-[hsl(var(--fg-primary))]">
            {(stats.totalVolume / 1000).toFixed(1)}t
          </p>
        </div>
        <div className="bg-[hsl(225,12%,13%)] rounded-xl p-4">
          <p className="text-xs text-[hsl(var(--fg-muted))] mb-1">ÃƒËœ Woche</p>
          <p className="text-xl font-bold text-[hsl(var(--fg-primary))]">
            {(stats.avgVolume / 1000).toFixed(1)}t
          </p>
        </div>
        <div className={`rounded-xl p-4 ${
          trend.direction === 'up' ? 'bg-emerald-400/10' : 
          trend.direction === 'down' ? 'bg-rose-400/10' : 'bg-[hsl(225,12%,13%)]'
        }`}>
          <p className="text-xs text-[hsl(var(--fg-muted))] mb-1">Trend</p>
          <div className="flex items-center gap-1">
            {trend.direction === 'up' ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="w-5 h-5 text-rose-600" />
            ) : (
              <Minus className="w-5 h-5 text-[hsl(var(--fg-subtle))]" />
            )}
            <p className={`text-xl font-bold ${
              trend.direction === 'up' ? 'text-emerald-600' : 
              trend.direction === 'down' ? 'text-rose-600' : 'text-[hsl(var(--fg-secondary))]'
            }`}>
              {trend.percentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}t`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={stats.avgVolume} 
              stroke="#94a3b8" 
              strokeDasharray="5 5"
              label={{ value: 'ÃƒËœ', position: 'right', fill: '#94a3b8', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              fill="url(#volumeGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
