'use client';

import { useMemo, useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { calculateAchievements, Achievement } from '@/lib/achievements';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, ChevronDown, ChevronUp, Star, Filter } from 'lucide-react';

type CategoryFilter = 'all' | 'strength' | 'consistency' | 'volume' | 'milestone';

export function AchievementsPanel() {
  const { workoutSessions } = useWorkoutStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showAll, setShowAll] = useState(false);

  const achievements = useMemo(() => {
    return calculateAchievements(workoutSessions);
  }, [workoutSessions]);

  const unlocked = achievements.filter(a => a.progress >= 100);
  const locked = achievements.filter(a => a.progress < 100);

  const filtered = useMemo(() => {
    const all = [...unlocked, ...locked];
    if (filter === 'all') return all;
    return all.filter(a => a.category === filter);
  }, [unlocked, locked, filter]);

  const displayed = showAll ? filtered : filtered.slice(0, 8);

  const categoryLabels: Record<CategoryFilter, string> = {
    all: 'Alle',
    consistency: '🔥 Konsistenz',
    strength: '🏋️ Kraft',
    volume: '📦 Volumen',
    milestone: '🎯 Meilensteine',
  };

  return (
    <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Achievements</h3>
            <p className="text-xs text-[hsl(var(--fg-muted))]">
              {unlocked.length} / {achievements.length} freigeschaltet
            </p>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="url(#achievementGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(unlocked.length / achievements.length) * 100.5} 100.5`}
            />
            <defs>
              <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-[hsl(var(--fg-secondary))]">
              {Math.round((unlocked.length / achievements.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {(Object.keys(categoryLabels) as CategoryFilter[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === cat
                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                : 'bg-[hsl(225,12%,15%)] text-[hsl(var(--fg-muted))] hover:bg-[hsl(225,12%,20%)]'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <AnimatePresence>
          {displayed.map((achievement) => {
            const isUnlocked = achievement.progress >= 100;
            const isExpanded = expandedId === achievement.id;

            return (
              <motion.button
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setExpandedId(isExpanded ? null : achievement.id)}
                className={`text-left rounded-xl p-3 border-2 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-md'
                    : 'bg-[hsl(225,12%,13%)] border-[hsl(225,10%,16%)] hover:border-[hsl(225,10%,22%)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
                    {achievement.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-semibold text-sm truncate ${
                        isUnlocked ? 'text-amber-900' : 'text-[hsl(var(--fg-muted))]'
                      }`}>
                        {achievement.name}
                      </p>
                      {isUnlocked && <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                      {!isUnlocked && <Lock className="w-3 h-3 text-[hsl(var(--fg-subtle))] flex-shrink-0" />}
                    </div>

                    {/* Progress bar */}
                    {!isUnlocked && (
                      <div className="mt-1.5">
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[hsl(var(--fg-subtle))] mt-0.5">
                          {achievement.current} / {achievement.target} {achievement.unit}
                        </p>
                      </div>
                    )}

                    {isUnlocked && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        ✅ {achievement.current} {achievement.unit}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded Description */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className={`text-xs mt-2 pt-2 border-t ${
                        isUnlocked
                          ? 'text-amber-700 border-amber-200'
                          : 'text-[hsl(var(--fg-muted))] border-[hsl(225,10%,16%)]'
                      }`}>
                        {achievement.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More / Less */}
      {filtered.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-xs font-semibold text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))] flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? (
            <>Weniger anzeigen <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Alle {filtered.length} anzeigen <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
}
