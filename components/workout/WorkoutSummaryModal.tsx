'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Clock, Flame, Target, ArrowRight, X, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkoutSummaryData } from '@/lib/progressiveOverload';
import { WorkoutGrade } from '@/lib/coachingEngine';
import { useState } from 'react';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: WorkoutSummaryData;
  grade?: WorkoutGrade | null;
}

export function WorkoutSummaryModal({ isOpen, onClose, summary, grade }: WorkoutSummaryModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const ratingConfig = {
    excellent: {
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      emoji: '🏆',
      label: 'Überragend!',
      bgGlow: 'shadow-orange-500/30',
    },
    good: {
      gradient: 'from-emerald-400 via-green-500 to-teal-500',
      emoji: '💪',
      label: 'Stark!',
      bgGlow: 'shadow-emerald-500/30',
    },
    average: {
      gradient: 'from-blue-400 via-indigo-500 to-purple-500',
      emoji: '✊',
      label: 'Solide!',
      bgGlow: 'shadow-blue-500/30',
    },
    below_average: {
      gradient: 'from-slate-400 via-slate-500 to-slate-600',
      emoji: '💡',
      label: 'Dran bleiben!',
      bgGlow: 'shadow-slate-500/30',
    },
  };

  const config = ratingConfig[summary.overallRating];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`bg-[hsl(225,14%,10%)] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl ${config.bgGlow}`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Hero Header */}
          <div className={`bg-gradient-to-br ${config.gradient} p-8 rounded-t-3xl text-white text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -100 }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                  style={{ left: `${10 + i * 8}%`, top: '80%' }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3, damping: 10 }}
              className="text-6xl mb-3"
            >
              {config.emoji}
            </motion.div>
            <h2 className="text-3xl font-black">{config.label}</h2>
            <p className="text-white/80 mt-2 text-sm">{summary.motivationalMessage}</p>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-cyan-400/10 rounded-2xl p-4 text-center"
              >
                <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-cyan-400">{summary.duration}</p>
                <p className="text-xs text-blue-500">Minuten</p>
                {summary.durationDiff !== 0 && (
                  <p className={`text-xs mt-1 font-semibold ${summary.durationDiff > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {summary.durationDiff > 0 ? '+' : ''}{summary.durationDiff} Min
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-orange-400/10 rounded-2xl p-4 text-center"
              >
                <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-orange-400">{Math.round(summary.totalVolume).toLocaleString()}</p>
                <p className="text-xs text-orange-500">kg Volumen</p>
                {summary.volumeChange !== 0 && (
                  <p className={`text-xs mt-1 font-semibold flex items-center justify-center gap-0.5 ${summary.volumeChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {summary.volumeChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {summary.volumeChange > 0 ? '+' : ''}{summary.volumeChange}%
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-emerald-400/10 rounded-2xl p-4 text-center"
              >
                <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-emerald-400">{summary.totalSetsCompleted}</p>
                <p className="text-xs text-emerald-500">Sätze</p>
                <p className="text-xs mt-1 text-emerald-400">{summary.totalReps} Reps</p>
              </motion.div>
            </div>

            {/* Coach Grade */}
            {grade && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 }}
                className="bg-[hsl(225,12%,13%)] rounded-2xl p-4 border border-[hsl(225,10%,16%)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[hsl(var(--fg-secondary))]">Coach-Bewertung</span>
                  <span className={`grade-badge grade-${grade.grade.toLowerCase()} text-xl`}>
                    {grade.grade}
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--fg-muted))] mb-3">{grade.label} – {grade.score}/100 Punkte</p>
                <div className="space-y-1.5">
                  {([
                    ['Volumen', grade.factors.volumeProgression, 20],
                    ['Intensität', grade.factors.intensityScore, 20],
                    ['Abschluss', grade.factors.completionRate, 20],
                    ['Vielfalt', grade.factors.exerciseVariety, 20],
                    ['Konstanz', grade.factors.consistency, 20],
                  ] as const).map(([label, val, max]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-[hsl(var(--fg-subtle))] w-16">{label}</span>
                      <div className="flex-1 h-1.5 bg-[hsl(225,12%,18%)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full transition-all"
                          style={{ width: `${(val / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[hsl(var(--fg-muted))] w-6 text-right">{val}</span>
                    </div>
                  ))}
                </div>
                {grade.highlights.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {grade.highlights.map((h, i) => (
                      <p key={i} className="text-xs text-emerald-400 flex items-center gap-1">
                        <span>✓</span> {h}
                      </p>
                    ))}
                  </div>
                )}
                {grade.improvements.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {grade.improvements.map((imp, i) => (
                      <p key={i} className="text-xs text-amber-400 flex items-center gap-1">
                        <span>→</span> {imp}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* New PRs */}
            {summary.newPRs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-amber-400/10 to-orange-400/10 border-2 border-amber-400/20 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-amber-300">Neue Persönliche Rekorde!</h3>
                </div>
                <div className="space-y-2">
                  {summary.newPRs.map((pr, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="flex items-center justify-between bg-[hsl(225,14%,10%)]/60 rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-amber-300 text-sm">{pr.exercise}</span>
                      </div>
                      <span className="font-bold text-amber-400 text-sm">{pr.value} ({pr.type})</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Exercise Details (Expandable) */}
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-[hsl(225,12%,13%)] hover:bg-[hsl(225,12%,18%)] transition-colors"
              >
                <span className="font-semibold text-[hsl(var(--fg-secondary))] text-sm">Übungen im Detail</span>
                {showDetails ? <ChevronUp className="w-4 h-4 text-[hsl(var(--fg-muted))]" /> : <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-muted))]" />}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mt-3">
                      {summary.exerciseInsights.map((insight, i) => (
                        <div key={insight.exerciseId} className="bg-[hsl(225,12%,13%)] rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {insight.newPR && <Star className="w-4 h-4 text-amber-500" />}
                              <span className="font-semibold text-[hsl(var(--fg-primary))] text-sm">{insight.exerciseName}</span>
                            </div>
                            <span className="text-xs text-[hsl(var(--fg-muted))]">{insight.setsCompleted} Sätze</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[hsl(var(--fg-secondary))]">{insight.currentVolume}kg Volumen</span>
                            {insight.volumeChange !== 0 && (
                              <span className={`text-xs font-semibold ${insight.volumeChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {insight.volumeChange > 0 ? '+' : ''}{insight.volumeChange}%
                              </span>
                            )}
                            {insight.avgRIR !== undefined && (
                              <span className="text-xs text-[hsl(var(--fg-muted))]">∅ RIR: {insight.avgRIR}</span>
                            )}
                          </div>
                          <p className="text-xs text-[hsl(var(--fg-muted))] mt-1">{insight.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Next Workout Tips */}
            {summary.nextWorkoutTips.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-cyan-400/10 border border-cyan-400/20 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-cyan-300 text-sm">F?r nächstes Mal</h3>
                </div>
                <ul className="space-y-1">
                  {summary.nextWorkoutTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-cyan-400">
                      <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              Weiter zum Tracker
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
