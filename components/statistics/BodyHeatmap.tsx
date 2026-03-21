'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { getMuscleInvolvement } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { de } from 'date-fns/locale';

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

interface MuscleData {
  muscle: MuscleGroup;
  sets: number;
  lastTrained: Date | null;
  daysSince: number | null;
}

export function BodyHeatmap() {
  const { workoutSessions } = useWorkoutStore();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate muscle data from workout sessions - ONLY completed sets with weight > 0
  const muscleData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const data: Record<MuscleGroup, MuscleData> = {} as Record<MuscleGroup, MuscleData>;
    
    // Initialize all muscles
    (Object.keys(MUSCLE_LABELS) as MuscleGroup[]).forEach(muscle => {
      data[muscle] = {
        muscle,
        sets: 0,
        lastTrained: null,
        daysSince: null,
      };
    });

    // Process workout sessions - only count completed sets with weight > 0
    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const isRecent = sessionDate >= sevenDaysAgo;

      session.exercises.forEach(ex => {
        // IMPORTANT: Only count completed sets with weight > 0
        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0).length;
        if (completedSets === 0) return;

        const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
        muscleInvolvement.forEach(({ muscle, role }) => {
          if (data[muscle]) {
            // Update last trained
            if (!data[muscle].lastTrained || sessionDate > data[muscle].lastTrained) {
              data[muscle].lastTrained = sessionDate;
            }
            // Count sets from last 7 days (primary = full, secondary = half)
            if (isRecent) {
              data[muscle].sets += role === 'primary' ? completedSets : Math.round(completedSets * 0.5);
            }
          }
        });
      });
    });

    // Calculate days since for each muscle
    (Object.keys(data) as MuscleGroup[]).forEach(muscle => {
      if (data[muscle].lastTrained) {
        data[muscle].daysSince = differenceInDays(now, data[muscle].lastTrained);
      }
    });

    return data;
  }, [workoutSessions]);

  // Get intensity color based on sets (0-100 scale)
  const getIntensityColor = (muscle: MuscleGroup): string => {
    const sets = muscleData[muscle]?.sets || 0;
    const maxSets = Math.max(...Object.values(muscleData).map(m => m.sets), 1);
    const intensity = (sets / maxSets) * 100;
    
    if (sets === 0) return 'hsl(225,12%,20%)'; // dark neutral
    if (intensity <= 20) return '#67e8f9'; // cyan-300
    if (intensity <= 40) return '#22d3ee'; // cyan-400
    if (intensity <= 60) return '#06b6d4'; // cyan-500
    if (intensity <= 80) return '#0891b2'; // cyan-600
    return '#0e7490'; // cyan-700
  };

  const getOpacity = (muscle: MuscleGroup): number => {
    const isHovered = hoveredMuscle === muscle;
    const isSelected = selectedMuscle === muscle;
    if (isSelected) return 1;
    if (isHovered) return 0.9;
    return 0.75;
  };

  const getStroke = (muscle: MuscleGroup): { color: string; width: number } => {
    const isSelected = selectedMuscle === muscle;
    return {
      color: isSelected ? '#22d3ee' : 'hsl(225,10%,25%)',
      width: isSelected ? 3 : 1
    };
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    setSelectedMuscle(selectedMuscle === muscle ? null : muscle);
  };

  const selectedData = selectedMuscle ? muscleData[selectedMuscle] : null;

  if (!mounted) {
    return <div className="animate-pulse h-[500px] bg-[hsl(225,12%,15%)] rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-[hsl(225,12%,15%)] rounded-xl p-1">
          <button
            onClick={() => setView('front')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'front' 
                ? 'bg-[hsl(225,14%,10%)] text-[hsl(var(--fg-primary))] shadow-sm' 
                : 'text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))]'
            }`}
          >
            Vorne
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'back' 
                ? 'bg-[hsl(225,14%,10%)] text-[hsl(var(--fg-primary))] shadow-sm' 
                : 'text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))]'
            }`}
          >
            Hinten
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* SVG Body - maximized for mobile */}
        <div className="flex justify-center">
          <svg viewBox="0 0 200 400" className="w-full max-w-[300px] sm:max-w-[260px] h-auto">
            <defs>
              <filter id="bodyShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
              </filter>
            </defs>
            
            {view === 'front' ? (
              <>
                {/* Head */}
                <ellipse cx="100" cy="28" rx="22" ry="26" fill="hsl(225,12%,20%)" stroke="hsl(225,10%,30%)" strokeWidth="1"/>
                
                {/* Neck */}
                <rect x="92" y="52" width="16" height="14" rx="3" fill="hsl(225,12%,20%)" stroke="hsl(225,10%,30%)" strokeWidth="0.5"/>
                
                {/* Shoulders */}
                <g
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('shoulders')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="60" cy="82" rx="18" ry="14" 
                    fill={getIntensityColor('shoulders')} 
                    opacity={getOpacity('shoulders')}
                    stroke={getStroke('shoulders').color}
                    strokeWidth={getStroke('shoulders').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="140" cy="82" rx="18" ry="14" 
                    fill={getIntensityColor('shoulders')} 
                    opacity={getOpacity('shoulders')}
                    stroke={getStroke('shoulders').color}
                    strokeWidth={getStroke('shoulders').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Chest */}
                <g
                  onMouseEnter={() => setHoveredMuscle('chest')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('chest')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 70 88 Q 100 82 130 88 L 126 128 Q 100 138 74 128 Z"
                    fill={getIntensityColor('chest')}
                    opacity={getOpacity('chest')}
                    stroke={getStroke('chest').color}
                    strokeWidth={getStroke('chest').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Abs */}
                <g
                  onMouseEnter={() => setHoveredMuscle('abs')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('abs')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 82 132 L 118 132 L 116 195 L 84 195 Z"
                    fill={getIntensityColor('abs')}
                    opacity={getOpacity('abs')}
                    stroke={getStroke('abs').color}
                    strokeWidth={getStroke('abs').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Biceps */}
                <g
                  onMouseEnter={() => setHoveredMuscle('biceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('biceps')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="46" cy="125" rx="10" ry="28" 
                    fill={getIntensityColor('biceps')} 
                    opacity={getOpacity('biceps')}
                    stroke={getStroke('biceps').color}
                    strokeWidth={getStroke('biceps').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="154" cy="125" rx="10" ry="28" 
                    fill={getIntensityColor('biceps')} 
                    opacity={getOpacity('biceps')}
                    stroke={getStroke('biceps').color}
                    strokeWidth={getStroke('biceps').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Forearms */}
                <g
                  onMouseEnter={() => setHoveredMuscle('forearms')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('forearms')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="40" cy="178" rx="8" ry="30" 
                    fill={getIntensityColor('forearms')} 
                    opacity={getOpacity('forearms')}
                    stroke={getStroke('forearms').color}
                    strokeWidth={getStroke('forearms').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="160" cy="178" rx="8" ry="30" 
                    fill={getIntensityColor('forearms')} 
                    opacity={getOpacity('forearms')}
                    stroke={getStroke('forearms').color}
                    strokeWidth={getStroke('forearms').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Quadriceps */}
                <g
                  onMouseEnter={() => setHoveredMuscle('quadriceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('quadriceps')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 78 200 L 92 200 L 88 290 L 72 290 Q 68 245 78 200"
                    fill={getIntensityColor('quadriceps')}
                    opacity={getOpacity('quadriceps')}
                    stroke={getStroke('quadriceps').color}
                    strokeWidth={getStroke('quadriceps').width}
                    filter="url(#bodyShadow)"
                  />
                  <path
                    d="M 122 200 L 108 200 L 112 290 L 128 290 Q 132 245 122 200"
                    fill={getIntensityColor('quadriceps')}
                    opacity={getOpacity('quadriceps')}
                    stroke={getStroke('quadriceps').color}
                    strokeWidth={getStroke('quadriceps').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Calves */}
                <g
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('calves')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="80" cy="335" rx="10" ry="32" 
                    fill={getIntensityColor('calves')} 
                    opacity={getOpacity('calves')}
                    stroke={getStroke('calves').color}
                    strokeWidth={getStroke('calves').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="120" cy="335" rx="10" ry="32" 
                    fill={getIntensityColor('calves')} 
                    opacity={getOpacity('calves')}
                    stroke={getStroke('calves').color}
                    strokeWidth={getStroke('calves').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
              </>
            ) : (
              <>
                {/* Head */}
                <ellipse cx="100" cy="28" rx="22" ry="26" fill="hsl(225,12%,20%)" stroke="hsl(225,10%,30%)" strokeWidth="1"/>
                
                {/* Neck */}
                <rect x="92" y="52" width="16" height="14" rx="3" fill="hsl(225,12%,20%)" stroke="hsl(225,10%,30%)" strokeWidth="0.5"/>
                
                {/* Traps */}
                <g
                  onMouseEnter={() => setHoveredMuscle('traps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('traps')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 75 62 Q 100 54 125 62 L 122 88 Q 100 92 78 88 Z"
                    fill={getIntensityColor('traps')}
                    opacity={getOpacity('traps')}
                    stroke={getStroke('traps').color}
                    strokeWidth={getStroke('traps').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Shoulders (back) */}
                <g
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('shoulders')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="60" cy="82" rx="18" ry="14" 
                    fill={getIntensityColor('shoulders')} 
                    opacity={getOpacity('shoulders')}
                    stroke={getStroke('shoulders').color}
                    strokeWidth={getStroke('shoulders').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="140" cy="82" rx="18" ry="14" 
                    fill={getIntensityColor('shoulders')} 
                    opacity={getOpacity('shoulders')}
                    stroke={getStroke('shoulders').color}
                    strokeWidth={getStroke('shoulders').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Lats */}
                <g
                  onMouseEnter={() => setHoveredMuscle('lats')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('lats')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 68 92 L 78 96 L 80 160 L 68 150 Q 58 125 68 92"
                    fill={getIntensityColor('lats')}
                    opacity={getOpacity('lats')}
                    stroke={getStroke('lats').color}
                    strokeWidth={getStroke('lats').width}
                    filter="url(#bodyShadow)"
                  />
                  <path
                    d="M 132 92 L 122 96 L 120 160 L 132 150 Q 142 125 132 92"
                    fill={getIntensityColor('lats')}
                    opacity={getOpacity('lats')}
                    stroke={getStroke('lats').color}
                    strokeWidth={getStroke('lats').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Back */}
                <g
                  onMouseEnter={() => setHoveredMuscle('back')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('back')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 78 92 Q 100 88 122 92 L 120 165 Q 100 170 80 165 Z"
                    fill={getIntensityColor('back')}
                    opacity={getOpacity('back')}
                    stroke={getStroke('back').color}
                    strokeWidth={getStroke('back').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Triceps */}
                <g
                  onMouseEnter={() => setHoveredMuscle('triceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('triceps')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="46" cy="125" rx="10" ry="28" 
                    fill={getIntensityColor('triceps')} 
                    opacity={getOpacity('triceps')}
                    stroke={getStroke('triceps').color}
                    strokeWidth={getStroke('triceps').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="154" cy="125" rx="10" ry="28" 
                    fill={getIntensityColor('triceps')} 
                    opacity={getOpacity('triceps')}
                    stroke={getStroke('triceps').color}
                    strokeWidth={getStroke('triceps').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Forearms */}
                <g
                  onMouseEnter={() => setHoveredMuscle('forearms')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('forearms')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="40" cy="178" rx="8" ry="30" 
                    fill={getIntensityColor('forearms')} 
                    opacity={getOpacity('forearms')}
                    stroke={getStroke('forearms').color}
                    strokeWidth={getStroke('forearms').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="160" cy="178" rx="8" ry="30" 
                    fill={getIntensityColor('forearms')} 
                    opacity={getOpacity('forearms')}
                    stroke={getStroke('forearms').color}
                    strokeWidth={getStroke('forearms').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Glutes */}
                <g
                  onMouseEnter={() => setHoveredMuscle('glutes')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('glutes')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="88" cy="202" rx="16" ry="18" 
                    fill={getIntensityColor('glutes')} 
                    opacity={getOpacity('glutes')}
                    stroke={getStroke('glutes').color}
                    strokeWidth={getStroke('glutes').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="112" cy="202" rx="16" ry="18" 
                    fill={getIntensityColor('glutes')} 
                    opacity={getOpacity('glutes')}
                    stroke={getStroke('glutes').color}
                    strokeWidth={getStroke('glutes').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Hamstrings */}
                <g
                  onMouseEnter={() => setHoveredMuscle('hamstrings')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('hamstrings')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 74 225 L 90 225 L 86 300 L 72 300 Q 68 262 74 225"
                    fill={getIntensityColor('hamstrings')}
                    opacity={getOpacity('hamstrings')}
                    stroke={getStroke('hamstrings').color}
                    strokeWidth={getStroke('hamstrings').width}
                    filter="url(#bodyShadow)"
                  />
                  <path
                    d="M 126 225 L 110 225 L 114 300 L 128 300 Q 132 262 126 225"
                    fill={getIntensityColor('hamstrings')}
                    opacity={getOpacity('hamstrings')}
                    stroke={getStroke('hamstrings').color}
                    strokeWidth={getStroke('hamstrings').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
                
                {/* Calves */}
                <g
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => handleMuscleClick('calves')}
                  className="cursor-pointer transition-all duration-200"
                >
                  <ellipse cx="80" cy="335" rx="10" ry="32" 
                    fill={getIntensityColor('calves')} 
                    opacity={getOpacity('calves')}
                    stroke={getStroke('calves').color}
                    strokeWidth={getStroke('calves').width}
                    filter="url(#bodyShadow)"
                  />
                  <ellipse cx="120" cy="335" rx="10" ry="32" 
                    fill={getIntensityColor('calves')} 
                    opacity={getOpacity('calves')}
                    stroke={getStroke('calves').color}
                    strokeWidth={getStroke('calves').width}
                    filter="url(#bodyShadow)"
                  />
                </g>
              </>
            )}
          </svg>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="p-4 bg-[hsl(225,12%,13%)] rounded-xl">
            <h4 className="text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-3">Intensität (Sätze)</h4>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-3 rounded-l-full bg-[hsl(225,12%,20%)]" />
              <div className="flex-1 h-3 bg-cyan-300" />
              <div className="flex-1 h-3 bg-cyan-400" />
              <div className="flex-1 h-3 bg-cyan-500" />
              <div className="flex-1 h-3 bg-cyan-600" />
              <div className="flex-1 h-3 rounded-r-full bg-cyan-700" />
            </div>
            <div className="flex justify-between mt-1 text-xs text-[hsl(var(--fg-muted))]">
              <span>0</span>
              <span>Mehr Sätze →</span>
            </div>
          </div>

          {/* Selected Muscle Info */}
          {selectedData ? (
            <div className="p-4 bg-cyan-400/10 rounded-xl border border-cyan-400/20 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-cyan-400">
                  {MUSCLE_LABELS[selectedMuscle!]}
                </h4>
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className="text-cyan-400 hover:text-cyan-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-[hsl(225,14%,10%)]/60 rounded-lg">
                  <span className="text-[hsl(var(--fg-secondary))]">Sätze (7 Tage)</span>
                  <span className="font-bold text-[hsl(var(--fg-primary))]">{selectedData.sets}</span>
                </div>
                <div className="flex justify-between p-2 bg-[hsl(225,14%,10%)]/60 rounded-lg">
                  <span className="text-[hsl(var(--fg-secondary))]">Letztes Training</span>
                  <span className="font-medium text-[hsl(var(--fg-primary))]">
                    {selectedData.daysSince === null 
                      ? 'Noch nie' 
                      : selectedData.daysSince === 0 
                        ? 'Heute' 
                        : `Vor ${selectedData.daysSince} Tag${selectedData.daysSince > 1 ? 'en' : ''}`}
                  </span>
                </div>
                {selectedData.lastTrained && (
                  <div className="flex justify-between p-2 bg-[hsl(225,14%,10%)]/60 rounded-lg">
                    <span className="text-[hsl(var(--fg-secondary))]">Datum</span>
                    <span className="font-medium text-[hsl(var(--fg-primary))]">
                      {format(selectedData.lastTrained, 'd. MMM', { locale: de })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[hsl(225,12%,13%)] rounded-xl text-center">
              <p className="text-[hsl(var(--fg-muted))] text-sm">
                👆 Klicke auf einen Muskel für Details
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-400/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {Object.values(muscleData).filter(m => m.daysSince !== null && m.daysSince <= 3).length}
              </p>
              <p className="text-xs text-emerald-400/70">Aktiv (≤3 Tage)</p>
            </div>
            <div className="p-3 bg-amber-400/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-400">
                {Object.values(muscleData).filter(m => m.daysSince === null || m.daysSince > 5).length}
              </p>
              <p className="text-xs text-amber-400/70">Braucht Training</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
