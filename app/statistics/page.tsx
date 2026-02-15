'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExerciseComparisonChart } from '@/components/statistics/ExerciseComparisonChart';
import { MuscleVolumeStats } from '@/components/statistics/MuscleVolumeStats';
import { GlobalSettingsModal } from '@/components/settings/GlobalSettingsModal';
import { BodyHeatmap } from '@/components/statistics/BodyHeatmap';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

// Icons
const Icons = {
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  trending: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  fire: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  arrowUp: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
  ),
  arrowDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
    </svg>
  ),
  muscle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
};

// Stat Card Component - Clean & High Contrast
function StatCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  trend, 
  color = 'blue',
  delay = 0 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  color?: 'blue' | 'emerald' | 'violet' | 'orange' | 'rose';
  delay?: number;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
    orange: 'bg-orange-100 text-orange-700',
    rose: 'bg-rose-100 text-rose-700',
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {trend > 0 ? Icons.arrowUp : Icons.arrowDown}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
    </div>
  );
}

export default function StatisticsPage() {
  const { workoutSessions } = useWorkoutStore();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Previous month for comparison
    const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const monthWorkouts = workoutSessions.filter(session =>
      isWithinInterval(new Date(session.startTime), { start: monthStart, end: monthEnd })
    );

    const prevMonthWorkouts = workoutSessions.filter(session =>
      isWithinInterval(new Date(session.startTime), { start: prevMonthStart, end: prevMonthEnd })
    );

    const totalVolume = monthWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);
    const prevTotalVolume = prevMonthWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);
    const totalDuration = monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = monthWorkouts.length > 0 ? Math.round(totalDuration / monthWorkouts.length) : 0;

    // Calculate total sets this month - ONLY count completed sets with weight > 0
    let totalSets = 0;
    monthWorkouts.forEach(session => {
      session.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          // Only count sets that are completed AND have weight tracked
          if (set.completed && set.weight > 0) {
            totalSets++;
          }
        });
      });
    });

    // Calculate volume trend
    const volumeTrend = prevTotalVolume > 0 
      ? Math.round(((totalVolume - prevTotalVolume) / prevTotalVolume) * 100)
      : 0;

    // Workout count trend
    const workoutTrend = prevMonthWorkouts.length > 0
      ? Math.round(((monthWorkouts.length - prevMonthWorkouts.length) / prevMonthWorkouts.length) * 100)
      : 0;

    return {
      totalVolume: Math.round(totalVolume),
      volumeTrend,
      workoutCount: monthWorkouts.length,
      workoutTrend,
      avgDuration,
      totalSets,
    };
  }, [workoutSessions]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header - Clean & Clear */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">📊 Statistiken</h1>
              <p className="text-slate-500 mt-1">Dein Fortschritt im Überblick</p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Einstellungen"
            >
              {Icons.settings}
            </button>
          </div>
        </div>

        {/* Muscle Heatmap - Prominente Übersicht */}
        {workoutSessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2">💪 Muskel-Heatmap</h2>
            <p className="text-sm text-slate-500 mb-6">Trainingsbelastung der letzten 7 Tage</p>
            <BodyHeatmap />
          </div>
        )}

        {/* Quick Stats - Klare Zahlen */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Icons.fire}
            label="Volumen diesen Monat"
            value={`${stats.totalVolume.toLocaleString()} kg`}
            trend={stats.volumeTrend}
            color="orange"
            delay={50}
          />
          <StatCard
            icon={Icons.trophy}
            label="Trainings diesen Monat"
            value={stats.workoutCount}
            trend={stats.workoutTrend}
            color="blue"
            delay={100}
          />
          <StatCard
            icon={Icons.muscle}
            label="Sätze diesen Monat"
            value={stats.totalSets}
            color="emerald"
            delay={150}
          />
        </div>

        {/* Volumen pro Muskel - Kombinierte Statistik */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-2">🔥 Volumen pro Muskel</h2>
          <p className="text-sm text-slate-500 mb-4">Wöchentliche Sätze mit Empfehlungen</p>
          <MuscleVolumeStats />
        </div>

        {/* Übungs-Analyse */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-2">🎯 Übungs-Analyse</h2>
          <p className="text-sm text-slate-500 mb-4">Detaillierte Statistiken</p>
          <ExerciseComparisonChart />
        </div>

        {/* Keine Daten */}
        {workoutSessions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Keine Daten vorhanden</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Schließe dein erstes Training ab, um hier deine Fortschritte zu sehen.
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <GlobalSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </DashboardLayout>
  );
}
