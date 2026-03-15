'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { MuscleGroup } from '@/types';

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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  muscle: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  dumbbell: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
};

// Color scheme for muscle groups
const muscleColors: Record<string, { bg: string; gradient: string; border: string; text: string }> = {
  'Brust': { bg: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-600', border: 'border-cyan-400/20', text: 'text-cyan-400' },
  'Rücken': { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600' },
  'Schultern': { bg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600', border: 'border-amber-200', text: 'text-amber-600' },
  'Bizeps': { bg: 'bg-violet-500', gradient: 'from-violet-500 to-violet-600', border: 'border-violet-200', text: 'text-violet-600' },
  'Trizeps': { bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600', border: 'border-purple-200', text: 'text-purple-600' },
  'Unterarme': { bg: 'bg-fuchsia-500', gradient: 'from-fuchsia-500 to-fuchsia-600', border: 'border-fuchsia-200', text: 'text-fuchsia-600' },
  'Beine': { bg: 'bg-rose-500', gradient: 'from-rose-500 to-rose-600', border: 'border-rose-200', text: 'text-rose-600' },
  'Core': { bg: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-600', border: 'border-cyan-200', text: 'text-cyan-600' },
};

// Info content for each muscle group
const muscleInfo: Record<string, { description: string; avgSetsPerWeek: string; tips: string[] }> = {
  'Brust': {
    description: 'Die Brustmuskulatur (Pectoralis major/minor) ist verantwortlich für Drueckbewegungen und das Heranfuehren der Arme.',
    avgSetsPerWeek: '10-20 Sätze/Woche',
    tips: ['Variiere zwischen Flach-, Schr?g- und Decline-Übungen', 'Nutze verschiedene Griffweiten', 'IsolationsÜbungen am Ende']
  },
  'Rücken': {
    description: 'Der Rücken umfasst Latissimus, Rhomboiden und Trapez - wichtig für Zugbewegungen und Körperhaltung.',
    avgSetsPerWeek: '14-22 Sätze/Woche',
    tips: ['Horizontales + vertikales Ziehen kombinieren', 'Fokus auf Mind-Muscle-Connection', 'Schulterblaetter aktivieren']
  },
  'Schultern': {
    description: 'Die Deltamuskeln bestehen aus vorderem, seitlichem und hinterem Anteil für volle Beweglichkeit.',
    avgSetsPerWeek: '8-16 Sätze/Woche',
    tips: ['Alle drei K?pfe trainieren', 'Seitliches Heben für Breite', 'Hintere Schulter nicht vergessen']
  },
  'Bizeps': {
    description: 'Der Bizeps beugt den Arm und supiniert den Unterarm. Besteht aus langem und kurzem Kopf.',
    avgSetsPerWeek: '6-14 Sätze/Woche',
    tips: ['Verschiedene Griffpositionen nutzen', 'Volle ROM für maximale Dehnung', 'Negatives kontrolliert ausführen']
  },
  'Trizeps': {
    description: 'Der Trizeps macht ~2/3 des Oberarms aus und ist für Streckbewegungen verantwortlich.',
    avgSetsPerWeek: '6-14 Sätze/Woche',
    tips: ['Alle drei K?pfe trainieren', 'Overhead-Übungen für langen Kopf', 'Compound-Übungen zählen mit']
  },
  'Unterarme': {
    description: 'Die Unterarmmuskulatur kontrolliert Griffkraft und Handgelenkbewegungen.',
    avgSetsPerWeek: '4-10 Sätze/Woche',
    tips: ['Farmer Walks für funktionelle Kraft', 'Curls und Reverse Curls', 'Griffvarianten beim Training']
  },
  'Beine': {
    description: 'Quadrizeps, Beinbeuger, Waden und Gesäß - die groessten Muskelgruppen des Körpers.',
    avgSetsPerWeek: '14-22 Sätze/Woche',
    tips: ['Compound-Übungen priorisieren', 'Volle Range of Motion', 'Isolation für Schwachstellen']
  },
  'Core': {
    description: 'Die Rumpfmuskulatur stabilisiert die Wirbelsaeule und überträgt Kraft zwischen Ober- und Unterkörper.',
    avgSetsPerWeek: '6-12 Sätze/Woche',
    tips: ['Anti-Rotation und Anti-Extension', 'Planks und dynamische Übungen', 'Bei Compounds schon aktiviert']
  },
};

export function MuscleBalanceChart() {
  const { workoutSessions } = useWorkoutStore();
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showMuscleInfo, setShowMuscleInfo] = useState<string | null>(null);

  const muscleData = useMemo(() => {
    const muscleSets: Record<string, number> = {
      'Brust': 0,
      'Rücken': 0,
      'Schultern': 0,
      'Bizeps': 0,
      'Trizeps': 0,
      'Unterarme': 0,
      'Beine': 0,
      'Core': 0,
    };

    // Track which exercises contribute to each muscle
    const muscleExercises: Record<string, Array<{ exerciseName: string; sets: number; muscleGroup: MuscleGroup }>> = {
      'Brust': [],
      'Rücken': [],
      'Schultern': [],
      'Bizeps': [],
      'Trizeps': [],
      'Unterarme': [],
      'Beine': [],
      'Core': [],
    };

    const muscleGroupMap: Record<MuscleGroup, string> = {
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
      adductors: 'Beine',
      abductors: 'Beine',
      lower_back: 'Rücken',
      neck: 'Schultern',
    };

    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exercise = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (exercise) {
          const completedSets = ex.sets.filter(set => set.completed && set.weight > 0).length;
          
          // Only count PRIMARY muscle (first in list), ignore secondary muscles
          if (exercise.muscleGroups.length > 0 && completedSets > 0) {
            const primaryMuscle = exercise.muscleGroups[0];
            const category = muscleGroupMap[primaryMuscle];
            
            if (category) {
              muscleSets[category] += completedSets;
              
              // Track exercise contribution
              const existingExercise = muscleExercises[category].find(
                e => e.exerciseName === exercise.name && e.muscleGroup === primaryMuscle
              );
              
              if (existingExercise) {
                existingExercise.sets += completedSets;
              } else {
                muscleExercises[category].push({
                  exerciseName: exercise.name,
                  sets: completedSets,
                  muscleGroup: primaryMuscle,
                });
              }
            }
          }
        }
      });
    });

    const maxSets = Math.max(...Object.values(muscleSets), 1);

    return Object.entries(muscleSets)
      .map(([muscle, sets]) => ({
        muscle,
        value: Math.round((sets / maxSets) * 100),
        actualSets: sets, // Keep decimal for accuracy
        exercises: muscleExercises[muscle].sort((a, b) => b.sets - a.sets),
        colors: muscleColors[muscle],
      }))
      .sort((a, b) => b.actualSets - a.actualSets);
  }, [workoutSessions]);

  const balanceScore = useMemo(() => {
    const values = muscleData.map(m => m.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.max(0, Math.round(100 - Math.sqrt(variance)));
  }, [muscleData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-primary-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Sehr ausgewogen';
    if (score >= 60) return 'Gut ausgewogen';
    if (score >= 40) return 'Verbesserungswuerdig';
    return 'Unausgewogen';
  };

  if (workoutSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[hsl(225,12%,15%)] to-[hsl(225,12%,13%)] flex items-center justify-center text-gray-300">
            {Icons.muscle}
          </div>
          <p className="text-lg font-semibold text-[hsl(var(--fg-primary))] mb-1">Noch keine Daten</p>
          <p className="text-sm text-[hsl(var(--fg-muted))]">Trainiere, um deine Balance zu sehen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Balance Display */}
      <div className="space-y-4">
        {muscleData.map((item, index) => (
          <div 
            key={item.muscle}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.colors.bg}`} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMuscle(item.muscle)}
                    className="font-medium text-[hsl(var(--fg-primary))] hover:text-primary-600 transition-colors"
                  >
                    {item.muscle}
                  </button>
                  <button
                    onClick={() => setShowMuscleInfo(item.muscle)}
                    className="text-[hsl(var(--fg-subtle))] hover:text-primary-500 transition-colors"
                    title="Info zur Muskelgruppe"
                  >
                    {Icons.help}
                  </button>
                </div>
              </div>
              <span className={`text-sm font-bold ${item.colors.text}`}>
                {item.actualSets % 1 === 0 ? Math.round(item.actualSets) : item.actualSets.toFixed(1)} Sätze
              </span>
            </div>
            <div className="relative h-3 bg-[hsl(225,12%,15%)] rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${item.colors.gradient} transition-all duration-700 ease-out`}
                style={{ width: `${item.value}%` }}
              />
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Balance Score Card */}
      <button
        onClick={() => setShowBalanceInfo(true)}
        className="w-full p-5 rounded-2xl bg-gradient-to-br from-primary-50 via-indigo-50 to-violet-50 border border-primary-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 text-left group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(225,14%,10%)]/80 shadow-sm flex items-center justify-center">
              <span className={`text-2xl font-black ${getScoreColor(balanceScore)}`}>
                {balanceScore}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[hsl(var(--fg-primary))]">Balance-Score</h4>
                <span className="text-[hsl(var(--fg-subtle))] group-hover:text-primary-500 transition-colors">
                  {Icons.help}
                </span>
              </div>
              <p className={`text-sm font-medium ${getScoreColor(balanceScore)}`}>
                {getScoreLabel(balanceScore)}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[hsl(225,14%,10%)]/60 flex items-center justify-center text-[hsl(var(--fg-subtle))] group-hover:text-primary-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Balance Info Modal */}
      {showBalanceInfo && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowBalanceInfo(false)}
        >
          <div className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-[hsl(225,10%,14%)] bg-[hsl(225,14%,10%)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                  {Icons.info}
                </div>
                <h3 className="font-bold text-[hsl(var(--fg-primary))]">Balance-Score</h3>
              </div>
              <button
                onClick={() => setShowBalanceInfo(false)}
                className="p-2 hover:bg-[hsl(225,12%,18%)] rounded-xl transition-colors text-[hsl(var(--fg-subtle))] hover:text-[hsl(var(--fg-secondary))]"
              >
                {Icons.close}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Score Display */}
              <div className="text-center py-4">
                <div className={`text-6xl font-black ${getScoreColor(balanceScore)}`}>
                  {balanceScore}%
                </div>
                <p className={`text-sm font-medium mt-1 ${getScoreColor(balanceScore)}`}>
                  {getScoreLabel(balanceScore)}
                </p>
              </div>

              {/* Explanation Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[hsl(225,12%,13%)] border border-[hsl(225,10%,14%)]">
                  <h4 className="font-semibold text-[hsl(var(--fg-primary))] mb-2">Was ist der Balance-Score?</h4>
                  <p className="text-sm text-[hsl(var(--fg-secondary))] leading-relaxed">
                    Der Balance-Score zeigt, wie gleichm??ig du alle Muskelgruppen trainierst. 
                    Ein h?herer Score bedeutet ein ausgeglicheneres Training.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[hsl(225,12%,13%)] border border-[hsl(225,10%,14%)]">
                  <h4 className="font-semibold text-[hsl(var(--fg-primary))] mb-2">Berechnung</h4>
                  <p className="text-sm text-[hsl(var(--fg-secondary))] leading-relaxed">
                    Wir zählen die abgeschlossenen Sätze (nur mit Gewicht &gt; 0) pro Muskelgruppe 
                    und berechnen die Varianz. Je gleichm??iger verteilt, desto h?her der Score.
                  </p>
                </div>

                {/* Score Legend */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[hsl(225,12%,13%)] to-[hsl(225,12%,15%)] border border-[hsl(225,10%,14%)]">
                  <h4 className="font-semibold text-[hsl(var(--fg-primary))] mb-3">Bewertung</h4>
                  <div className="space-y-2">
                    {[
                      { range: '80-100%', label: 'Sehr ausgewogen', color: 'text-emerald-600' },
                      { range: '60-79%', label: 'Gut ausgewogen', color: 'text-primary-600' },
                      { range: '40-59%', label: 'Verbesserungswuerdig', color: 'text-amber-600' },
                      { range: '0-39%', label: 'Unausgewogen', color: 'text-rose-600' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${item.color}`}>{item.range}</span>
                        <span className="text-[hsl(var(--fg-secondary))]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Distribution */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100">
                  <h4 className="font-semibold text-[hsl(var(--fg-primary))] mb-3">Deine Verteilung</h4>
                  <div className="space-y-2">
                    {muscleData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.colors.bg}`} />
                          <span className="text-[hsl(var(--fg-secondary))]">{item.muscle}</span>
                        </div>
                        <span className="font-medium text-[hsl(var(--fg-primary))]">{item.actualSets} Sätze</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Muscle Detail Modal */}
      {selectedMuscle && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setSelectedMuscle(null)}
        >
          <div className="bg-[hsl(225,14%,10%)] rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-shrink-0 bg-gradient-to-br from-[hsl(225,14%,10%)] to-[hsl(225,12%,13%)] border-b border-[hsl(225,10%,16%)] p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${muscleData.find(m => m.muscle === selectedMuscle)?.colors.bg}`} />
                <h3 className="font-bold text-[hsl(var(--fg-primary))] text-xl">{selectedMuscle} - Übungsdetails</h3>
              </div>
              <button
                onClick={() => setSelectedMuscle(null)}
                className="p-2 hover:bg-[hsl(225,12%,18%)] rounded-xl transition-colors text-[hsl(var(--fg-subtle))] hover:text-[hsl(var(--fg-secondary))]"
              >
                {Icons.close}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const muscleInfo = muscleData.find(m => m.muscle === selectedMuscle);
                if (!muscleInfo || muscleInfo.exercises.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-[hsl(var(--fg-muted))]">Keine Übungen gefunden</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className={`p-5 rounded-xl bg-gradient-to-br ${muscleInfo.colors.gradient} bg-opacity-10 border-2 ${muscleInfo.colors.border}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[hsl(var(--fg-secondary))] uppercase tracking-wide mb-1">Gesamt</p>
                          <p className={`text-3xl font-bold ${muscleInfo.colors.text}`}>
                            {muscleInfo.actualSets % 1 === 0 ? Math.round(muscleInfo.actualSets) : muscleInfo.actualSets.toFixed(1)} Sätze
                          </p>
                        </div>
                        <div className={`w-16 h-16 rounded-2xl ${muscleInfo.colors.bg} bg-opacity-20 flex items-center justify-center`}>
                          {Icons.muscle}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wide mb-3 flex items-center gap-2">
                        {Icons.dumbbell}
                        Übungen ({muscleInfo.exercises.length})
                      </h4>
                      <div className="space-y-3">
                        {muscleInfo.exercises.map((exercise, idx) => (
                          <div key={idx} className="bg-[hsl(225,14%,10%)] border-2 border-[hsl(225,10%,16%)] rounded-xl p-4 hover:border-[hsl(225,10%,22%)] transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-[hsl(var(--fg-primary))] mb-1">
                                  {exercise.exerciseName}
                                </h5>
                                <p className="text-sm text-[hsl(var(--fg-muted))]">
                                  Muskelgruppe: {exercise.muscleGroup}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className={`text-2xl font-bold ${muscleInfo.colors.text}`}>
                                  {exercise.sets % 1 === 0 ? Math.round(exercise.sets) : exercise.sets.toFixed(1)}
                                </p>
                                <p className="text-xs text-[hsl(var(--fg-muted))]">Sätze</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[hsl(225,10%,14%)]">
                              <div className="relative h-2 bg-[hsl(225,12%,15%)] rounded-full overflow-hidden">
                                <div
                                  className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${muscleInfo.colors.gradient}`}
                                  style={{ width: `${(exercise.sets / muscleInfo.actualSets) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-[hsl(var(--fg-muted))] mt-1">
                                {Math.round((exercise.sets / muscleInfo.actualSets) * 100)}% der {selectedMuscle}-Sätze
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Hinweis:</strong> Nur der primaere Muskel (erster in der Liste) wird gezählt. 
                        Bankdrücken mit 2 Sätzen = 2 Sätze für Brust. Hilfsmuskeln wie Schultern und Arme werden nicht mitgezählt.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Muscle Info Modal */}
      {showMuscleInfo && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowMuscleInfo(null)}
        >
          <div className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-[hsl(225,10%,14%)] bg-gradient-to-br from-[hsl(225,14%,10%)] to-[hsl(225,12%,13%)]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${muscleColors[showMuscleInfo]?.bg || 'bg-primary-500'} bg-opacity-20 flex items-center justify-center`}>
                  {Icons.muscle}
                </div>
                <h3 className="font-bold text-[hsl(var(--fg-primary))]">{showMuscleInfo}</h3>
              </div>
              <button
                onClick={() => setShowMuscleInfo(null)}
                className="p-2 hover:bg-[hsl(225,12%,18%)] rounded-xl transition-colors text-[hsl(var(--fg-subtle))] hover:text-[hsl(var(--fg-secondary))]"
              >
                {Icons.close}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {muscleInfo[showMuscleInfo] && (
                <>
                  {/* Description */}
                  <div className="p-4 rounded-xl bg-[hsl(225,12%,13%)] border border-[hsl(225,10%,14%)]">
                    <h4 className="font-semibold text-[hsl(var(--fg-primary))] mb-2">📖 Beschreibung</h4>
                    <p className="text-sm text-[hsl(var(--fg-secondary))] leading-relaxed">
                      {muscleInfo[showMuscleInfo].description}
                    </p>
                  </div>

                  {/* Recommended Volume */}
                  <div className={`p-4 rounded-xl ${muscleColors[showMuscleInfo]?.bg || 'bg-primary-500'} bg-opacity-10 border ${muscleColors[showMuscleInfo]?.border || 'border-primary-200'}`}>
                    <h4 className="font-semibold text-[hsl(var(--fg-primary))] mb-2">📊 Empfohlenes Volumen</h4>
                    <p className={`text-2xl font-bold ${muscleColors[showMuscleInfo]?.text || 'text-primary-600'}`}>
                      {muscleInfo[showMuscleInfo].avgSetsPerWeek}
                    </p>
                    <p className="text-xs text-[hsl(var(--fg-muted))] mt-1">für optimales Muskelwachstum</p>
                  </div>

                  {/* Tips */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-3">💡 Trainingstipps</h4>
                    <ul className="space-y-2">
                      {muscleInfo[showMuscleInfo].tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-emerald-700">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Current Stats */}
                  {(() => {
                    const currentData = muscleData.find(m => m.muscle === showMuscleInfo);
                    if (currentData) {
                      return (
                        <div className="p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                          <h4 className="font-semibold text-blue-800 mb-2">📈 Deine Statistik</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-cyan-400">Getrackte Sätze (gesamt)</span>
                            <span className="text-xl font-bold text-blue-800">
                              {currentData.actualSets % 1 === 0 ? Math.round(currentData.actualSets) : currentData.actualSets.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-cyan-400 mt-1">
                            Nur abgeschlossene Sätze mit Gewicht &gt; 0
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
