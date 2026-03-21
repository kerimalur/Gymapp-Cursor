'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { getMuscleInvolvement } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Flame, Clock, CheckCircle, AlertTriangle, Minus, X } from 'lucide-react';

// Muscle labels in German
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
  glutes: 'Gesäss',
  traps: 'Trapez',
  lats: 'Latissimus',
  adductors: 'Adduktoren',
  abductors: 'Abduktoren',
  lower_back: 'Unterer Rücken',
  neck: 'Nacken',
};

// Muscle colors
const MUSCLE_COLORS: Record<MuscleGroup, { light: string; dark: string; gradient: string }> = {
  chest: { light: 'bg-blue-100', dark: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
  back: { light: 'bg-emerald-100', dark: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600' },
  shoulders: { light: 'bg-amber-100', dark: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600' },
  biceps: { light: 'bg-violet-100', dark: 'bg-violet-500', gradient: 'from-violet-400 to-violet-600' },
  triceps: { light: 'bg-purple-100', dark: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
  forearms: { light: 'bg-fuchsia-100', dark: 'bg-fuchsia-500', gradient: 'from-fuchsia-400 to-fuchsia-600' },
  abs: { light: 'bg-cyan-100', dark: 'bg-cyan-500', gradient: 'from-cyan-400 to-cyan-600' },
  quadriceps: { light: 'bg-rose-100', dark: 'bg-rose-500', gradient: 'from-rose-400 to-rose-600' },
  hamstrings: { light: 'bg-orange-100', dark: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600' },
  calves: { light: 'bg-pink-100', dark: 'bg-pink-500', gradient: 'from-pink-400 to-pink-600' },
  glutes: { light: 'bg-red-100', dark: 'bg-red-500', gradient: 'from-red-400 to-red-600' },
  traps: { light: 'bg-teal-100', dark: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600' },
  lats: { light: 'bg-green-100', dark: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
  adductors: { light: 'bg-indigo-100', dark: 'bg-indigo-500', gradient: 'from-indigo-400 to-indigo-600' },
  abductors: { light: 'bg-sky-100', dark: 'bg-sky-500', gradient: 'from-sky-400 to-sky-600' },
  lower_back: { light: 'bg-lime-100', dark: 'bg-lime-500', gradient: 'from-lime-400 to-lime-600' },
  neck: { light: 'bg-stone-100', dark: 'bg-stone-500', gradient: 'from-stone-400 to-stone-600' },
};

interface MuscleData {
  muscle: MuscleGroup;
  label: string;
  sets: number;
  lastTrained: Date | null;
  daysSince: number | null;
  status: 'fresh' | 'recovering' | 'ready' | 'overdue' | 'never';
}

export function ModernMuscleHeatmap() {
  const { workoutSessions } = useWorkoutStore();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const muscleData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const data: MuscleData[] = [];
    
    // Initialize all muscles
    (Object.keys(MUSCLE_LABELS) as MuscleGroup[]).forEach(muscle => {
      data.push({
        muscle,
        label: MUSCLE_LABELS[muscle],
        sets: 0,
        lastTrained: null,
        daysSince: null,
        status: 'never',
      });
    });

    // Process workout sessions
    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const isRecent = sessionDate >= sevenDaysAgo;

      session.exercises.forEach(ex => {
        // Only count completed sets with weight > 0
        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0).length;
        if (completedSets === 0) return;

        const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
        muscleInvolvement.forEach(({ muscle, role }) => {
          const muscleEntry = data.find(d => d.muscle === muscle);
          if (muscleEntry) {
            // Update last trained
            if (!muscleEntry.lastTrained || sessionDate > muscleEntry.lastTrained) {
              muscleEntry.lastTrained = sessionDate;
            }
            // Count sets from last 7 days
            if (isRecent) {
              muscleEntry.sets += role === 'primary' ? completedSets : Math.round(completedSets * 0.5);
            }
          }
        });
      });
    });

    // Calculate status for each muscle
    data.forEach(muscle => {
      if (muscle.lastTrained) {
        muscle.daysSince = differenceInDays(now, muscle.lastTrained);
        
        if (muscle.daysSince === 0) {
          muscle.status = 'fresh';
        } else if (muscle.daysSince <= 2) {
          muscle.status = 'recovering';
        } else if (muscle.daysSince <= 5) {
          muscle.status = 'ready';
        } else {
          muscle.status = 'overdue';
        }
      }
    });

    // Sort by sets (descending)
    return data.sort((a, b) => b.sets - a.sets);
  }, [workoutSessions]);

  const getStatusInfo = (status: MuscleData['status']) => {
    switch (status) {
      case 'fresh': return { text: 'Heute trainiert', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: Flame };
      case 'recovering': return { text: 'Regeneration', color: 'text-amber-400', bg: 'bg-amber-500', icon: Clock };
      case 'ready': return { text: 'Bereit', color: 'text-cyan-400', bg: 'bg-cyan-500', icon: CheckCircle };
      case 'overdue': return { text: 'Überfällig', color: 'text-rose-400', bg: 'bg-rose-500', icon: AlertTriangle };
      case 'never': return { text: 'Nie trainiert', color: 'text-[hsl(var(--fg-subtle))]', bg: 'bg-[hsl(var(--fg-subtle))]', icon: Minus };
    }
  };

  const getIntensityClass = (sets: number) => {
    if (sets === 0) return 'opacity-20';
    if (sets <= 5) return 'opacity-40';
    if (sets <= 10) return 'opacity-60';
    if (sets <= 20) return 'opacity-80';
    return 'opacity-100';
  };

  // Group muscles by body part
  const upperBody = muscleData.filter(m => 
    ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'traps', 'lats'].includes(m.muscle)
  );
  const core = muscleData.filter(m => ['abs'].includes(m.muscle));
  const lowerBody = muscleData.filter(m => 
    ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m.muscle)
  );

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-[hsl(var(--bg-tertiary))] rounded-xl" />
      </div>
    );
  }

  const selectedData = selectedMuscle ? muscleData.find(m => m.muscle === selectedMuscle) : null;

  return (
    <div className="space-y-6">
      {/* Status Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {(['fresh', 'recovering', 'ready', 'overdue'] as const).map(status => {
          const info = getStatusInfo(status);
          const StatusIcon = info.icon;
          return (
            <div key={status} className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--bg-tertiary))] rounded-full border border-[hsl(var(--border-light))]">
              <StatusIcon className={`w-3 h-3 ${info.color}`} />
              <span className="text-xs font-medium text-[hsl(var(--fg-secondary))]">{info.text}</span>
            </div>
          );
        })}
      </div>

      {/* Muscle Grid */}
      <div className="space-y-4">
        {/* Upper Body */}
        <div>
          <h4 className="text-xs font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wider mb-3">Oberkörper</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {upperBody.map((muscle, i) => {
              const statusInfo = getStatusInfo(muscle.status);
              const StatusIcon = statusInfo.icon;
              const isSelected = selectedMuscle === muscle.muscle;
              
              return (
                <button
                  key={muscle.muscle}
                  onClick={() => setSelectedMuscle(isSelected ? null : muscle.muscle)}
                  className={`
                    relative p-4 rounded-xl transition-all duration-300 text-left border
                    ${isSelected ? 'ring-2 ring-cyan-500 shadow-lg scale-[1.02] border-cyan-500/30' : 'hover:shadow-md hover:scale-[1.01] border-[hsl(var(--border-light))]'}
                    ${muscle.sets > 0 ? 'bg-[hsl(var(--bg-elevated))]' : 'bg-[hsl(var(--bg-card))] opacity-60'}
                  `}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[hsl(var(--fg-primary))] font-bold text-sm">{muscle.label}</span>
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                    </div>
                    <p className="text-[hsl(var(--fg-muted))] text-xs">{muscle.sets} Sätze</p>
                    {muscle.daysSince !== null && muscle.daysSince > 0 && (
                      <p className="text-[hsl(var(--fg-subtle))] text-xs mt-1">vor {muscle.daysSince}d</p>
                    )}
                  </div>
                  {muscle.sets > 0 && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${
                      muscle.status === 'fresh' ? 'bg-emerald-500' :
                      muscle.status === 'recovering' ? 'bg-amber-500' :
                      muscle.status === 'ready' ? 'bg-cyan-500' :
                      'bg-rose-500'
                    }`} style={{ opacity: Math.min(1, muscle.sets / 15) }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Core */}
        <div>
          <h4 className="text-xs font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wider mb-3">Core</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {core.map((muscle, i) => {
              const statusInfo = getStatusInfo(muscle.status);
              const StatusIcon = statusInfo.icon;
              const isSelected = selectedMuscle === muscle.muscle;
              
              return (
                <button
                  key={muscle.muscle}
                  onClick={() => setSelectedMuscle(isSelected ? null : muscle.muscle)}
                  className={`
                    relative p-4 rounded-xl transition-all duration-300 text-left border
                    ${isSelected ? 'ring-2 ring-cyan-500 shadow-lg scale-[1.02] border-cyan-500/30' : 'hover:shadow-md hover:scale-[1.01] border-[hsl(var(--border-light))]'}
                    ${muscle.sets > 0 ? 'bg-[hsl(var(--bg-elevated))]' : 'bg-[hsl(var(--bg-card))] opacity-60'}
                  `}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[hsl(var(--fg-primary))] font-bold text-sm">{muscle.label}</span>
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                    </div>
                    <p className="text-[hsl(var(--fg-muted))] text-xs">{muscle.sets} Sätze</p>
                    {muscle.daysSince !== null && muscle.daysSince > 0 && (
                      <p className="text-[hsl(var(--fg-subtle))] text-xs mt-1">vor {muscle.daysSince}d</p>
                    )}
                  </div>
                  {muscle.sets > 0 && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${
                      muscle.status === 'fresh' ? 'bg-emerald-500' :
                      muscle.status === 'recovering' ? 'bg-amber-500' :
                      muscle.status === 'ready' ? 'bg-cyan-500' :
                      'bg-rose-500'
                    }`} style={{ opacity: Math.min(1, muscle.sets / 15) }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lower Body */}
        <div>
          <h4 className="text-xs font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wider mb-3">Unterkörper</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {lowerBody.map((muscle, i) => {
              const statusInfo = getStatusInfo(muscle.status);
              const StatusIcon = statusInfo.icon;
              const isSelected = selectedMuscle === muscle.muscle;
              
              return (
                <button
                  key={muscle.muscle}
                  onClick={() => setSelectedMuscle(isSelected ? null : muscle.muscle)}
                  className={`
                    relative p-4 rounded-xl transition-all duration-300 text-left border
                    ${isSelected ? 'ring-2 ring-cyan-500 shadow-lg scale-[1.02] border-cyan-500/30' : 'hover:shadow-md hover:scale-[1.01] border-[hsl(var(--border-light))]'}
                    ${muscle.sets > 0 ? 'bg-[hsl(var(--bg-elevated))]' : 'bg-[hsl(var(--bg-card))] opacity-60'}
                  `}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[hsl(var(--fg-primary))] font-bold text-sm">{muscle.label}</span>
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                    </div>
                    <p className="text-[hsl(var(--fg-muted))] text-xs">{muscle.sets} Sätze</p>
                    {muscle.daysSince !== null && muscle.daysSince > 0 && (
                      <p className="text-[hsl(var(--fg-subtle))] text-xs mt-1">vor {muscle.daysSince}d</p>
                    )}
                  </div>
                  {muscle.sets > 0 && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${
                      muscle.status === 'fresh' ? 'bg-emerald-500' :
                      muscle.status === 'recovering' ? 'bg-amber-500' :
                      muscle.status === 'ready' ? 'bg-cyan-500' :
                      'bg-rose-500'
                    }`} style={{ opacity: Math.min(1, muscle.sets / 15) }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Muscle Detail */}
      {selectedData && (() => {
        const statusInfo = getStatusInfo(selectedData.status);
        const StatusIcon = statusInfo.icon;
        return (
          <div className="animate-fade-in bg-[hsl(var(--bg-elevated))] rounded-xl p-5 border border-[hsl(var(--border-default))]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  selectedData.status === 'fresh' ? 'bg-emerald-500' :
                  selectedData.status === 'recovering' ? 'bg-amber-500' :
                  selectedData.status === 'ready' ? 'bg-cyan-500' :
                  selectedData.status === 'overdue' ? 'bg-rose-500' : 'bg-[hsl(var(--fg-subtle))]'
                }`} />
                <h4 className="font-bold text-[hsl(var(--fg-primary))]">{selectedData.label}</h4>
              </div>
              <button 
                onClick={() => setSelectedMuscle(null)}
                className="text-[hsl(var(--fg-subtle))] hover:text-[hsl(var(--fg-secondary))] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-[hsl(var(--bg-card))] rounded-xl border border-[hsl(var(--border-light))]">
                <p className="text-2xl font-bold text-[hsl(var(--fg-primary))]">{selectedData.sets}</p>
                <p className="text-xs text-[hsl(var(--fg-muted))]">Sätze (7 Tage)</p>
              </div>
              <div className="text-center p-3 bg-[hsl(var(--bg-card))] rounded-xl border border-[hsl(var(--border-light))]">
                <p className="text-2xl font-bold text-[hsl(var(--fg-primary))]">
                  {selectedData.daysSince !== null ? selectedData.daysSince : '-'}
                </p>
                <p className="text-xs text-[hsl(var(--fg-muted))]">Tage seit Training</p>
              </div>
              <div className="text-center p-3 bg-[hsl(var(--bg-card))] rounded-xl border border-[hsl(var(--border-light))]">
                <StatusIcon className={`w-5 h-5 mx-auto mb-1 ${statusInfo.color}`} />
                <p className={`text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </p>
              </div>
            </div>

            {selectedData.lastTrained && (
              <p className="text-sm text-[hsl(var(--fg-muted))] mt-4 text-center">
                Zuletzt trainiert: {format(selectedData.lastTrained, 'EEEE, d. MMMM', { locale: de })}
              </p>
            )}
          </div>
        );
      })()}

      {/* Intensity Legend */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <span className="text-xs text-[hsl(var(--fg-subtle))]">Intensität:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded bg-cyan-500 opacity-20" />
          <div className="w-6 h-3 rounded bg-cyan-500 opacity-40" />
          <div className="w-6 h-3 rounded bg-cyan-500 opacity-60" />
          <div className="w-6 h-3 rounded bg-cyan-500 opacity-80" />
          <div className="w-6 h-3 rounded bg-cyan-500 opacity-100" />
        </div>
        <span className="text-xs text-[hsl(var(--fg-subtle))]">mehr Sätze →</span>
      </div>
    </div>
  );
}
