'use client';

import { useMemo } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface NutritionTrendProps {
  showGoals?: boolean;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 min-w-[160px]">
        <p className="text-sm font-semibold text-slate-800 mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-slate-600">{entry.name}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {entry.value}{entry.name === 'Kalorien' ? '' : 'g'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function NutritionTrend({ showGoals = true }: NutritionTrendProps) {
  const { get7DayNutritionTrend, nutritionGoals } = useNutritionStore();

  const trendData = useMemo(() => {
    const rawTrend = get7DayNutritionTrend();
    
    return rawTrend.map(day => ({
      ...day,
      dayName: format(new Date(day.date), 'EEE', { locale: de }),
      fullDate: format(new Date(day.date), 'dd.MM', { locale: de }),
      calorieGoal: nutritionGoals?.dailyCalories || 2500,
      proteinGoal: nutritionGoals?.dailyProtein || 150,
    }));
  }, [get7DayNutritionTrend, nutritionGoals]);

  const stats = useMemo(() => {
    const nonZeroDays = trendData.filter(d => d.calories > 0);
    if (nonZeroDays.length === 0) {
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFats: 0,
        calorieChange: 0,
        proteinChange: 0,
        daysTracked: 0,
      };
    }

    const avgCalories = Math.round(nonZeroDays.reduce((sum, d) => sum + d.calories, 0) / nonZeroDays.length);
    const avgProtein = Math.round(nonZeroDays.reduce((sum, d) => sum + d.protein, 0) / nonZeroDays.length);
    const avgCarbs = Math.round(nonZeroDays.reduce((sum, d) => sum + d.carbs, 0) / nonZeroDays.length);
    const avgFats = Math.round(nonZeroDays.reduce((sum, d) => sum + d.fats, 0) / nonZeroDays.length);

    // Calculate trend (first half vs second half)
    const firstHalf = nonZeroDays.slice(0, Math.ceil(nonZeroDays.length / 2));
    const secondHalf = nonZeroDays.slice(Math.ceil(nonZeroDays.length / 2));

    const firstHalfCal = firstHalf.length > 0 
      ? firstHalf.reduce((sum, d) => sum + d.calories, 0) / firstHalf.length 
      : 0;
    const secondHalfCal = secondHalf.length > 0 
      ? secondHalf.reduce((sum, d) => sum + d.calories, 0) / secondHalf.length 
      : 0;

    const firstHalfProt = firstHalf.length > 0 
      ? firstHalf.reduce((sum, d) => sum + d.protein, 0) / firstHalf.length 
      : 0;
    const secondHalfProt = secondHalf.length > 0 
      ? secondHalf.reduce((sum, d) => sum + d.protein, 0) / secondHalf.length 
      : 0;

    return {
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFats,
      calorieChange: firstHalfCal > 0 ? Math.round(((secondHalfCal - firstHalfCal) / firstHalfCal) * 100) : 0,
      proteinChange: firstHalfProt > 0 ? Math.round(((secondHalfProt - firstHalfProt) / firstHalfProt) * 100) : 0,
      daysTracked: nonZeroDays.length,
    };
  }, [trendData]);

  const calorieGoal = nutritionGoals?.dailyCalories || 2500;
  const proteinGoal = nutritionGoals?.dailyProtein || 150;

  if (stats.daysTracked === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-slate-600 font-medium">Noch keine Daten</p>
        <p className="text-sm text-slate-400 mt-1">
          Tracke deine Mahlzeiten, um Trends zu sehen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🔥</span>
            {stats.calorieChange !== 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                stats.calorieChange > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {stats.calorieChange > 0 ? '+' : ''}{stats.calorieChange}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-orange-800 mt-2">{stats.avgCalories}</p>
          <p className="text-sm text-orange-600">Ø Kalorien/Tag</p>
          {showGoals && (
            <p className="text-xs text-orange-500 mt-1">
              Ziel: {calorieGoal} ({Math.round((stats.avgCalories / calorieGoal) * 100)}%)
            </p>
          )}
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🥩</span>
            {stats.proteinChange !== 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                stats.proteinChange > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {stats.proteinChange > 0 ? '+' : ''}{stats.proteinChange}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">{stats.avgProtein}g</p>
          <p className="text-sm text-blue-600">Ø Protein/Tag</p>
          {showGoals && (
            <p className="text-xs text-blue-500 mt-1">
              Ziel: {proteinGoal}g ({Math.round((stats.avgProtein / proteinGoal) * 100)}%)
            </p>
          )}
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <span className="text-2xl">🍞</span>
          <p className="text-2xl font-bold text-amber-800 mt-2">{stats.avgCarbs}g</p>
          <p className="text-sm text-amber-600">Ø Kohlenhydrate</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <span className="text-2xl">🥑</span>
          <p className="text-2xl font-bold text-purple-800 mt-2">{stats.avgFats}g</p>
          <p className="text-sm text-purple-600">Ø Fette</p>
        </div>
      </div>

      {/* Calorie Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="font-semibold text-slate-800 mb-4">Kalorien-Trend (7 Tage)</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="dayName" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="calories"
                name="Kalorien"
                stroke="#f97316"
                fill="url(#calorieGradient)"
                strokeWidth={2}
              />
              {showGoals && (
                <Line
                  type="monotone"
                  dataKey="calorieGoal"
                  name="Ziel"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Protein Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="font-semibold text-slate-800 mb-4">Protein-Trend (7 Tage)</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="proteinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="dayName" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="protein"
                name="Protein"
                stroke="#3b82f6"
                fill="url(#proteinGradient)"
                strokeWidth={2}
              />
              {showGoals && (
                <Line
                  type="monotone"
                  dataKey="proteinGoal"
                  name="Ziel"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Days tracked info */}
      <p className="text-center text-sm text-slate-500">
        {stats.daysTracked} von 7 Tagen getrackt
      </p>
    </div>
  );
}
