'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { format } from 'date-fns';
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
  help: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

// Calculate estimated 1RM using Epley formula
const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
};

// Chart colors
const chartColors = [
  { stroke: '#6366f1', bg: 'bg-primary-500', light: 'bg-primary-100', text: 'text-primary-600' },
  { stroke: '#10b981', bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-600' },
  { stroke: '#f59e0b', bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600' },
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, metricType }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 min-w-[160px] animate-scale-in">
        <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0]?.payload?.fullDate || label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 truncate max-w-[100px]">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{entry.value} kg</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
          {metricType === '1rm' ? 'Geschätztes 1RM' : 'Max. Gewicht'}
        </p>
      </div>
    );
  }
  return null;
};

export function ExerciseComparisonChart() {
  const { workoutSessions } = useWorkoutStore();
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [metricType, setMetricType] = useState<'maxWeight' | '1rm'>('maxWeight');

  const trainedExercises = useMemo(() => {
    const exerciseIds = new Set<string>();
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        exerciseIds.add(ex.exerciseId);
      });
    });
    return Array.from(exerciseIds).map(id => {
      const exercise = exerciseDatabase.find(ex => ex.id === id);
      return { id, name: exercise?.name || id };
    });
  }, [workoutSessions]);

  const generateProgressData = useMemo(() => {
    if (selectedExercises.length === 0) return [];

    const relevantSessions = workoutSessions
      .filter(session => 
        session.exercises.some(ex => selectedExercises.includes(ex.exerciseId))
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const sessionData = relevantSessions.map(session => {
      const sessionDate = new Date(session.startTime);
      const dateLabel = format(sessionDate, 'dd.MM', { locale: de });

      const dataPoint: Record<string, string | Date | number> = { 
        date: dateLabel, 
        sessionDate,
        fullDate: format(sessionDate, 'dd.MM.yyyy', { locale: de })
      };

      selectedExercises.forEach(exId => {
        const exercise = trainedExercises.find(e => e.id === exId);
        const exerciseName = exercise?.name || exId;
        
        const sessionExercise = session.exercises.find(ex => ex.exerciseId === exId);
        if (sessionExercise) {
          const validSets = sessionExercise.sets.filter(s => s.completed && s.weight > 0);
          if (validSets.length > 0) {
            if (metricType === 'maxWeight') {
              const maxWeight = Math.max(...validSets.map(s => s.weight));
              dataPoint[exerciseName] = maxWeight;
            } else {
              const best1RM = Math.max(...validSets.map(s => calculate1RM(s.weight, s.reps)));
              dataPoint[exerciseName] = best1RM;
            }
          }
        }
      });

      return dataPoint;
    });

    return sessionData.slice(-15);
  }, [workoutSessions, selectedExercises, trainedExercises, metricType]);

  const handleToggleExercise = (exerciseId: string) => {
    if (selectedExercises.includes(exerciseId)) {
      setSelectedExercises(selectedExercises.filter((id) => id !== exerciseId));
    } else {
      if (selectedExercises.length < 3) {
        setSelectedExercises([...selectedExercises, exerciseId]);
      }
    }
  };

  if (trainedExercises.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-300">
            {Icons.chart}
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">Noch keine Daten</p>
          <p className="text-sm text-gray-500">Trainiere Übungen, um Fortschritte zu sehen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Type Selector & Info */}
      <div className="flex items-center justify-between">
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setMetricType('maxWeight')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metricType === 'maxWeight'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Max. Gewicht
          </button>
          <button
            onClick={() => setMetricType('1rm')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metricType === '1rm'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Geschätztes 1RM
          </button>
        </div>
        <button
          onClick={() => setShowInfo(true)}
          className="p-2.5 rounded-xl bg-white/60 border border-gray-100 text-gray-400 hover:text-primary-500 hover:border-primary-200 transition-all"
          title="Info"
        >
          {Icons.help}
        </button>
      </div>

      {/* Exercise Selector */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-3">
          Übungen auswählen <span className="text-gray-400">(max. 3)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {trainedExercises.map((exercise, index) => {
            const isSelected = selectedExercises.includes(exercise.id);
            const selectionIndex = selectedExercises.indexOf(exercise.id);
            const colorClass = selectionIndex >= 0 ? chartColors[selectionIndex] : null;
            
            return (
              <button
                key={exercise.id}
                onClick={() => handleToggleExercise(exercise.id)}
                disabled={!isSelected && selectedExercises.length >= 3}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isSelected
                    ? `${colorClass?.bg} text-white shadow-lg`
                    : 'bg-white/60 text-gray-700 border border-gray-100 hover:border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {isSelected && Icons.check}
                {exercise.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        {selectedExercises.length > 0 ? (
          generateProgressData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {chartColors.map((color, index) => (
                    <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color.stroke} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={color.stroke} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
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
                  label={{ value: 'kg', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#9ca3af' } }}
                />
                <Tooltip content={<CustomTooltip metricType={metricType} />} />
                {selectedExercises.map((exId, index) => {
                  const exercise = trainedExercises.find((ex) => ex.id === exId);
                  return (
                    <Line
                      key={exId}
                      type="monotone"
                      dataKey={exercise?.name || exId}
                      stroke={chartColors[index].stroke}
                      strokeWidth={2.5}
                      dot={{ fill: chartColors[index].stroke, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-gray-500">Nicht genug Daten für ausgewählte Übungen</p>
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-gray-500">Wähle mindestens eine Übung aus</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {selectedExercises.length > 0 && (
        <div className="flex items-center justify-center gap-6">
          {selectedExercises.map((exId, index) => {
            const exercise = trainedExercises.find((ex) => ex.id === exId);
            return (
              <div key={exId} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${chartColors[index].bg}`} />
                <span className="text-sm text-gray-600">{exercise?.name}</span>
              </div>
            );
          })}
        </div>
      )}

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
                <h3 className="font-bold text-gray-900">Leistungsentwicklung</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                {Icons.close}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Max. Gewicht</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Zeigt das höchste Gewicht, das du bei jeder Trainingseinheit für diese Übung 
                  verwendet hast. Ideal um deinen Kraftfortschritt zu tracken.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">💪 Geschätztes 1RM</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Das 1RM (One-Rep-Maximum) ist das geschätzte Maximalgewicht, das du einmal 
                  heben könntest. Berechnung mit Epley-Formel:
                </p>
                <div className="mt-3 p-3 rounded-lg bg-primary-50 border border-primary-100 text-center">
                  <code className="text-sm font-mono text-primary-700">1RM = Gewicht × (1 + Wdh / 30)</code>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Das 1RM ist aussagekräftiger, da es Gewicht UND Wiederholungen berücksichtigt.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100">
                <h4 className="font-semibold text-gray-900 mb-3">💡 Tipps</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    Vergleiche ähnliche Übungen (z.B. alle Drückübungen)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    Achte auf konstanten Fortschritt über Zeit
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    Sätze mit 0 kg werden ignoriert
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
