'use client';

import { useMemo, useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { getMuscleInvolvement, exerciseDatabase } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, 
  LayoutGrid, BarChart3, X, Dumbbell, Calendar, Hash, Weight, Activity,
  // Muscle icons
  Grip, CircleDot, Maximize2, ArrowUp, ArrowDown, Footprints, Circle, Square, Diamond, Hexagon, Pentagon, Octagon, Triangle, Star, Heart
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Research-based optimal weekly sets per muscle group
const VOLUME_RECOMMENDATIONS: Record<MuscleGroup, { min: number; optimal: number; max: number }> = {
  chest: { min: 10, optimal: 16, max: 22 },
  back: { min: 10, optimal: 16, max: 22 },
  shoulders: { min: 8, optimal: 14, max: 20 },
  biceps: { min: 8, optimal: 12, max: 18 },
  triceps: { min: 8, optimal: 12, max: 18 },
  forearms: { min: 4, optimal: 8, max: 12 },
  abs: { min: 6, optimal: 10, max: 15 },
  quadriceps: { min: 10, optimal: 16, max: 22 },
  hamstrings: { min: 8, optimal: 12, max: 18 },
  calves: { min: 8, optimal: 12, max: 18 },
  glutes: { min: 8, optimal: 14, max: 20 },
  traps: { min: 6, optimal: 10, max: 14 },
  lats: { min: 10, optimal: 14, max: 20 },
  adductors: { min: 4, optimal: 8, max: 12 },
  abductors: { min: 4, optimal: 8, max: 12 },
  lower_back: { min: 4, optimal: 8, max: 12 },
  neck: { min: 2, optimal: 4, max: 8 },
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

// Professional SVG-based muscle icons using Lucide
const getMuscleIcon = (muscle: MuscleGroup, className: string = 'w-5 h-5') => {
  const iconProps = { className };
  switch (muscle) {
    case 'chest': return <Maximize2 {...iconProps} />;
    case 'back': return <Square {...iconProps} />;
    case 'shoulders': return <Diamond {...iconProps} />;
    case 'biceps': return <CircleDot {...iconProps} />;
    case 'triceps': return <Hexagon {...iconProps} />;
    case 'forearms': return <Grip {...iconProps} />;
    case 'abs': return <Activity {...iconProps} />;
    case 'quadriceps': return <ArrowUp {...iconProps} />;
    case 'hamstrings': return <ArrowDown {...iconProps} />;
    case 'calves': return <Footprints {...iconProps} />;
    case 'glutes': return <Circle {...iconProps} />;
    case 'traps': return <Triangle {...iconProps} />;
    case 'lats': return <Pentagon {...iconProps} />;
    case 'adductors': return <ChevronDown {...iconProps} />;
    case 'abductors': return <ChevronUp {...iconProps} />;
    case 'lower_back': return <Octagon {...iconProps} />;
    case 'neck': return <Star {...iconProps} />;
    default: return <Dumbbell {...iconProps} />;
  }
};

// Exercise details for modal
interface ExerciseDetail {
  name: string;
  sets: number;
  totalReps: number;
  maxWeight: number;
  role: 'primary' | 'secondary';
  date: Date;
}

const DEFAULT_ENABLED_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'
];

interface MuscleVolumeData {
  muscle: MuscleGroup;
  label: string;
  primarySets: number;
  secondarySets: number;
  effectiveSets: number;
  lastWeekSets: number;
  recommendation: { min: number; optimal: number; max: number };
  status: 'under' | 'optimal' | 'over';
  trend: number;
  percentOfOptimal: number;
  exercises: ExerciseDetail[];
}

export function MuscleVolumeStats() {
  const { workoutSessions } = useWorkoutStore();
  const { trackingSettings } = useNutritionStore();
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<'modern' | 'compact'>('modern');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleVolumeData | null>(null);

  // Get enabled muscles from settings or use defaults
  const enabledMuscles = trackingSettings?.enabledMuscles || DEFAULT_ENABLED_MUSCLES;

  const volumeData = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { locale: de, weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { locale: de, weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    // Initialize volume tracking
    const thisWeekVolume: Record<MuscleGroup, { primary: number; secondary: number }> = {} as any;
    const lastWeekVolume: Record<MuscleGroup, { primary: number; secondary: number }> = {} as any;
    const exercisesByMuscle: Record<MuscleGroup, ExerciseDetail[]> = {} as any;

    Object.keys(VOLUME_RECOMMENDATIONS).forEach(muscle => {
      thisWeekVolume[muscle as MuscleGroup] = { primary: 0, secondary: 0 };
      lastWeekVolume[muscle as MuscleGroup] = { primary: 0, secondary: 0 };
      exercisesByMuscle[muscle as MuscleGroup] = [];
    });

    // Process sessions
    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const isThisWeek = isWithinInterval(sessionDate, { start: thisWeekStart, end: thisWeekEnd });
      const isLastWeek = isWithinInterval(sessionDate, { start: lastWeekStart, end: lastWeekEnd });

      if (!isThisWeek && !isLastWeek) return;

      const volumeTarget = isThisWeek ? thisWeekVolume : lastWeekVolume;

      session.exercises.forEach(ex => {
        // Only count completed sets that aren't warmups and have weight > 0
        const completedSets = ex.sets.filter(s => s.completed && !s.isWarmup && s.weight > 0);
        if (completedSets.length === 0) return;

        const muscleInvolvement = getMuscleInvolvement(ex.exerciseId);
        const exerciseInfo = exerciseDatabase.find(e => e.id === ex.exerciseId);
        const exerciseName = exerciseInfo?.name || ex.exerciseId;

        muscleInvolvement.forEach(({ muscle, role }) => {
          if (role === 'primary') {
            volumeTarget[muscle].primary += completedSets.length;
          } else {
            volumeTarget[muscle].secondary += completedSets.length;
          }

          // Track exercise details for this week only
          if (isThisWeek) {
            const existingExercise = exercisesByMuscle[muscle].find(
              e => e.name === exerciseName && e.date.toDateString() === sessionDate.toDateString()
            );
            
            if (existingExercise) {
              existingExercise.sets += completedSets.length;
              existingExercise.totalReps += completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);
              existingExercise.maxWeight = Math.max(existingExercise.maxWeight, ...completedSets.map(s => s.weight || 0));
            } else {
              exercisesByMuscle[muscle].push({
                name: exerciseName,
                sets: completedSets.length,
                totalReps: completedSets.reduce((sum, s) => sum + (s.reps || 0), 0),
                maxWeight: Math.max(...completedSets.map(s => s.weight || 0)),
                role,
                date: sessionDate,
              });
            }
          }
        });
      });
    });

    // Calculate data for each muscle - only for enabled muscles
    const data: MuscleVolumeData[] = enabledMuscles.map(muscle => {
      const m = muscle as MuscleGroup;
      const thisWeek = thisWeekVolume[m];
      const lastWeek = lastWeekVolume[m];
      const effectiveSets = thisWeek.primary + (thisWeek.secondary * 0.5);
      const lastWeekEffective = lastWeek.primary + (lastWeek.secondary * 0.5);
      const recommended = VOLUME_RECOMMENDATIONS[m];
      const percentOfOptimal = Math.round((effectiveSets / recommended.optimal) * 100);

      let status: MuscleVolumeData['status'];
      if (effectiveSets < recommended.min) {
        status = 'under';
      } else if (effectiveSets > recommended.max) {
        status = 'over';
      } else {
        status = 'optimal';
      }

      return {
        muscle: m,
        label: MUSCLE_LABELS[m],
        primarySets: thisWeek.primary,
        secondarySets: thisWeek.secondary,
        effectiveSets: Math.round(effectiveSets * 10) / 10,
        lastWeekSets: Math.round(lastWeekEffective * 10) / 10,
        recommendation: recommended,
        status,
        trend: Math.round((effectiveSets - lastWeekEffective) * 10) / 10,
        percentOfOptimal,
        exercises: exercisesByMuscle[m].sort((a, b) => b.date.getTime() - a.date.getTime()),
      };
    });

    // Sort: under first, then by how far from optimal
    return data.sort((a, b) => {
      const statusOrder = { under: 0, over: 1, optimal: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      const aDeviation = Math.abs(a.effectiveSets - a.recommendation.optimal);
      const bDeviation = Math.abs(b.effectiveSets - b.recommendation.optimal);
      return bDeviation - aDeviation;
    });
  }, [workoutSessions, enabledMuscles]);

  // Only show enabled muscles
  const displayedData = showAll ? volumeData : volumeData.slice(0, 8);

  const statusCounts = useMemo(() => ({
    under: volumeData.filter(d => d.status === 'under').length,
    optimal: volumeData.filter(d => d.status === 'optimal').length,
    over: volumeData.filter(d => d.status === 'over').length,
  }), [volumeData]);

  const getStatusColor = (status: MuscleVolumeData['status']) => {
    switch (status) {
      case 'under': return { 
        bg: 'bg-gradient-to-br from-amber-50 to-orange-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200', 
        bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
        ring: 'ring-amber-200'
      };
      case 'optimal': return { 
        bg: 'bg-gradient-to-br from-emerald-50 to-green-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200', 
        bar: 'bg-gradient-to-r from-emerald-400 to-green-500',
        ring: 'ring-emerald-200'
      };
      case 'over': return { 
        bg: 'bg-gradient-to-br from-rose-50 to-red-50', 
        text: 'text-rose-700', 
        border: 'border-rose-200', 
        bar: 'bg-gradient-to-r from-rose-400 to-red-500',
        ring: 'ring-rose-200'
      };
    }
  };

  const getStatusBadge = (status: MuscleVolumeData['status']) => {
    switch (status) {
      case 'under': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'optimal': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'over': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    }
  };

  const getRecommendationText = (data: MuscleVolumeData) => {
    if (data.status === 'under') {
      const needed = Math.round((data.recommendation.min - data.effectiveSets) * 10) / 10;
      return `+${needed} Sätze bis Minimum`;
    } else if (data.status === 'over') {
      const excess = Math.round((data.effectiveSets - data.recommendation.max) * 10) / 10;
      return `${excess} Sätze über Maximum`;
    }
    return 'Im optimalen Bereich';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-700">Zu wenig</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{statusCounts.under}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">Optimal</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{statusCounts.optimal}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-3 border border-rose-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-medium text-rose-700">Zu viel</span>
          </div>
          <p className="text-2xl font-bold text-rose-700">{statusCounts.over}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Primär</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Sekundär (×0.5)</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('modern')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'modern' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
            title="Moderne Ansicht"
          >
            <LayoutGrid className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
            title="Kompakte Ansicht"
          >
            <BarChart3 className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Volume Display - Modern Cards */}
      {viewMode === 'modern' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayedData.map((data) => {
            const colors = getStatusColor(data.status);
            const progressPercent = Math.min(100, (data.effectiveSets / data.recommendation.optimal) * 100);
            
            return (
              <div 
                key={data.muscle} 
                onClick={() => setSelectedMuscle(data)}
                className={`relative p-4 rounded-2xl border-2 ${colors.border} ${colors.bg} transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group`}
              >
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(data.status)}
                </div>

                {/* Icon & Label */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${colors.text} bg-white/60`}>
                    {getMuscleIcon(data.muscle, 'w-5 h-5')}
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">{data.label}</span>
                </div>

                {/* Progress Circle */}
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-slate-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 1.76} 176`}
                      className={colors.text}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-800">{data.effectiveSets}</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Ziel: {data.recommendation.optimal}
                  </span>
                  {data.trend !== 0 && (
                    <span className={`flex items-center gap-0.5 font-medium ${data.trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {data.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(data.trend)}
                    </span>
                  )}
                </div>

                {/* Exercise Count Indicator */}
                {data.exercises.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-slate-400">
                    <Dumbbell className="w-3 h-3" />
                    <span>{data.exercises.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Bar View */
        <div className="space-y-2">
          {displayedData.map((data) => {
            const colors = getStatusColor(data.status);
            const progressPercent = Math.min(100, (data.effectiveSets / data.recommendation.max) * 100);
            const minMark = (data.recommendation.min / data.recommendation.max) * 100;
            const optimalMark = (data.recommendation.optimal / data.recommendation.max) * 100;

            return (
              <div key={data.muscle} className="group" onClick={() => setSelectedMuscle(data)}>
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                  {/* Icon */}
                  <div className={`p-1.5 rounded-lg ${colors.text} ${colors.bg} w-8 h-8 flex items-center justify-center`}>
                    {getMuscleIcon(data.muscle, 'w-4 h-4')}
                  </div>
                  
                  {/* Label & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate">{data.label}</span>
                      <div className="flex items-center gap-2">
                        {data.trend !== 0 && (
                          <span className={`text-xs font-medium flex items-center gap-0.5 ${data.trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {data.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(data.trend)}
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {data.effectiveSets}/{data.recommendation.optimal}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      {/* Markers */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                        style={{ left: `${minMark}%` }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10"
                        style={{ left: `${optimalMark}%` }}
                      />
                      {/* Progress */}
                      <div
                        className={`h-full ${colors.bar} transition-all duration-500 rounded-full`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="w-5">
                    {getStatusBadge(data.status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMuscle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMuscle(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`p-4 ${getStatusColor(selectedMuscle.status).bg} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white/70 ${getStatusColor(selectedMuscle.status).text}`}>
                      {getMuscleIcon(selectedMuscle.muscle, 'w-6 h-6')}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{selectedMuscle.label}</h3>
                      <p className="text-sm text-slate-600">{getRecommendationText(selectedMuscle)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMuscle(null)}
                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Modal Stats */}
              <div className="p-4 border-b bg-slate-50">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{selectedMuscle.effectiveSets}</p>
                    <p className="text-xs text-slate-500">Effektive Sätze</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{selectedMuscle.recommendation.optimal}</p>
                    <p className="text-xs text-slate-500">Optimal</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${selectedMuscle.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedMuscle.trend >= 0 ? '+' : ''}{selectedMuscle.trend}
                    </p>
                    <p className="text-xs text-slate-500">vs. letzte Woche</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span>Primär: {selectedMuscle.primarySets} Sätze</span>
                  <span>•</span>
                  <span>Sekundär: {selectedMuscle.secondarySets} Sätze</span>
                </div>
              </div>

              {/* Exercise List */}
              <div className="p-4 overflow-y-auto max-h-[40vh]">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Übungen diese Woche
                </h4>
                {selectedMuscle.exercises.length > 0 ? (
                  <div className="space-y-2">
                    {selectedMuscle.exercises.map((exercise, idx) => (
                      <div 
                        key={`${exercise.name}-${idx}`}
                        className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-800 text-sm">{exercise.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${exercise.role === 'primary' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                            {exercise.role === 'primary' ? 'Primär' : 'Sekundär'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(exercise.date, 'EEE, d. MMM', { locale: de })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {exercise.sets} Sätze
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3" />
                            {exercise.maxWeight} kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Keine Übungen diese Woche</p>
                  </div>
                )}
              </div>

              {/* Recommendation Footer */}
              <div className="p-4 bg-slate-50 border-t">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Target className="w-4 h-4" />
                  <span>
                    Empfehlung: {selectedMuscle.recommendation.min}-{selectedMuscle.recommendation.max} Sätze/Woche
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show More/Less Toggle */}
      {volumeData.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Alle {volumeData.length} Muskelgruppen
            </>
          )}
        </button>
      )}
    </div>
  );
}
