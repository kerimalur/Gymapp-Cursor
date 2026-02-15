'use client';

import { useMemo, useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { getMuscleInvolvement } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle, AlertCircle, XCircle, Settings, X } from 'lucide-react';

// Recommended training frequency per week
const RECOMMENDED_FREQUENCY: Record<MuscleGroup, number> = {
  chest: 2,
  back: 2,
  shoulders: 2,
  biceps: 2,
  triceps: 2,
  forearms: 2,
  abs: 3,
  quadriceps: 2,
  hamstrings: 2,
  calves: 2,
  glutes: 2,
  traps: 2,
  lats: 2,
  adductors: 2,
  abductors: 2,
  lower_back: 2,
  neck: 2,
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  forearms: 'Unterarme',
  abs: 'Bauch',
  quadriceps: 'Quadrizeps',
  hamstrings: 'Beinbeuger',
  calves: 'Waden',
  glutes: 'Gesäß',
  traps: 'Trapez',
  lats: 'Latissimus',
  adductors: 'Adduktoren',
  abductors: 'Abduktoren',
  lower_back: 'Unterer Rücken',
  neck: 'Nacken',
};

const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'quadriceps', 'hamstrings', 'calves', 'glutes', 'traps', 'lats',
  'adductors', 'abductors', 'lower_back', 'neck'
];

interface FrequencyData {
  muscle: MuscleGroup;
  label: string;
  thisWeek: number;
  lastWeek: number;
  recommended: number;
  trend: 'up' | 'down' | 'same';
  status: 'optimal' | 'low' | 'undertrained';
}

