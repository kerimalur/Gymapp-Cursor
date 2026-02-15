'use client';

import { useState, useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { differenceInDays } from 'date-fns';

interface MuscleData {
  name: string;
  nameDE: string;
  lastTrained: Date | null;
  frequency: number; // trainings in last 7 days
  totalSets: number;
}

type MuscleGroup = 
  | 'chest' | 'back' | 'shoulders' 
  | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'traps' | 'lats';

const muscleLabels: Record<MuscleGroup, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  forearms: 'Unterarme',
  abs: 'Bauch',
  obliques: 'Seitliche Bauchmuskeln',
  quads: 'Quadrizeps',
  hamstrings: 'Beinbeuger',
  glutes: 'Gesäß',
  calves: 'Waden',
  traps: 'Trapez',
  lats: 'Latissimus',
};

// Simplified exercise to muscle mapping
const exerciseToMuscle: Record<string, MuscleGroup[]> = {
  'Bankdrücken': ['chest', 'triceps', 'shoulders'],
  'Schrägbankdrücken': ['chest', 'triceps', 'shoulders'],
  'Fliegende': ['chest'],
  'Kabelzug Brust': ['chest'],
  'Butterfly': ['chest'],
  'Dips': ['chest', 'triceps'],
  'Klimmzüge': ['back', 'biceps', 'lats'],
  'Latzug': ['back', 'biceps', 'lats'],
  'Rudern': ['back', 'biceps'],
  'Kreuzheben': ['back', 'hamstrings', 'glutes'],
  'Schulterdrücken': ['shoulders', 'triceps'],
  'Seitheben': ['shoulders'],
  'Frontheben': ['shoulders'],
  'Face Pulls': ['shoulders', 'traps'],
  'Shrugs': ['traps'],
  'Bizeps Curls': ['biceps'],
  'Hammer Curls': ['biceps', 'forearms'],
  'Trizeps Pushdown': ['triceps'],
  'French Press': ['triceps'],
  'Kniebeugen': ['quads', 'glutes', 'hamstrings'],
  'Beinpresse': ['quads', 'glutes'],
  'Ausfallschritte': ['quads', 'glutes', 'hamstrings'],
  'Beinstrecker': ['quads'],
  'Beinbeuger': ['hamstrings'],
  'Hip Thrust': ['glutes', 'hamstrings'],
  'Wadenheben': ['calves'],
  'Crunches': ['abs'],
  'Planke': ['abs', 'obliques'],
  'Beinheben': ['abs'],
  'Russian Twist': ['obliques'],
};

