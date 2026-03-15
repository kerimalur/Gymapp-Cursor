'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { WorkoutSession } from '@/types';
import {
  ArrowLeft, CheckCircle, X, Plus, Minus, Flame, Search,
  Timer, TrendingUp, AlertTriangle, StickyNote,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Suspense } from 'react';
import { getProgressionSuggestion, generateWorkoutSummary, WorkoutSummaryData } from '@/lib/progressiveOverload';
import { WorkoutSummaryModal } from '@/components/workout/WorkoutSummaryModal';
import { normalizeSearchText } from '@/lib/text';

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ─── Workout Content ──────────────────────────────────────────────────────────

function WorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingDayId = searchParams.get('id') || '';

  const workoutStore = useWorkoutStore();
  const { trainingDays, workoutSessions, workoutSettings, customExercises } = workoutStore;
  const { syncData, user } = useAuthStore();
  const nutritionStore = useNutritionStore();

  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeExIdx, setActiveExIdx] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<WorkoutSummaryData | null>(null);
  const [exerciseNotes, setExerciseNotes] = useState<Record<number, string>>({});
  const [showNoteInput, setShowNoteInput] = useState<number | null>(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [restTimer, setRestTimer] = useState({ isActive: false, seconds: 0, targetSeconds: 90 });

  const exerciseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const allExercises = useMemo(() => [...exerciseDatabase, ...customExercises], [customExercises]);

  const filteredExercises = useMemo(() => {
    const q = normalizeSearchText(exerciseSearchTerm);
    return allExercises.filter(e =>
      !q || normalizeSearchText(e.name).includes(q) ||
      e.muscleGroups.some(mg => normalizeSearchText(mg).includes(q))
    );
  }, [allExercises, exerciseSearchTerm]);

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setInterval(() =>
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  useEffect(() => {
    if (!restTimer.isActive || restTimer.seconds <= 0) return;
    const t = setInterval(() => {
      setRestTimer(prev => {
        if (prev.seconds <= 1) {
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
          toast.success('⏱️ Pause vorbei! Nächster Satz!', { duration: 3000 });
          return { ...prev, isActive: false, seconds: 0 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [restTimer.isActive, restTimer.seconds]);

  const startRestTimer = useCallback((seconds?: number) => {
    const target = seconds || workoutSettings?.defaultRestTime || 90;
    setRestTimer({ isActive: true, seconds: target, targetSeconds: target });
    toast.success(`⏱️ ${Math.floor(target / 60)}:${(target % 60).toString().padStart(2, '0')} Pause`, { duration: 2000 });
  }, [workoutSettings?.defaultRestTime]);

  const stopRestTimer = useCallback(() =>
    setRestTimer(p => ({ ...p, isActive: false, seconds: 0 })), []);

  // ── Initialize workout ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!trainingDayId) { router.push('/tracker'); return; }
    const day = trainingDays.find(d => d.id === trainingDayId);
    if (!day) { router.push('/tracker'); return; }

    const lastWorkout = workoutSessions
      .filter(s => s.trainingDayId === trainingDayId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

    const newWorkout: WorkoutSession = {
      id: `workout-${Date.now()}`,
      userId: 'local-user',
      trainingDayId: day.id,
      trainingDayName: day.name,
      startTime,
      totalVolume: 0,
      exercises: day.exercises.map(ex => {
        const lastEx = lastWorkout?.exercises.find(e => e.exerciseId === ex.exerciseId);
        return {
          ...ex,
          sets: ex.sets.map((set, idx) => {
            const lastWeight = lastEx?.sets[idx]?.weight;
            return {
              id: `set-${Date.now()}-${idx}`,
              weight: lastWeight ?? 0,   // pre-fill last weight; 0 = blank on first time
              reps: 8,                    // always default 8
              rir: 1,                     // always default RIR 1
              completed: false,
              ghostWeight: lastWeight,
              ghostReps: lastEx?.sets[idx]?.reps,
            };
          }),
        };
      }),
    };
    setWorkout(newWorkout);
  }, [trainingDayId, trainingDays, workoutSessions, router, startTime]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const completedSets = workout?.exercises.reduce((t, ex) => t + ex.sets.filter(s => s.completed).length, 0) ?? 0;
  const totalSets = workout?.exercises.reduce((t, ex) => t + ex.sets.length, 0) ?? 0;
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const totalVolume = workout?.exercises.reduce((t, ex) =>
    t + ex.sets.reduce((st, s) => st + (s.completed ? Math.abs(s.weight) * s.reps : 0), 0), 0) ?? 0;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<WorkoutSession['exercises'][0]['sets'][0]>) => {
    setWorkout(prev => {
      if (!prev) return prev;
      const next = { ...prev, exercises: prev.exercises.map((ex, ei) =>
        ei !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, ...patch }) }
      )};

      // Auto-complete when weight + reps + rir are all filled
      const set = next.exercises[exIdx].sets[setIdx];
      const hasWeight = set.isAssisted ? set.weight !== 0 : set.weight > 0;
      if (hasWeight && set.reps > 0 && set.rir !== undefined && !set.completed) {
        const withComplete = { ...next, exercises: next.exercises.map((ex, ei) =>
          ei !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, completed: true }) }
        )};
        toast.success('Satz abgeschlossen! 💪', { duration: 1500 });
        const remaining = withComplete.exercises[exIdx].sets.filter((s, i) => i > setIdx && !s.completed).length;
        if (remaining > 0 && workoutSettings?.autoStartRestTimer) startRestTimer();
        return withComplete;
      }
      return next;
    });
  };

  const handleToggleSet = (exIdx: number, setIdx: number) => {
    setWorkout(prev => {
      if (!prev) return prev;
      const set = prev.exercises[exIdx].sets[setIdx];
      const hasWeight = set.isAssisted ? set.weight !== 0 : set.weight > 0;
      if (!set.completed && (!hasWeight || set.reps === 0)) {
        toast.error('Gewicht und Wiederholungen eingeben');
        return prev;
      }
      const wasCompleted = set.completed;
      const next = { ...prev, exercises: prev.exercises.map((ex, ei) =>
        ei !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, completed: !wasCompleted }) }
      )};
      if (!wasCompleted) {
        toast.success('Satz abgeschlossen! 💪', { duration: 1500 });
        const remaining = next.exercises[exIdx].sets.filter((s, i) => i > setIdx && !s.completed).length;
        if (remaining > 0 && workoutSettings?.autoStartRestTimer) startRestTimer();
      }
      return next;
    });
  };

  const handleToggleWarmup = (exIdx: number, setIdx: number) => {
    setWorkout(prev => {
      if (!prev) return prev;
      const isWarmup = !prev.exercises[exIdx].sets[setIdx].isWarmup;
      toast.success(isWarmup ? '🔥 Aufwärmsatz' : 'Arbeitssatz', { duration: 1500 });
      return { ...prev, exercises: prev.exercises.map((ex, ei) =>
        ei !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, isWarmup }) }
      )};
    });
  };

  const handleAddSet = (exIdx: number) => {
    setWorkout(prev => {
      if (!prev) return prev;
      const last = prev.exercises[exIdx].sets.at(-1);
      return { ...prev, exercises: prev.exercises.map((ex, ei) =>
        ei !== exIdx ? ex : { ...ex, sets: [...ex.sets, {
          id: `set-${Date.now()}`,
          weight: last?.weight ?? 0,
          reps: 8,
          rir: 1,
          completed: false,
          ghostWeight: last?.ghostWeight,
          ghostReps: last?.ghostReps,
        }]}
      )};
    });
    toast.success('Satz hinzugefügt');
  };

  const handleRemoveExercise = (exIdx: number) => {
    if (!confirm('Übung wirklich entfernen?')) return;
    setWorkout(prev => prev ? { ...prev, exercises: prev.exercises.filter((_, i) => i !== exIdx) } : prev);
    toast.success('Übung entfernt');
  };

  const handleAddExercise = (exerciseId: string) => {
    const ex = allExercises.find(e => e.id === exerciseId);
    if (!ex) return;
    setWorkout(prev => prev ? { ...prev, exercises: [...prev.exercises, {
      exerciseId: ex.id,
      sets: [0, 1, 2].map(i => ({ id: `set-${Date.now()}-${i}`, weight: 0, reps: 8, rir: 1, completed: false })),
    }]} : prev);
    setShowExerciseSelector(false);
    setExerciseSearchTerm('');
    toast.success(`${ex.name} hinzugefügt`);
  };

  const handleFinishWorkout = async () => {
    if (!workout || isSaving) return;
    setIsSaving(true);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    const vol = workout.exercises.reduce((t, ex) =>
      t + ex.sets.reduce((st, s) => st + (s.completed ? s.weight * s.reps : 0), 0), 0);
    const completed: WorkoutSession = { ...workout, endTime, duration, totalVolume: vol };

    const current = useWorkoutStore.getState().workoutSessions;
    const updated = [...current, completed];
    useWorkoutStore.getState().setWorkoutSessions(updated);

    if (user) {
      try {
        const st = useWorkoutStore.getState();
        await syncData(
          { trainingDays: st.trainingDays, trainingPlans: st.trainingPlans, workoutSessions: updated, customExercises: st.customExercises },
          { nutritionGoals: nutritionStore.nutritionGoals, meals: nutritionStore.meals, supplements: nutritionStore.supplements, mealTemplates: nutritionStore.mealTemplates, customFoods: nutritionStore.customFoods, supplementPresets: nutritionStore.supplementPresets, sleepEntries: nutritionStore.sleepEntries, trackingSettings: nutritionStore.trackingSettings, trackedMeals: nutritionStore.trackedMeals }
        );
      } catch { toast.error('Fehler beim Cloud-Speichern'); }
    }

    setSummaryData(generateWorkoutSummary(completed, updated));
    setShowSummary(true);
    toast.success(`Training abgeschlossen! ${duration} Min • ${Math.round(vol)} kg`);
  };

  const handleCancelWorkout = () => {
    if (confirm('Training wirklich abbrechen?')) router.push('/tracker');
  };

  const scrollToExercise = (idx: number) => {
    setActiveExIdx(idx);
    exerciseRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(225,14%,10%)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[hsl(var(--fg-muted))]">Laden…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(225,14%,10%)]">
      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[hsl(225,14%,11%)] border-b border-[hsl(225,10%,16%)]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={handleCancelWorkout} className="p-2 rounded-xl hover:bg-[hsl(225,12%,15%)] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[hsl(var(--fg-secondary))]" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-[hsl(var(--fg-primary))] truncate">{workout.trainingDayName}</h1>
              <p className="text-xs text-[hsl(var(--fg-muted))]">{formatTime(elapsedTime)} · {completedSets}/{totalSets} Sätze · {Math.round(totalVolume)} kg</p>
            </div>
            {/* Progress pill */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-[hsl(225,12%,15%)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[hsl(var(--fg-secondary))] w-8 text-right">{progress}%</span>
            </div>
          </div>
        </div>

        {/* ── Exercise pill navigation ─────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {workout.exercises.map((ex, idx) => {
              const name = allExercises.find(e => e.id === ex.exerciseId)?.name || ex.exerciseId;
              const isDone = ex.sets.every(s => s.completed);
              const isActive = idx === activeExIdx;
              return (
                <button
                  key={idx}
                  onClick={() => scrollToExercise(idx)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-white'
                      : isDone
                      ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/20'
                      : 'bg-[hsl(225,12%,15%)] text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,20%)]'
                  }`}
                >
                  {isDone && !isActive && <CheckCircle className="w-3 h-3" />}
                  {truncate(name, 14)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Exercise list ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 pb-32">
        {workout.exercises.map((ex, exIdx) => {
          const exData = allExercises.find(e => e.id === ex.exerciseId);
          const exName = exData?.name || ex.exerciseId;
          const muscles = exData?.muscleGroups.slice(0, 3).join(', ') || '';
          const done = ex.sets.filter(s => s.completed).length;
          const isActive = exIdx === activeExIdx;

          const suggestion = getProgressionSuggestion(ex.exerciseId, 0, workoutSessions, trainingDayId);

          return (
            <div
              key={`${ex.exerciseId}-${exIdx}`}
              ref={el => { exerciseRefs.current[exIdx] = el; }}
              onClick={() => setActiveExIdx(exIdx)}
              className={`bg-[hsl(225,14%,11%)] rounded-2xl border transition-all ${
                isActive ? 'border-cyan-400/30' : 'border-[hsl(225,10%,16%)] opacity-90 hover:opacity-100'
              }`}
            >
              {/* Exercise header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    done === ex.sets.length ? 'bg-emerald-500 text-white' : 'bg-cyan-400/10 text-cyan-400'
                  }`}>
                    {done === ex.sets.length ? <CheckCircle className="w-4 h-4" /> : exIdx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[hsl(var(--fg-primary))] truncate">{exName}</p>
                    {muscles && <p className="text-xs text-[hsl(var(--fg-subtle))] truncate">{muscles}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-semibold text-[hsl(var(--fg-muted))] mr-1">{done}/{ex.sets.length}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setShowNoteInput(showNoteInput === exIdx ? null : exIdx); }}
                    className={`p-1.5 rounded-lg transition-colors ${exerciseNotes[exIdx] ? 'text-cyan-400 bg-cyan-400/10' : 'text-[hsl(var(--fg-subtle))] hover:bg-[hsl(225,12%,15%)]'}`}
                  >
                    <StickyNote className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleRemoveExercise(exIdx); }}
                    className="p-1.5 rounded-lg text-[hsl(var(--fg-subtle))] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progression suggestion */}
              {suggestion.type !== 'first_time' && isActive && (
                <div className={`mx-4 mb-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                  suggestion.type === 'stagnation_alert' ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                  : suggestion.type === 'deload' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                  : suggestion.type === 'increase_weight' || suggestion.type === 'increase_reps' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                  : 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                }`}>
                  {suggestion.type === 'stagnation_alert'
                    ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    : <TrendingUp className="w-3.5 h-3.5 shrink-0" />}
                  <span><strong>Ziel:</strong> {suggestion.message} — {suggestion.reason}</span>
                </div>
              )}

              {/* Exercise note */}
              <AnimatePresence>
                {showNoteInput === exIdx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4 mb-3"
                  >
                    <input
                      type="text"
                      value={exerciseNotes[exIdx] || ''}
                      onChange={e => setExerciseNotes(p => ({ ...p, [exIdx]: e.target.value }))}
                      placeholder="Notiz: z.B. Schulter gezwickt…"
                      className="w-full px-3 py-2 text-sm border border-cyan-400/20 rounded-xl bg-cyan-400/10 focus:outline-none focus:border-cyan-400/50 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Sets ──────────────────────────────────────────────── */}
              <div className="px-4 pb-3 space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[2rem_1fr_1fr_4rem_2.5rem] gap-2 px-1">
                  <div />
                  <p className="text-xs font-medium text-[hsl(var(--fg-subtle))] text-center">Gewicht</p>
                  <p className="text-xs font-medium text-[hsl(var(--fg-subtle))] text-center">Wdh.</p>
                  <p className="text-xs font-medium text-[hsl(var(--fg-subtle))] text-center">RIR</p>
                  <div />
                </div>

                {ex.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-[2rem_1fr_1fr_4rem_2.5rem] items-center gap-2 px-1 py-1.5 rounded-xl transition-colors ${
                      set.completed ? 'bg-emerald-400/10' : set.isWarmup ? 'bg-orange-400/10' : 'bg-[hsl(225,12%,13%)]'
                    }`}
                  >
                    {/* Set badge */}
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleWarmup(exIdx, setIdx); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                        set.isWarmup ? 'bg-orange-400 text-white' : set.completed ? 'bg-emerald-500 text-white' : 'bg-[hsl(225,14%,8%)] border border-[hsl(225,10%,20%)] text-[hsl(var(--fg-muted))]'
                      }`}
                      title="Als Aufwärmsatz markieren"
                    >
                      {set.isWarmup ? <Flame className="w-3.5 h-3.5" /> : setIdx + 1}
                    </button>

                    {/* Weight */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); updateSet(exIdx, setIdx, { weight: Math.max(set.isAssisted ? -200 : 0, set.weight - 2.5) }); }}
                        className="w-6 h-6 rounded-lg bg-[hsl(225,14%,8%)] border border-[hsl(225,10%,20%)] flex items-center justify-center hover:bg-[hsl(225,12%,15%)] shrink-0 text-[hsl(var(--fg-secondary))]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={set.weight === 0 ? '' : set.weight}
                        onChange={e => updateSet(exIdx, setIdx, { weight: parseFloat(e.target.value) || 0 })}
                        onClick={e => e.stopPropagation()}
                        placeholder={set.ghostWeight ? `${set.ghostWeight}` : '0'}
                        className={`flex-1 min-w-0 px-1.5 py-1.5 text-center text-sm font-semibold rounded-lg border outline-none transition-colors ${
                          set.completed ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300'
                          : 'bg-[hsl(225,14%,8%)] border-[hsl(225,10%,20%)] text-[hsl(var(--fg-primary))] focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]'
                        }`}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); updateSet(exIdx, setIdx, { weight: set.weight + 2.5 }); }}
                        className="w-6 h-6 rounded-lg bg-[hsl(225,14%,8%)] border border-[hsl(225,10%,20%)] flex items-center justify-center hover:bg-[hsl(225,12%,15%)] shrink-0 text-[hsl(var(--fg-secondary))]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Reps */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); updateSet(exIdx, setIdx, { reps: Math.max(0, set.reps - 1) }); }}
                        className="w-6 h-6 rounded-lg bg-[hsl(225,14%,8%)] border border-[hsl(225,10%,20%)] flex items-center justify-center hover:bg-[hsl(225,12%,15%)] shrink-0 text-[hsl(var(--fg-secondary))]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={e => updateSet(exIdx, setIdx, { reps: parseInt(e.target.value) || 0 })}
                        onClick={e => e.stopPropagation()}
                        placeholder="8"
                        className={`flex-1 min-w-0 px-1.5 py-1.5 text-center text-sm font-semibold rounded-lg border outline-none transition-colors ${
                          set.completed ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300'
                          : 'bg-[hsl(225,14%,8%)] border-[hsl(225,10%,20%)] text-[hsl(var(--fg-primary))] focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]'
                        }`}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); updateSet(exIdx, setIdx, { reps: set.reps + 1 }); }}
                        className="w-6 h-6 rounded-lg bg-[hsl(225,14%,8%)] border border-[hsl(225,10%,20%)] flex items-center justify-center hover:bg-[hsl(225,12%,15%)] shrink-0 text-[hsl(var(--fg-secondary))]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* RIR */}
                    <select
                      value={set.rir ?? 1}
                      onChange={e => { e.stopPropagation(); updateSet(exIdx, setIdx, { rir: parseInt(e.target.value) }); }}
                      onClick={e => e.stopPropagation()}
                      className={`w-full py-1.5 text-center text-sm font-semibold rounded-lg border outline-none transition-colors ${
                        set.completed ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300'
                        : 'bg-[hsl(225,14%,8%)] border-[hsl(225,10%,20%)] text-[hsl(var(--fg-primary))]'
                      }`}
                    >
                      {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>

                    {/* Complete toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleSet(exIdx, setIdx); }}
                      className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
                        set.completed ? 'bg-emerald-500 text-white' : 'bg-[hsl(225,14%,8%)] border border-[hsl(225,10%,20%)] text-[hsl(var(--fg-subtle))] hover:border-emerald-400 hover:text-emerald-400'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add set */}
                <button
                  onClick={e => { e.stopPropagation(); handleAddSet(exIdx); }}
                  className="w-full py-2 border border-dashed border-[hsl(225,10%,20%)] rounded-xl text-xs font-medium text-[hsl(var(--fg-muted))] hover:border-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Satz hinzufügen
                </button>
              </div>
            </div>
          );
        })}

        {/* Add exercise */}
        <button
          onClick={() => setShowExerciseSelector(true)}
          className="w-full py-3.5 border-2 border-dashed border-[hsl(225,10%,20%)] rounded-2xl text-[hsl(var(--fg-muted))] hover:border-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all font-medium text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Übung hinzufügen
        </button>
      </div>

      {/* ── Fixed bottom bar ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[hsl(225,14%,11%)] border-t border-[hsl(225,10%,16%)] p-3 lg:left-64">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={handleCancelWorkout}
            className="px-5 py-3 border border-[hsl(225,10%,16%)] rounded-xl text-sm font-semibold text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,13%)] transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleFinishWorkout}
            disabled={isSaving || completedSets === 0}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              completedSets === totalSets && totalSets > 0
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
                : completedSets > 0
                ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                : 'bg-[hsl(225,12%,20%)] text-[hsl(var(--fg-subtle))] cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Speichern…'
              : completedSets === totalSets && totalSets > 0 ? '🏆 Training abschließen'
              : completedSets > 0 ? `Training beenden (${completedSets}/${totalSets})`
              : 'Mindestens 1 Satz abschließen'}
          </button>
        </div>
      </div>

      {/* ── Rest Timer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {restTimer.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.9 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <div className={`rounded-2xl shadow-2xl p-4 text-white ${restTimer.seconds <= 10 ? 'bg-rose-500' : 'bg-cyan-500'}`}>
              <div className="flex items-center gap-3">
                <Timer className="w-7 h-7" />
                <div>
                  <p className="text-xs opacity-75">Pause</p>
                  <p className="text-2xl font-bold font-mono">
                    {Math.floor(restTimer.seconds / 60)}:{(restTimer.seconds % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <button onClick={stopRestTimer} className="ml-1 p-2 rounded-xl bg-white/20 hover:bg-white/30">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                {[60, 90, 120, 180].map(s => (
                  <button key={s} onClick={() => startRestTimer(s)}
                    className="flex-1 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-medium">
                    {Math.floor(s / 60)}:{(s % 60).toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest timer start button when inactive */}
      {!restTimer.isActive && (
        <button
          onClick={() => startRestTimer()}
          className="fixed bottom-24 right-4 z-50 p-3.5 bg-cyan-500 text-white rounded-2xl shadow-xl hover:bg-cyan-400 transition-all hover:scale-105"
          title="Pause Timer starten"
        >
          <Timer className="w-5 h-5" />
        </button>
      )}

      {/* ── Exercise Selector Modal ─────────────────────────────────────── */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[hsl(225,14%,11%)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(225,10%,14%)]">
              <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Übung hinzufügen</h2>
              <button onClick={() => { setShowExerciseSelector(false); setExerciseSearchTerm(''); }}
                className="p-2 hover:bg-[hsl(225,12%,15%)] rounded-xl transition-colors">
                <X className="w-5 h-5 text-[hsl(var(--fg-muted))]" />
              </button>
            </div>
            <div className="px-6 py-3 border-b border-[hsl(225,10%,14%)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg-subtle))]" />
                <input
                  type="text"
                  value={exerciseSearchTerm}
                  onChange={e => setExerciseSearchTerm(e.target.value)}
                  placeholder="Übung oder Muskelgruppe suchen…"
                  className="w-full pl-9 pr-4 py-2.5 border border-[hsl(225,10%,20%)] rounded-xl text-sm focus:outline-none focus:border-cyan-400/50 bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {filteredExercises.map(ex => (
                <button key={ex.id} onClick={() => handleAddExercise(ex.id)}
                  className="w-full p-4 text-left border border-[hsl(225,10%,16%)] rounded-xl hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[hsl(var(--fg-primary))] text-sm">{ex.name}</p>
                      <p className="text-xs text-[hsl(var(--fg-muted))] mt-0.5">{ex.muscleGroups.join(', ')}</p>
                    </div>
                    {ex.isCustom && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-400/10 text-violet-400 text-xs font-semibold shrink-0">Eigene</span>
                    )}
                  </div>
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-center text-[hsl(var(--fg-subtle))] py-10 text-sm">Keine Übung gefunden.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Workout Summary Modal ───────────────────────────────────────── */}
      {summaryData && (
        <WorkoutSummaryModal
          isOpen={showSummary}
          onClose={() => { setShowSummary(false); router.push('/tracker'); }}
          summary={summaryData}
        />
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(225,14%,10%)]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WorkoutContent />
    </Suspense>
  );
}
