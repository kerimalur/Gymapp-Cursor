'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MuscleBalanceChart } from '@/components/statistics/MuscleBalanceChart';
import { TrainingFrequencyAnalysis } from '@/components/statistics/TrainingFrequencyAnalysis';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Scale, Calendar, Activity, TrendingUp } from 'lucide-react';

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color = 'blue'
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'blue' | 'emerald' | 'violet' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
    orange: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

export default function MuscleBalancePage() {
  const { workoutSessions } = useWorkoutStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  // Calculate muscle stats
  const muscleStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: de, weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { locale: de, weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let filteredSessions = workoutSessions;
    if (timeRange === 'week') {
      filteredSessions = workoutSessions.filter(session =>
        isWithinInterval(new Date(session.startTime), { start: weekStart, end: weekEnd })
      );
    } else if (timeRange === 'month') {
      filteredSessions = workoutSessions.filter(session =>
        isWithinInterval(new Date(session.startTime), { start: monthStart, end: monthEnd })
      );
    }

    // Map to German muscle names and main categories
    const muscleNameMap: Record<string, string> = {
      chest: 'Brust',
      back: 'Rücken',
      lats: 'Rücken',
      traps: 'Rücken',
      shoulders: 'Schultern',
      biceps: 'Bizeps',
      triceps: 'Trizeps',
      forearms: 'Unterarme',
      quadriceps: 'Beine',
      hamstrings: 'Beine',
      calves: 'Beine',
      glutes: 'Beine',
      abs: 'Core',
    };
    
    // Only count main muscles (Brust, Rücken, Schultern, Beine, Core)
    const mainMuscles = ['Brust', 'Rücken', 'Schultern', 'Beine', 'Core'];
    
    // Count muscle groups trained - only PRIMARY muscle
    const muscleVolume: Record<string, number> = {};
    const muscleTrainingDays: Record<string, Set<string>> = {};
    
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.startTime).toDateString();
      session.exercises.forEach(ex => {
        // Get muscle groups from exercise database
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        const completedSets = ex.sets.filter(s => s.completed).length;
        
        // Only count the PRIMARY muscle (first in list)
        if (exerciseData?.muscleGroups && exerciseData.muscleGroups.length > 0 && completedSets > 0) {
          const primaryMuscle = exerciseData.muscleGroups[0];
          const muscleGerman = muscleNameMap[primaryMuscle] || primaryMuscle;
          
          muscleVolume[muscleGerman] = (muscleVolume[muscleGerman] || 0) + completedSets;
          if (!muscleTrainingDays[muscleGerman]) {
            muscleTrainingDays[muscleGerman] = new Set();
          }
          muscleTrainingDays[muscleGerman].add(sessionDate);
        }
      });
    });

    const totalSets = Object.values(muscleVolume).reduce((a, b) => a + b, 0);
    const muscleCount = Object.keys(muscleVolume).length;
    const avgSetsPerMuscle = muscleCount > 0 ? Math.round(totalSets / muscleCount) : 0;
    
    // Find most and least trained muscle - only from main muscle groups
    const mainMuscleVolume = Object.entries(muscleVolume)
      .filter(([muscle]) => mainMuscles.includes(muscle));
    const sortedMuscles = mainMuscleVolume.sort((a, b) => b[1] - a[1]);
    const mostTrained = sortedMuscles[0]?.[0] || '-';
    // For "needs attention", find the main muscle with lowest volume (or not trained at all)
    const leastTrainedFromData = sortedMuscles[sortedMuscles.length - 1]?.[0];
    // Check if any main muscle has 0 sets
    const untrainedMuscles = mainMuscles.filter(m => !muscleVolume[m] || muscleVolume[m] === 0);
    const leastTrained = untrainedMuscles.length > 0 ? untrainedMuscles[0] : (leastTrainedFromData || '-');

    return {
      totalSets,
      muscleCount,
      avgSetsPerMuscle,
      mostTrained,
      leastTrained,
      workoutCount: filteredSessions.length,
    };
  }, [workoutSessions, timeRange]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">⚖️ Muskelbalance</h1>
              <p className="text-slate-500 mt-1">Analysiere deine Trainingsverteilung</p>
            </div>
            {/* Time Range Filter */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              {[
                { key: 'week', label: 'Woche' },
                { key: 'month', label: 'Monat' },
                { key: 'all', label: 'Gesamt' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key as typeof timeRange)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === key
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard
            icon={Activity}
            label="Trainings"
            value={muscleStats.workoutCount}
            subValue={timeRange === 'week' ? 'Diese Woche' : timeRange === 'month' ? 'Diesen Monat' : 'Gesamt'}
            color="blue"
          />
          <StatCard
            icon={Scale}
            label="Sätze gesamt"
            value={muscleStats.totalSets}
            color="emerald"
          />
        </div>

        {/* Most/Least Trained Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💪</span>
              <div>
                <p className="text-sm text-emerald-600 font-medium">Am meisten trainiert</p>
                <p className="text-xl font-bold text-emerald-800">{muscleStats.mostTrained}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm text-orange-600 font-medium">Braucht mehr Aufmerksamkeit</p>
                <p className="text-xl font-bold text-orange-800">{muscleStats.leastTrained}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Muscle Balance Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">📊 Volumen pro Muskelgruppe</h2>
            <p className="text-sm text-slate-500 mb-6">Verteilung der Sätze auf Muskelgruppen</p>
            <MuscleBalanceChart />
          </div>

          {/* Training Frequency */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">📅 Trainingsfrequenz</h2>
            <p className="text-sm text-slate-500 mb-6">Trainingstage pro Muskelgruppe</p>
            <TrainingFrequencyAnalysis />
          </div>
        </div>

        {/* No Data State */}
        {workoutSessions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mt-8">
            <div className="text-6xl mb-4">⚖️</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Keine Daten vorhanden</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Schließe dein erstes Training ab, um hier deine Muskelbalance zu sehen.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
