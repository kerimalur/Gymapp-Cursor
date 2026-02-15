'use client';

import { useState } from 'react';
import { MuscleGroup, WorkoutSession } from '@/types';
import { X, Clock, Dumbbell, Calendar, Users } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { exerciseDatabase } from '@/data/exerciseDatabase';

interface MuscleMapProps {
  view: 'front' | 'back';
  muscleRecovery: Record<string, number>;
  recoveryTimes?: Record<MuscleGroup, number>;
  lastTrainedDay?: Record<MuscleGroup, string | null>;
  lastTrainedRole?: Record<MuscleGroup, 'primary' | 'secondary' | null>;
  workoutSessions?: WorkoutSession[];
  enabledMuscles?: MuscleGroup[];
}

const muscleTranslations: Record<string, string> = {
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

// Default recovery times in hours (based on muscle size and training intensity)
// Small muscles: 24-48h, Medium muscles: 48-72h, Large muscles: 72-96h
const DEFAULT_RECOVERY_TIMES: Record<MuscleGroup, number> = {
  chest: 72,      // Large muscle, needs more recovery
  back: 72,       // Large muscle group
  shoulders: 48,  // Medium muscle
  biceps: 48,     // Small muscle but often overtrained
  triceps: 48,    // Small muscle
  forearms: 24,   // Small, recovers fast
  abs: 24,        // Recovers quickly
  quadriceps: 96, // Largest muscle, needs most recovery
  hamstrings: 72, // Large muscle
  calves: 48,     // Dense muscle, moderate recovery
  glutes: 72,     // Large muscle
  traps: 48,      // Medium muscle
  lats: 72,       // Large muscle
  adductors: 48,  // Medium muscle
  abductors: 48,  // Medium muscle
  lower_back: 72, // Often stressed, needs recovery
  neck: 24,       // Small muscle, recovers fast
};

interface MuscleExerciseInfo {
  exerciseName: string;
  date: Date;
  sets: number;
  totalVolume: number;
}

export function MuscleMap({ 
  view, 
  muscleRecovery, 
  recoveryTimes = DEFAULT_RECOVERY_TIMES, 
  lastTrainedDay,
  lastTrainedRole,
  workoutSessions = [],
  enabledMuscles
}: MuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  // Helper to check if muscle is enabled
  const isMuscleEnabled = (muscle: string) => {
    if (!enabledMuscles) return true;
    return enabledMuscles.includes(muscle as MuscleGroup);
  };

  const getColor = (recovery: number, isSecondary?: boolean, muscle?: string) => {
    // If muscle is not enabled, return gray
    if (muscle && !isMuscleEnabled(muscle)) {
      return '#d1d5db'; // gray-300
    }
    // For secondary muscles, return a lighter/different shade
    if (isSecondary) {
      if (recovery >= 80) return '#86efac'; // lighter green
      if (recovery >= 50) return '#fcd34d'; // lighter orange
      return '#fca5a5'; // lighter red
    }
    if (recovery >= 80) return '#10b981'; // green
    if (recovery >= 50) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getStatusColor = (recovery: number) => {
    if (recovery >= 80) return 'bg-emerald-500';
    if (recovery >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getMuscleInfo = (muscle: string) => {
    const recovery = muscleRecovery[muscle] || 0;
    const muscleKey = muscle as MuscleGroup;
    const totalRecoveryTime = recoveryTimes[muscleKey] || 48;
    const hoursRemaining = Math.max(0, Math.ceil(((100 - recovery) / 100) * totalRecoveryTime));
    const trainedDay = lastTrainedDay?.[muscleKey];
    const role = lastTrainedRole?.[muscleKey];
    const isSecondary = role === 'secondary';
    
    return {
      name: muscleTranslations[muscle] || muscle,
      recovery,
      hoursRemaining,
      trainedDay,
      role,
      isSecondary,
      color: getColor(recovery, isSecondary),
      status:
        recovery >= 80
          ? 'Bereit'
          : recovery >= 50
          ? 'Regeneriert'
          : 'Müde',
    };
  };

  // Get exercises that trained this muscle (only with weight > 0)
  const getMuscleExercises = (muscle: string): MuscleExerciseInfo[] => {
    const exercises: MuscleExerciseInfo[] = [];
    const muscleKey = muscle as MuscleGroup;
    
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (exerciseData && exerciseData.muscleGroups.includes(muscleKey)) {
          // Only count sets with weight > 0
          const validSets = ex.sets.filter(s => s.completed && s.weight > 0);
          if (validSets.length > 0) {
            const totalVolume = validSets.reduce((sum, set) => 
              sum + (set.weight * set.reps), 0
            );
            exercises.push({
              exerciseName: exerciseData.name,
              date: new Date(session.startTime),
              sets: validSets.length,
              totalVolume,
            });
          }
        }
      });
    });
    
    // Sort by date descending and take last 5
    return exercises
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  // Get time since last training for this muscle
  const getTimeSinceTraining = (muscle: string): string => {
    const muscleKey = muscle as MuscleGroup;
    let lastTrainedTime: Date | null = null;
    
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exerciseData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (exerciseData && exerciseData.muscleGroups.includes(muscleKey)) {
          const sessionTime = new Date(session.endTime || session.startTime);
          if (!lastTrainedTime || sessionTime > lastTrainedTime) {
            lastTrainedTime = sessionTime;
          }
        }
      });
    });
    
    if (!lastTrainedTime) return 'Noch nie trainiert';
    
    const now = new Date();
    const hours = differenceInHours(now, lastTrainedTime);
    const minutes = differenceInMinutes(now, lastTrainedTime);
    
    if (hours < 1) {
      return `vor ${minutes} Min`;
    } else if (hours < 24) {
      return `vor ${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    }
  };

  const handleMuscleClick = (muscle: string, e?: React.MouseEvent) => {
    if (e) {
      setClickPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
    setSelectedMuscle(muscle);
  };

  const muscleInfo = selectedMuscle ? getMuscleInfo(selectedMuscle) : null;
  const muscleExercises = selectedMuscle ? getMuscleExercises(selectedMuscle) : [];

  return (
    <div className="relative">
      <svg
        viewBox="0 0 400 600"
        className="w-full max-w-md mx-auto max-h-[600px] drop-shadow-lg"
      >
        <defs>
          {/* Gradients for more realistic muscle appearance */}
          <radialGradient id="muscleGradient">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
          </radialGradient>
          <filter id="muscleShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
          </filter>
        </defs>
        
        {view === 'front' ? (
          <>
            {/* Head with better shape */}
            <ellipse cx="200" cy="50" rx="38" ry="48" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
            <ellipse cx="188" cy="45" rx="4" ry="6" fill="#9ca3af"/> {/* Eye */}
            <ellipse cx="212" cy="45" rx="4" ry="6" fill="#9ca3af"/> {/* Eye */}

            {/* Neck */}
            <rect x="185" y="90" width="30" height="25" rx="5" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1"/>

            {/* Shoulders - more defined deltoids */}
            <g
              onMouseEnter={() => setHoveredMuscle('shoulders')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('shoulders')}
              className="cursor-pointer transition-all"
            >
              <ellipse
                cx="145"
                cy="120"
                rx="35"
                ry="28"
                fill={getColor(muscleRecovery.shoulders || 0)}
                opacity={hoveredMuscle === 'shoulders' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'shoulders' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'shoulders' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <ellipse
                cx="255"
                cy="120"
                rx="35"
                ry="28"
                fill={getColor(muscleRecovery.shoulders || 0)}
                opacity={hoveredMuscle === 'shoulders' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'shoulders' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'shoulders' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
            </g>

            {/* Chest - more anatomically correct pectorals */}
            <g
              onMouseEnter={() => setHoveredMuscle('chest')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('chest')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 165 130 Q 180 145, 200 155 Q 220 145, 235 130 L 228 185 Q 200 195 172 185 Z"
                fill={getColor(muscleRecovery.chest || 0)}
                opacity={hoveredMuscle === 'chest' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'chest' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'chest' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              {/* Sternum line for definition */}
              <line x1="200" y1="155" x2="200" y2="185" stroke="#374151" strokeWidth="1" opacity="0.3"/>
            </g>

            {/* Abs - defined six-pack */}
            <g
              onMouseEnter={() => setHoveredMuscle('abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('abs')}
              className="cursor-pointer transition-all"
            >
              {/* Upper abs */}
              <rect x="182" y="195" width="18" height="20" rx="4" fill={getColor(muscleRecovery.abs || 0)} opacity={hoveredMuscle === 'abs' ? 0.95 : 0.75} stroke="#374151" strokeWidth="1"/>
              <rect x="200" y="195" width="18" height="20" rx="4" fill={getColor(muscleRecovery.abs || 0)} opacity={hoveredMuscle === 'abs' ? 0.95 : 0.75} stroke="#374151" strokeWidth="1"/>
              {/* Middle abs */}
              <rect x="182" y="218" width="18" height="22" rx="4" fill={getColor(muscleRecovery.abs || 0)} opacity={hoveredMuscle === 'abs' ? 0.95 : 0.75} stroke="#374151" strokeWidth="1"/>
              <rect x="200" y="218" width="18" height="22" rx="4" fill={getColor(muscleRecovery.abs || 0)} opacity={hoveredMuscle === 'abs' ? 0.95 : 0.75} stroke="#374151" strokeWidth="1"/>
              {/* Lower abs */}
              <rect x="182" y="243" width="18" height="24" rx="4" fill={getColor(muscleRecovery.abs || 0)} opacity={hoveredMuscle === 'abs' ? 0.95 : 0.75} stroke="#374151" strokeWidth="1"/>
              <rect x="200" y="243" width="18" height="24" rx="4" fill={getColor(muscleRecovery.abs || 0)} opacity={hoveredMuscle === 'abs' ? 0.95 : 0.75} stroke="#374151" strokeWidth="1"/>
              {selectedMuscle === 'abs' && <rect x="178" y="192" width="44" height="78" rx="8" fill="none" stroke="#1f2937" strokeWidth="3"/>}
            </g>

            {/* Biceps - more defined shape */}
            <g
              onMouseEnter={() => setHoveredMuscle('biceps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('biceps')}
              className="cursor-pointer transition-all"
            >
              <ellipse
                cx="135"
                cy="175"
                rx="20"
                ry="38"
                fill={getColor(muscleRecovery.biceps || 0)}
                opacity={hoveredMuscle === 'biceps' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'biceps' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'biceps' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <ellipse
                cx="265"
                cy="175"
                rx="20"
                ry="38"
                fill={getColor(muscleRecovery.biceps || 0)}
                opacity={hoveredMuscle === 'biceps' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'biceps' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'biceps' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
            </g>

            {/* Forearms */}
            <g
              onMouseEnter={() => setHoveredMuscle('forearms')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('forearms')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 125 220 L 118 285 L 135 288 L 140 220 Z"
                fill={getColor(muscleRecovery.forearms || 0)}
                opacity={hoveredMuscle === 'forearms' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'forearms' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'forearms' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <path
                d="M 275 220 L 282 285 L 265 288 L 260 220 Z"
                fill={getColor(muscleRecovery.forearms || 0)}
                opacity={hoveredMuscle === 'forearms' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'forearms' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'forearms' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
            </g>

            {/* Quadriceps - more defined */}
            <g
              onMouseEnter={() => setHoveredMuscle('quadriceps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('quadriceps')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 162 280 L 158 400 L 177 402 L 185 280 Z"
                fill={getColor(muscleRecovery.quadriceps || 0)}
                opacity={hoveredMuscle === 'quadriceps' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'quadriceps' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'quadriceps' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <path
                d="M 215 280 L 223 402 L 242 400 L 238 280 Z"
                fill={getColor(muscleRecovery.quadriceps || 0)}
                opacity={hoveredMuscle === 'quadriceps' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'quadriceps' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'quadriceps' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              {/* Vastus medialis definition */}
              <ellipse cx="185" cy="360" rx="12" ry="30" fill={getColor(muscleRecovery.quadriceps || 0)} opacity="0.4"/>
              <ellipse cx="215" cy="360" rx="12" ry="30" fill={getColor(muscleRecovery.quadriceps || 0)} opacity="0.4"/>
            </g>

            {/* Calves - diamond shape */}
            <g
              onMouseEnter={() => setHoveredMuscle('calves')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('calves')}
              className="cursor-pointer transition-all"
            >
              <ellipse
                cx="170"
                cy="460"
                rx="16"
                ry="42"
                fill={getColor(muscleRecovery.calves || 0)}
                opacity={hoveredMuscle === 'calves' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'calves' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'calves' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <ellipse
                cx="230"
                cy="460"
                rx="16"
                ry="42"
                fill={getColor(muscleRecovery.calves || 0)}
                opacity={hoveredMuscle === 'calves' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'calves' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'calves' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
            </g>
          </>
        ) : (
          <>
            {/* Head (back view) */}
            <ellipse cx="200" cy="50" rx="38" ry="48" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>

            {/* Neck */}
            <rect x="185" y="90" width="30" height="25" rx="5" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1"/>

            {/* Traps - upper back */}
            <g
              onMouseEnter={() => setHoveredMuscle('traps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('traps')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 160 105 Q 180 100, 200 108 Q 220 100, 240 105 L 232 135 Q 215 145, 200 145 Q 185 145, 168 135 Z"
                fill={getColor(muscleRecovery.traps || 0)}
                opacity={hoveredMuscle === 'traps' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'traps' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'traps' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              {/* Trap definition line */}
              <line x1="200" y1="108" x2="200" y2="135" stroke="#374151" strokeWidth="1" opacity="0.3"/>
            </g>

            {/* Rear Deltoids (back of shoulders) */}
            <g
              onMouseEnter={() => setHoveredMuscle('shoulders')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('shoulders')}
              className="cursor-pointer transition-all"
            >
              <ellipse
                cx="145"
                cy="125"
                rx="28"
                ry="24"
                fill={getColor(muscleRecovery.shoulders || 0)}
                opacity={hoveredMuscle === 'shoulders' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'shoulders' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'shoulders' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <ellipse
                cx="255"
                cy="125"
                rx="28"
                ry="24"
                fill={getColor(muscleRecovery.shoulders || 0)}
                opacity={hoveredMuscle === 'shoulders' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'shoulders' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'shoulders' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
            </g>

            {/* Back/Lats - V-taper shape */}
            <g
              onMouseEnter={() => setHoveredMuscle('back')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('back')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 155 145 Q 170 150, 180 165 L 175 240 Q 185 250, 200 252 Q 215 250, 225 240 L 220 165 Q 230 150, 245 145 L 238 155 Q 225 170, 220 200 L 220 235 Q 215 245, 200 246 Q 185 245, 180 235 L 180 200 Q 175 170, 162 155 Z"
                fill={getColor(muscleRecovery.back || 0)}
                opacity={hoveredMuscle === 'back' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'back' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'back' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              {/* Spine line for definition */}
              <line x1="200" y1="145" x2="200" y2="250" stroke="#374151" strokeWidth="1.5" opacity="0.3"/>
              {/* Lat definition */}
              <path d="M 175 170 Q 165 190, 170 220" stroke="#374151" strokeWidth="1" opacity="0.2" fill="none"/>
              <path d="M 225 170 Q 235 190, 230 220" stroke="#374151" strokeWidth="1" opacity="0.2" fill="none"/>
            </g>

            {/* Lower back */}
            <g
              onMouseEnter={() => setHoveredMuscle('back')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('back')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 180 250 Q 185 260, 200 262 Q 215 260, 220 250 L 218 275 Q 212 280, 200 280 Q 188 280, 182 275 Z"
                fill={getColor(muscleRecovery.back || 0)}
                opacity="0.5"
                stroke="#374151"
                strokeWidth="1"
              />
            </g>

            {/* Triceps - horseshoe shape */}
            <g
              onMouseEnter={() => setHoveredMuscle('triceps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('triceps')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 125 155 Q 135 160, 140 175 Q 138 195, 132 215 Q 125 210, 122 195 Z"
                fill={getColor(muscleRecovery.triceps || 0)}
                opacity={hoveredMuscle === 'triceps' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'triceps' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'triceps' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <path
                d="M 275 155 Q 265 160, 260 175 Q 262 195, 268 215 Q 275 210, 278 195 Z"
                fill={getColor(muscleRecovery.triceps || 0)}
                opacity={hoveredMuscle === 'triceps' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'triceps' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'triceps' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
            </g>

            {/* Forearms (back) */}
            <g
              onMouseEnter={() => setHoveredMuscle('forearms')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('forearms')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 120 220 L 115 285 L 132 288 L 135 220 Z"
                fill={getColor(muscleRecovery.forearms || 0)}
                opacity={hoveredMuscle === 'forearms' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'forearms' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'forearms' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <path
                d="M 280 220 L 285 285 L 268 288 L 265 220 Z"
                fill={getColor(muscleRecovery.forearms || 0)}
                opacity={hoveredMuscle === 'forearms' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'forearms' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'forearms' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
            </g>

            {/* Glutes - more defined */}
            <g
              onMouseEnter={() => setHoveredMuscle('glutes')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('glutes')}
              className="cursor-pointer transition-all"
            >
              <ellipse
                cx="177"
                cy="285"
                rx="28"
                ry="32"
                fill={getColor(muscleRecovery.glutes || 0)}
                opacity={hoveredMuscle === 'glutes' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'glutes' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'glutes' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <ellipse
                cx="223"
                cy="285"
                rx="28"
                ry="32"
                fill={getColor(muscleRecovery.glutes || 0)}
                opacity={hoveredMuscle === 'glutes' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'glutes' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'glutes' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              {/* Glute definition line */}
              <line x1="200" y1="270" x2="200" y2="300" stroke="#374151" strokeWidth="1" opacity="0.3"/>
            </g>

            {/* Hamstrings */}
            <g
              onMouseEnter={() => setHoveredMuscle('hamstrings')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('hamstrings')}
              className="cursor-pointer transition-all"
            >
              <path
                d="M 162 320 L 160 400 L 178 402 L 183 320 Z"
                fill={getColor(muscleRecovery.hamstrings || 0)}
                opacity={hoveredMuscle === 'hamstrings' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'hamstrings' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'hamstrings' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <path
                d="M 217 320 L 222 402 L 240 400 L 238 320 Z"
                fill={getColor(muscleRecovery.hamstrings || 0)}
                opacity={hoveredMuscle === 'hamstrings' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'hamstrings' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'hamstrings' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              {/* Biceps femoris definition */}
              <path d="M 165 340 Q 163 370, 165 395" stroke="#374151" strokeWidth="1" opacity="0.2" fill="none"/>
              <path d="M 235 340 Q 237 370, 235 395" stroke="#374151" strokeWidth="1" opacity="0.2" fill="none"/>
            </g>

            {/* Calves (back) - gastrocnemius */}
            <g
              onMouseEnter={() => setHoveredMuscle('calves')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => handleMuscleClick('calves')}
              className="cursor-pointer transition-all"
            >
              <ellipse
                cx="170"
                cy="460"
                rx="17"
                ry="44"
                fill={getColor(muscleRecovery.calves || 0)}
                opacity={hoveredMuscle === 'calves' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'calves' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'calves' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              <ellipse
                cx="230"
                cy="460"
                rx="17"
                ry="44"
                fill={getColor(muscleRecovery.calves || 0)}
                opacity={hoveredMuscle === 'calves' ? 0.95 : 0.75}
                stroke={selectedMuscle === 'calves' ? '#1f2937' : '#374151'}
                strokeWidth={selectedMuscle === 'calves' ? '3' : '1'}
                filter="url(#muscleShadow)"
              />
              {/* Soleus (lower calf) */}
              <ellipse cx="170" cy="485" rx="12" ry="15" fill={getColor(muscleRecovery.calves || 0)} opacity="0.4"/>
              <ellipse cx="230" cy="485" rx="12" ry="15" fill={getColor(muscleRecovery.calves || 0)} opacity="0.4"/>
            </g>
          </>
        )}
      </svg>

      {/* Hover Tooltip */}
      {hoveredMuscle && !selectedMuscle && (() => {
        const info = getMuscleInfo(hoveredMuscle);
        return (
          <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900">
                {info.name}
              </h4>
              {info.isSecondary && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">
                  Hilfs
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(info.recovery)}`} />
              <span className="text-sm text-gray-600">
                {info.recovery}% regeneriert
              </span>
            </div>
            {info.isSecondary && (
              <p className="text-xs text-slate-400 mt-2">Zuletzt als Hilfsmuskel trainiert</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Klicken für Details</p>
          </div>
        );
      })()}

      {/* Detail Modal */}
      {selectedMuscle && muscleInfo && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(muscleInfo.recovery)}`} />
                <h2 className="text-xl font-bold text-gray-900">{muscleInfo.name}</h2>
                {muscleInfo.isSecondary && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Hilfsmuskel
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedMuscle(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Schließen"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Role Info Banner */}
              {muscleInfo.isSecondary && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Users className="w-5 h-5 text-slate-500" />
                  <p className="text-sm text-slate-600">
                    Dieser Muskel wurde zuletzt als <strong>Hilfsmuskel</strong> trainiert und regeneriert schneller.
                  </p>
                </div>
              )}

              {/* Recovery Status */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Regeneration</span>
                  <span className="text-2xl font-bold text-gray-900">{muscleInfo.recovery}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    ref={(el) => { if (el) { el.style.width = `${muscleInfo.recovery}%`; el.style.backgroundColor = muscleInfo.color; }}}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(muscleInfo.recovery)}`}>
                    {muscleInfo.status}
                  </span>
                  {muscleInfo.hoursRemaining > 0 && (
                    <span className="text-sm text-gray-500">
                      Noch {muscleInfo.hoursRemaining}h bis 100%
                    </span>
                  )}
                </div>
              </div>

              {/* Time Since Training */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Zeit seit Training</p>
                  <p className="font-semibold text-gray-900">{getTimeSinceTraining(selectedMuscle)}</p>
                </div>
              </div>

              {/* Recent Exercises */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Letzte Übungen</h3>
                </div>
                
                {muscleExercises.length > 0 ? (
                  <div className="space-y-3">
                    {muscleExercises.map((exercise, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{exercise.exerciseName}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span>{exercise.sets} Sätze</span>
                              <span>•</span>
                              <span>{exercise.totalVolume.toLocaleString()} kg</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {format(exercise.date, 'dd.MM', { locale: de })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">Noch keine Übungen für diesen Muskel</p>
                  </div>
                )}
              </div>

              {/* Recovery Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Regenerationszeit</h4>
                <p className="text-sm text-gray-600">
                  Dieser Muskel benötigt typischerweise <span className="font-semibold">{recoveryTimes[selectedMuscle as MuscleGroup] || 48} Stunden</span> für vollständige Regeneration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