export function MuscleHeatmap() {
  const { workoutSessions } = useWorkoutStore();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  // Calculate muscle data from workout sessions
  const muscleData = useMemo(() => {
    const data: Record<MuscleGroup, MuscleData> = {} as Record<MuscleGroup, MuscleData>;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Initialize all muscles
    Object.keys(muscleLabels).forEach(muscle => {
      data[muscle as MuscleGroup] = {
        name: muscle,
        nameDE: muscleLabels[muscle as MuscleGroup],
        lastTrained: null,
        frequency: 0,
        totalSets: 0,
      };
    });

    // Analyze workout sessions
    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const isRecent = sessionDate >= sevenDaysAgo;

      session.exercises.forEach(exercise => {
        const muscles = exerciseToMuscle[exercise.exerciseId] || [];
        // Only count completed sets with weight > 0
        const completedSets = exercise.sets.filter(s => s.completed && s.weight > 0).length;

        muscles.forEach(muscle => {
          if (!data[muscle].lastTrained || sessionDate > data[muscle].lastTrained) {
            data[muscle].lastTrained = sessionDate;
          }
          if (isRecent) {
            data[muscle].frequency++;
            data[muscle].totalSets += completedSets;
          }
        });
      });
    });

    return data;
  }, [workoutSessions]);

  // Get intensity level (0-5) based on training recency
  const getIntensity = (muscle: MuscleGroup): number => {
    const data = muscleData[muscle];
    if (!data.lastTrained) return 0;
    
    const daysSince = differenceInDays(new Date(), data.lastTrained);
    if (daysSince === 0) return 5;
    if (daysSince === 1) return 4;
    if (daysSince <= 3) return 3;
    if (daysSince <= 5) return 2;
    if (daysSince <= 7) return 1;
    return 0;
  };

  // Get rest status (muscles that need rest)
  const getRestLevel = (muscle: MuscleGroup): number => {
    const data = muscleData[muscle];
    if (!data.lastTrained) return 0;
    
    const daysSince = differenceInDays(new Date(), data.lastTrained);
    if (daysSince === 0) return 3; // needs rest
    if (daysSince === 1) return 2; // moderate rest
    if (daysSince === 2) return 1; // light rest
    return 0; // ready
  };

  const getMuscleClass = (muscle: MuscleGroup) => {
    const intensity = getIntensity(muscle);
    const isSelected = selectedMuscle === muscle;
    
    let baseClass = 'muscle-group transition-all duration-300 cursor-pointer';
    if (intensity > 0) {
      baseClass += ` intensity-${intensity}`;
    }
    if (isSelected) {
      baseClass += ' stroke-primary-500 stroke-2';
    }
    return baseClass;
  };

  const selectedData = selectedMuscle ? muscleData[selectedMuscle] : null;

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Muskel-Heatmap</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Trainingsfrequenz der letzten 7 Tage</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setView('front')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              view === 'front' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Vorne
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              view === 'back' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Hinten
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* SVG Body Map */}
        <div className="flex justify-center">
          <svg viewBox="0 0 200 400" className="w-full max-w-[250px] h-auto">
            {view === 'front' ? (
              <>
                {/* Head */}
                <ellipse cx="100" cy="30" rx="25" ry="28" className="fill-slate-200 dark:fill-slate-700" />
                
                {/* Neck */}
                <rect x="90" y="55" width="20" height="15" className="fill-slate-200 dark:fill-slate-700" />
                
                {/* Shoulders */}
                <ellipse 
                  cx="55" cy="85" rx="20" ry="15" 
                  className={getMuscleClass('shoulders')}
                  onClick={() => setSelectedMuscle('shoulders')}
                />
                <ellipse 
                  cx="145" cy="85" rx="20" ry="15" 
                  className={getMuscleClass('shoulders')}
                  onClick={() => setSelectedMuscle('shoulders')}
                />
                
                {/* Chest */}
                <path 
                  d="M 65 90 Q 100 85 135 90 L 130 130 Q 100 140 70 130 Z"
                  className={getMuscleClass('chest')}
                  onClick={() => setSelectedMuscle('chest')}
                />
                
                {/* Abs */}
                <path 
                  d="M 80 135 L 120 135 L 118 200 L 82 200 Z"
                  className={getMuscleClass('abs')}
                  onClick={() => setSelectedMuscle('abs')}
                />
                
                {/* Obliques */}
                <path 
                  d="M 68 130 L 80 135 L 82 200 L 75 195 Q 65 165 68 130"
                  className={getMuscleClass('obliques')}
                  onClick={() => setSelectedMuscle('obliques')}
                />
                <path 
                  d="M 132 130 L 120 135 L 118 200 L 125 195 Q 135 165 132 130"
                  className={getMuscleClass('obliques')}
                  onClick={() => setSelectedMuscle('obliques')}
                />
                
                {/* Biceps */}
                <ellipse 
                  cx="42" cy="130" rx="12" ry="30" 
                  className={getMuscleClass('biceps')}
                  onClick={() => setSelectedMuscle('biceps')}
                />
                <ellipse 
                  cx="158" cy="130" rx="12" ry="30" 
                  className={getMuscleClass('biceps')}
                  onClick={() => setSelectedMuscle('biceps')}
                />
                
                {/* Forearms */}
                <ellipse 
                  cx="35" cy="185" rx="10" ry="35" 
                  className={getMuscleClass('forearms')}
                  onClick={() => setSelectedMuscle('forearms')}
                />
                <ellipse 
                  cx="165" cy="185" rx="10" ry="35" 
                  className={getMuscleClass('forearms')}
                  onClick={() => setSelectedMuscle('forearms')}
                />
                
                {/* Quads */}
                <path 
                  d="M 75 205 L 90 205 L 85 300 L 70 300 Q 65 250 75 205"
                  className={getMuscleClass('quads')}
                  onClick={() => setSelectedMuscle('quads')}
                />
                <path 
                  d="M 125 205 L 110 205 L 115 300 L 130 300 Q 135 250 125 205"
                  className={getMuscleClass('quads')}
                  onClick={() => setSelectedMuscle('quads')}
                />
                
                {/* Calves */}
                <ellipse 
                  cx="77" cy="345" rx="12" ry="35" 
                  className={getMuscleClass('calves')}
                  onClick={() => setSelectedMuscle('calves')}
                />
                <ellipse 
                  cx="123" cy="345" rx="12" ry="35" 
                  className={getMuscleClass('calves')}
                  onClick={() => setSelectedMuscle('calves')}
                />
              </>
            ) : (
              <>
                {/* Head */}
                <ellipse cx="100" cy="30" rx="25" ry="28" className="fill-slate-200 dark:fill-slate-700" />
                
                {/* Neck */}
                <rect x="90" y="55" width="20" height="15" className="fill-slate-200 dark:fill-slate-700" />
                
                {/* Traps */}
                <path 
                  d="M 70 65 Q 100 55 130 65 L 125 95 Q 100 100 75 95 Z"
                  className={getMuscleClass('traps')}
                  onClick={() => setSelectedMuscle('traps')}
                />
                
                {/* Shoulders (back view) */}
                <ellipse 
                  cx="55" cy="85" rx="20" ry="15" 
                  className={getMuscleClass('shoulders')}
                  onClick={() => setSelectedMuscle('shoulders')}
                />
                <ellipse 
                  cx="145" cy="85" rx="20" ry="15" 
                  className={getMuscleClass('shoulders')}
                  onClick={() => setSelectedMuscle('shoulders')}
                />
                
                {/* Lats */}
                <path 
                  d="M 65 95 L 75 100 L 78 170 L 65 160 Q 55 130 65 95"
                  className={getMuscleClass('lats')}
                  onClick={() => setSelectedMuscle('lats')}
                />
                <path 
                  d="M 135 95 L 125 100 L 122 170 L 135 160 Q 145 130 135 95"
                  className={getMuscleClass('lats')}
                  onClick={() => setSelectedMuscle('lats')}
                />
                
                {/* Back */}
                <path 
                  d="M 75 100 Q 100 95 125 100 L 122 170 Q 100 175 78 170 Z"
                  className={getMuscleClass('back')}
                  onClick={() => setSelectedMuscle('back')}
                />
                
                {/* Triceps */}
                <ellipse 
                  cx="42" cy="130" rx="12" ry="30" 
                  className={getMuscleClass('triceps')}
                  onClick={() => setSelectedMuscle('triceps')}
                />
                <ellipse 
                  cx="158" cy="130" rx="12" ry="30" 
                  className={getMuscleClass('triceps')}
                  onClick={() => setSelectedMuscle('triceps')}
                />
                
                {/* Forearms */}
                <ellipse 
                  cx="35" cy="185" rx="10" ry="35" 
                  className={getMuscleClass('forearms')}
                  onClick={() => setSelectedMuscle('forearms')}
                />
                <ellipse 
                  cx="165" cy="185" rx="10" ry="35" 
                  className={getMuscleClass('forearms')}
                  onClick={() => setSelectedMuscle('forearms')}
                />
                
                {/* Glutes */}
                <ellipse 
                  cx="85" cy="210" rx="18" ry="20" 
                  className={getMuscleClass('glutes')}
                  onClick={() => setSelectedMuscle('glutes')}
                />
                <ellipse 
                  cx="115" cy="210" rx="18" ry="20" 
                  className={getMuscleClass('glutes')}
                  onClick={() => setSelectedMuscle('glutes')}
                />
                
                {/* Hamstrings */}
                <path 
                  d="M 70 235 L 90 235 L 85 310 L 70 310 Q 65 270 70 235"
                  className={getMuscleClass('hamstrings')}
                  onClick={() => setSelectedMuscle('hamstrings')}
                />
                <path 
                  d="M 130 235 L 110 235 L 115 310 L 130 310 Q 135 270 130 235"
                  className={getMuscleClass('hamstrings')}
                  onClick={() => setSelectedMuscle('hamstrings')}
                />
                
                {/* Calves */}
                <ellipse 
                  cx="77" cy="345" rx="12" ry="35" 
                  className={getMuscleClass('calves')}
                  onClick={() => setSelectedMuscle('calves')}
                />
                <ellipse 
                  cx="123" cy="345" rx="12" ry="35" 
                  className={getMuscleClass('calves')}
                  onClick={() => setSelectedMuscle('calves')}
                />
              </>
            )}
          </svg>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Legende</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-300" />
                <span className="text-slate-600 dark:text-slate-400">Heute trainiert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-200" />
                <span className="text-slate-600 dark:text-slate-400">Vor 1-2 Tagen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-100" />
                <span className="text-slate-600 dark:text-slate-400">Vor 3-5 Tagen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                <span className="text-slate-600 dark:text-slate-400">Nicht trainiert</span>
              </div>
            </div>
          </div>

          {/* Selected Muscle Info */}
          {selectedData ? (
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 animate-scale-in">
              <h4 className="text-lg font-bold text-primary-700 dark:text-primary-300 mb-2">
                {selectedData.nameDE}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Letztes Training:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedData.lastTrained 
                      ? differenceInDays(new Date(), selectedData.lastTrained) === 0
                        ? 'Heute'
                        : `Vor ${differenceInDays(new Date(), selectedData.lastTrained)} Tagen`
                      : 'Noch nie'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Trainings (7 Tage):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedData.frequency}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Sätze (7 Tage):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedData.totalSets}</span>
                </div>
                {getRestLevel(selectedMuscle!) > 0 && (
                  <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <p className="text-amber-700 dark:text-amber-300 text-xs">
                      💡 Dieser Muskel könnte noch Erholung brauchen
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Klicke auf einen Muskel für Details
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {Object.values(muscleData).filter(m => m.lastTrained && differenceInDays(new Date(), m.lastTrained) <= 2).length}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Aktive Muskelgruppen</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {Object.values(muscleData).filter(m => !m.lastTrained || differenceInDays(new Date(), m.lastTrained) > 5).length}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Brauchen Aufmerksamkeit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
