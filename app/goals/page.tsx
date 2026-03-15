'use client';

import { useState, useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { StrengthGoals } from '@/components/dashboard/StrengthGoals';
import { format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { Target, TrendingDown, TrendingUp, Dumbbell, Scale, CheckCircle2 } from 'lucide-react';

// ─── Body Weight Goal Card ───────────────────────────────────────────────────

function BodyWeightGoalCard() {
  const { entries, goal, setGoal, getLatestWeight } = useBodyWeightStore();
  const [editing, setEditing] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const currentWeight = getLatestWeight();

  const progress = useMemo(() => {
    if (!goal || currentWeight === null) return null;
    const totalChange = goal.targetWeight - goal.startWeight;
    if (totalChange === 0) return 100;
    const actualChange = currentWeight - goal.startWeight;
    return Math.min(100, Math.max(0, Math.round((actualChange / totalChange) * 100)));
  }, [goal, currentWeight]);

  const remaining = goal && currentWeight !== null
    ? Math.abs(goal.targetWeight - currentWeight).toFixed(1)
    : null;

  const isGain = goal ? goal.targetWeight > goal.startWeight : false;

  const handleSave = () => {
    if (!targetWeight) return;
    setGoal({
      targetWeight: parseFloat(targetWeight),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      startWeight: currentWeight ?? parseFloat(targetWeight),
      startDate: new Date(),
    });
    setEditing(false);
    setTargetWeight('');
    setTargetDate('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-bold text-slate-800">Körpergewicht-Ziel</h3>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition-colors"
        >
          {goal ? 'Ändern' : 'Ziel setzen'}
        </button>
      </div>

      {editing && (
        <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Zielgewicht (kg)</label>
              <input
                type="number"
                value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                placeholder={currentWeight?.toString() ?? 'z.B. 80'}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Zieldatum (optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!targetWeight}
              className="flex-1 rounded-xl bg-cyan-600 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-40 transition-colors"
            >
              Speichern
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {!goal ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          Noch kein Körpergewicht-Ziel gesetzt.
        </p>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-slate-800">
                {goal.targetWeight} kg {isGain ? 'aufbauen' : 'erreichen'}
              </p>
              <p className="text-xs text-slate-500">
                Start: {goal.startWeight} kg
                {goal.targetDate && ` · Ziel: ${format(new Date(goal.targetDate), 'd. MMM yyyy', { locale: de })}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {isGain ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-cyan-500" />}
              <span className={`text-sm font-bold ${progress === 100 ? 'text-emerald-600' : 'text-cyan-600'}`}>
                {progress ?? 0}%
              </span>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200 mb-2">
            <div
              className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Aktuell: {currentWeight !== null ? `${currentWeight} kg` : 'kein Eintrag'}</span>
            {progress === 100 ? (
              <span className="font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ziel erreicht!
              </span>
            ) : remaining ? (
              <span>Noch {remaining} kg {isGain ? 'zunehmen' : 'abnehmen'}</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Weekly Volume Goal Card ─────────────────────────────────────────────────

function WeeklyVolumeGoalCard() {
  const { workoutSessions, weeklyVolumeGoalSets, setWeeklyVolumeGoalSets } = useWorkoutStore();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  const thisWeekSets = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return workoutSessions
      .filter(s => new Date(s.startTime) >= weekStart)
      .reduce((total, s) =>
        total + s.exercises.reduce((ex, e) =>
          ex + e.sets.filter(set => set.completed).length, 0), 0);
  }, [workoutSessions]);

  const lastWeekSets = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    return workoutSessions
      .filter(s => {
        const d = new Date(s.startTime);
        return d >= lastWeekStart && d < weekStart;
      })
      .reduce((total, s) =>
        total + s.exercises.reduce((ex, e) =>
          ex + e.sets.filter(set => set.completed).length, 0), 0);
  }, [workoutSessions]);

  const progress = weeklyVolumeGoalSets
    ? Math.min(100, Math.round((thisWeekSets / weeklyVolumeGoalSets) * 100))
    : null;

  const handleSave = () => {
    const val = parseInt(input);
    if (val > 0) setWeeklyVolumeGoalSets(val);
    setEditing(false);
    setInput('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-bold text-slate-800">Wöchentliches Volumen</h3>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
        >
          {weeklyVolumeGoalSets ? 'Ändern' : 'Ziel setzen'}
        </button>
      </div>

      {editing && (
        <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Ziel: Sätze pro Woche</label>
            <input
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={lastWeekSets > 0 ? `z.B. ${lastWeekSets + 5}` : 'z.B. 30'}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!input || parseInt(input) <= 0}
              className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
            >
              Speichern
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {!weeklyVolumeGoalSets ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Noch kein Wochen-Ziel gesetzt.
          </p>
          {lastWeekSets > 0 && (
            <p className="text-xs text-slate-400 px-1">
              Letzte Woche: <span className="font-semibold text-slate-600">{lastWeekSets} Sätze</span>
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-slate-800">
                {thisWeekSets} / {weeklyVolumeGoalSets} Sätze diese Woche
              </p>
              <p className="text-xs text-slate-500">
                Letzte Woche: {lastWeekSets} Sätze
                {lastWeekSets > 0 && thisWeekSets > lastWeekSets && (
                  <span className="ml-1 text-emerald-600 font-medium">↑ besser!</span>
                )}
              </p>
            </div>
            <span className={`text-sm font-bold ${progress === 100 ? 'text-emerald-600' : 'text-violet-600'}`}>
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200 mb-2">
            <div
              className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs text-slate-500">
            {progress === 100 ? (
              <span className="font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Wochenziel erreicht!
              </span>
            ) : (
              <span>Noch {weeklyVolumeGoalSets - thisWeekSets} Sätze bis zum Ziel</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Target className="w-7 h-7 text-primary-500" />
          <h1 className="text-2xl font-bold text-slate-800">Meine Ziele</h1>
        </div>
        <p className="text-sm text-slate-500 ml-10">
          Setze klare Ziele und verfolge deinen Fortschritt über die Zeit.
        </p>
      </div>

      <div className="space-y-5">
        <StrengthGoals />
        <BodyWeightGoalCard />
        <WeeklyVolumeGoalCard />
      </div>
    </div>
  );
}