export function TrainingFrequencyAnalysis() {
  const { workoutSessions } = useWorkoutStore();
  const { trackingSettings, toggleMuscle } = useNutritionStore();
  const [showSettings, setShowSettings] = useState(false);
  
  const enabledMuscles = trackingSettings?.enabledMuscles || ALL_MUSCLES;

  const frequencyData = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { locale: de, weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { locale: de, weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    // Track unique training days per muscle per week
    const thisWeekDays: Record<MuscleGroup, Set<string>> = {} as any;
    const lastWeekDays: Record<MuscleGroup, Set<string>> = {} as any;

    ALL_MUSCLES.forEach(muscle => {
      thisWeekDays[muscle] = new Set();
      lastWeekDays[muscle] = new Set();
    });

    // Process sessions
    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const dateKey = format(sessionDate, 'yyyy-MM-dd');
      const isThisWeek = isWithinInterval(sessionDate, { start: thisWeekStart, end: thisWeekEnd });
      const isLastWeek = isWithinInterval(sessionDate, { start: lastWeekStart, end: lastWeekEnd });

      if (!isThisWeek && !isLastWeek) return;

      const targetDays = isThisWeek ? thisWeekDays : lastWeekDays;

      // Get unique muscles trained this session (only count primary)
      const musclesTrained = new Set<MuscleGroup>();
      
      session.exercises.forEach(ex => {
        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0).length;
        if (completedSets === 0) return;

        const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
        
        // Count primary muscles as trained
        muscleInvolvement
          .filter(m => m.role === 'primary')
          .forEach(({ muscle }) => musclesTrained.add(muscle));
      });

      // Add this day to each muscle that was trained
      musclesTrained.forEach(muscle => {
        targetDays[muscle].add(dateKey);
      });
    });

    // Calculate frequency data - only for enabled muscles
    const data: FrequencyData[] = enabledMuscles.map(muscle => {
      const thisWeek = thisWeekDays[muscle].size;
      const lastWeek = lastWeekDays[muscle].size;
      const recommended = RECOMMENDED_FREQUENCY[muscle];

      let trend: FrequencyData['trend'] = 'same';
      if (thisWeek > lastWeek) trend = 'up';
      else if (thisWeek < lastWeek) trend = 'down';

      let status: FrequencyData['status'];
      if (thisWeek >= recommended) {
        status = 'optimal';
      } else if (thisWeek >= recommended - 1) {
        status = 'low';
      } else {
        status = 'undertrained';
      }

      return {
        muscle,
        label: MUSCLE_LABELS[muscle],
        thisWeek,
        lastWeek,
        recommended,
        trend,
        status,
      };
    });

    // Sort: undertrained first, then by this week frequency
    return data.sort((a, b) => {
      const statusOrder = { undertrained: 0, low: 1, optimal: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.thisWeek - a.thisWeek;
    });
  }, [workoutSessions, enabledMuscles]);

  const statusCounts = useMemo(() => ({
    optimal: frequencyData.filter(d => d.status === 'optimal').length,
    low: frequencyData.filter(d => d.status === 'low').length,
    undertrained: frequencyData.filter(d => d.status === 'undertrained').length,
  }), [frequencyData]);

  const getStatusIcon = (status: FrequencyData['status']) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'low':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'undertrained':
        return <XCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  const getStatusBg = (status: FrequencyData['status']) => {
    switch (status) {
      case 'optimal': return 'bg-emerald-50 border-emerald-200';
      case 'low': return 'bg-amber-50 border-amber-200';
      case 'undertrained': return 'bg-rose-50 border-rose-200';
    }
  };

  return (
    <div>
      {/* Header with Settings Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {enabledMuscles.length} von {ALL_MUSCLES.length} Muskeln aktiv
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Einstellungen"
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-emerald-50 rounded-xl">
          <p className="text-2xl font-bold text-emerald-600">{statusCounts.optimal}</p>
          <p className="text-xs text-emerald-700">Optimal (≥2×)</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl">
          <p className="text-2xl font-bold text-amber-600">{statusCounts.low}</p>
          <p className="text-xs text-amber-700">Niedrig (1×)</p>
        </div>
        <div className="text-center p-3 bg-rose-50 rounded-xl">
          <p className="text-2xl font-bold text-rose-600">{statusCounts.undertrained}</p>
          <p className="text-xs text-rose-700">Untrainiert (0×)</p>
        </div>
      </div>

      {/* Frequency Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2">
        {frequencyData.map((data) => (
          <div 
            key={data.muscle}
            className={`p-3 rounded-xl border ${getStatusBg(data.status)} transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{data.label}</span>
              {getStatusIcon(data.status)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{data.thisWeek}</span>
              <span className="text-sm text-slate-500">/ {data.recommended}×</span>
            </div>
            {data.lastWeek !== data.thisWeek && (
              <p className={`text-xs mt-1 ${data.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.trend === 'up' ? '↑' : '↓'} Letzte Woche: {data.lastWeek}×
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      {statusCounts.undertrained > 0 && (
        <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-200">
          <p className="text-sm text-rose-700">
            <strong>{statusCounts.undertrained} Muskelgruppe(n)</strong> wurden diese Woche noch nicht trainiert. 
            Für optimale Ergebnisse trainiere jede Muskelgruppe mindestens 2× pro Woche.
          </p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Muskelgruppen auswählen</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-500 mb-4">
                Wähle aus, welche Muskelgruppen in der Frequenzanalyse berücksichtigt werden sollen.
                Deaktiviere Muskeln, die du nicht direkt trainierst.
              </p>
              
              <div className="space-y-2">
                {ALL_MUSCLES.map(muscle => {
                  const isEnabled = enabledMuscles.includes(muscle);
                  return (
                    <button
                      key={muscle}
                      onClick={() => toggleMuscle(muscle)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isEnabled 
                          ? 'bg-primary-50 border-primary-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className={`font-medium ${isEnabled ? 'text-primary-700' : 'text-gray-500'}`}>
                        {MUSCLE_LABELS[muscle]}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isEnabled 
                          ? 'bg-primary-500 border-primary-500' 
                          : 'border-gray-300'
                      }`}>
                        {isEnabled && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  ALL_MUSCLES.forEach(m => {
                    if (!enabledMuscles.includes(m)) toggleMuscle(m);
                  });
                }}
                className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Alle aktivieren
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 px-4 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
