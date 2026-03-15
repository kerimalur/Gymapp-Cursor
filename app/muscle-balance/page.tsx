'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MuscleBalanceChart } from '@/components/statistics/MuscleBalanceChart';
import { TrainingFrequencyAnalysis } from '@/components/statistics/TrainingFrequencyAnalysis';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Scale, Activity, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MuscleVolumes {
  [muscle: string]: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MUSCLE_GROUP_MAP: Record<string, string> = {
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
  adductors: 'Beine',
  abductors: 'Beine',
  abs: 'Core',
  lower_back: 'Rücken',
  neck: 'Schultern',
};

// Push / Pull classification of German muscle categories
const PUSH_MUSCLES = new Set(['Brust', 'Schultern', 'Trizeps']);
const PULL_MUSCLES = new Set(['Rücken', 'Bizeps']);
const UPPER_MUSCLES = new Set(['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Unterarme']);
const LOWER_MUSCLES = new Set(['Beine']);

// Weakness recommendations per muscle group
const RECOMMENDATIONS: Record<string, string[]> = {
  Brust: [
    'Füge Bankdrücken oder Schrägbankdrücken hinzu',
    'Kabelzug-Crossover für Isolationsarbeit',
    'Mindestens 10 Sätze/Woche für Brust anstreben',
  ],
  Rücken: [
    'Latziehen und Rudern kombinieren',
    'Klimmzüge für vertikales Ziehen',
    'Rücken ist der größte Oberkörpermuskel – priorisieren!',
  ],
  Schultern: [
    'Schulterdrücken als Compound-Übung einbauen',
    'Seitheben für seitlichen Deltamuskel',
    'Hintere Schulter mit Face Pulls trainieren',
  ],
  Bizeps: [
    'Kurzhantel-Curls oder Kabelcurls ergänzen',
    'Hammer Curls für Unterarmstärke',
    'Bizeps wird bei Rücken-Übungen mittrainiert',
  ],
  Trizeps: [
    'Trizeps macht ~2/3 des Oberarms aus',
    'Trizepsdrücken oder Dips ergänzen',
    'Wird bei Drückübungen automatisch mitbelastet',
  ],
  Beine: [
    'Kniebeuge und Kreuzheben priorisieren',
    'Beine sind die größten Muskeln – nicht vernachlässigen!',
    'Beintraining fördert auch Hormonausschüttung',
  ],
  Core: [
    'Planks und Hollow-Body-Holds einbauen',
    'Core stabilisiert alle Compound-Übungen',
    'Hängendes Knieheben für unteres Abdomen',
  ],
  Unterarme: [
    'Farmer Walks für funktionelle Griffkraft',
    'Reverse Curls ergänzen',
    'Griffkraft verbessert alle Zugübungen',
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color =
    score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    score >= 60 ? 'text-blue-700 bg-blue-50 border-blue-200' :
    score >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-rose-700 bg-rose-50 border-rose-200';

  const textSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  return (
    <span className={`inline-flex items-center justify-center font-black border rounded-xl px-3 py-1 ${color} ${textSize}`}>
      {score}
    </span>
  );
}

function BalanceBar({
  leftLabel, leftValue, rightLabel, rightValue,
}: {
  leftLabel: string; leftValue: number;
  rightLabel: string; rightValue: number;
}) {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? Math.round((leftValue / total) * 100) : 50;
  const rightPct = 100 - leftPct;
  const isBalanced = leftPct >= 40 && leftPct <= 60;
  const barColor = isBalanced ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="font-medium text-slate-700">{leftLabel}</span>
        <span className="font-medium text-slate-700">{rightLabel}</span>
      </div>
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex">
        <div
          className={`h-full ${barColor} transition-all duration-700`}
          style={{ width: `${leftPct}%` }}
        />
        <div className="h-full bg-slate-200 flex-1" />
      </div>
      <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
        <span>{leftPct}%</span>
        <span className={isBalanced ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
          {isBalanced ? 'Gut ausgewogen' : 'Ungleichgewicht'}
        </span>
        <span>{rightPct}%</span>
      </div>
    </div>
  );
}

function WeaknessCard({
  rank, muscle, sets, recommendation,
}: {
  rank: number; muscle: string; sets: number; recommendation: string;
}) {
  const rankColors = ['bg-rose-100 text-rose-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700'];
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankColors[rank] || rankColors[2]}`}>
        {rank + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-slate-800">{muscle}</p>
          {sets === 0 ? (
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">Nicht trainiert</span>
          ) : (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{sets.toFixed(1)} Sätze</span>
          )}
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{recommendation}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MuscleBalancePage() {
  const { workoutSessions } = useWorkoutStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  // ── Filtered sessions ──────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    const now = new Date();
    if (timeRange === 'week') {
      const start = startOfWeek(now, { locale: de, weekStartsOn: 1 });
      const end = endOfWeek(now, { locale: de, weekStartsOn: 1 });
      return workoutSessions.filter(s =>
        isWithinInterval(new Date(s.startTime), { start, end })
      );
    }
    if (timeRange === 'month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return workoutSessions.filter(s =>
        isWithinInterval(new Date(s.startTime), { start, end })
      );
    }
    return workoutSessions;
  }, [workoutSessions, timeRange]);

  // ── Corrected muscle volume (primary = 1.0, secondary = 0.5) ──────────────
  const muscleVolume: MuscleVolumes = useMemo(() => {
    const volumes: MuscleVolumes = {};

    filteredSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exData = exerciseDatabase.find(e => e.id === ex.exerciseId);
        if (!exData) return;

        const completedSets = ex.sets.filter(s => s.completed).length;
        if (completedSets === 0) return;

        if (exData.muscles && exData.muscles.length > 0) {
          // Use detailed muscles array with role
          exData.muscles.forEach(({ muscle, role }) => {
            const germanName = MUSCLE_GROUP_MAP[muscle] || muscle;
            const weight = role === 'primary' ? 1.0 : 0.5;
            volumes[germanName] = (volumes[germanName] || 0) + completedSets * weight;
          });
        } else if (exData.muscleGroups && exData.muscleGroups.length > 0) {
          // Fallback: first = primary
          const primaryGerman = MUSCLE_GROUP_MAP[exData.muscleGroups[0]] || exData.muscleGroups[0];
          volumes[primaryGerman] = (volumes[primaryGerman] || 0) + completedSets;
          // remaining = secondary
          exData.muscleGroups.slice(1).forEach(mg => {
            const germanName = MUSCLE_GROUP_MAP[mg] || mg;
            volumes[germanName] = (volumes[germanName] || 0) + completedSets * 0.5;
          });
        }
      });
    });

    return volumes;
  }, [filteredSessions]);

  // ── Push / Pull balance ────────────────────────────────────────────────────
  const pushPullBalance = useMemo(() => {
    let push = 0;
    let pull = 0;
    Object.entries(muscleVolume).forEach(([muscle, vol]) => {
      if (PUSH_MUSCLES.has(muscle)) push += vol;
      else if (PULL_MUSCLES.has(muscle)) pull += vol;
    });
    return { push, pull };
  }, [muscleVolume]);

  // ── Upper / Lower balance ──────────────────────────────────────────────────
  const upperLowerBalance = useMemo(() => {
    let upper = 0;
    let lower = 0;
    Object.entries(muscleVolume).forEach(([muscle, vol]) => {
      if (UPPER_MUSCLES.has(muscle)) upper += vol;
      else if (LOWER_MUSCLES.has(muscle)) lower += vol;
    });
    return { upper, lower };
  }, [muscleVolume]);

  // ── Overall Balance Score (0–100) ──────────────────────────────────────────
  // Based on coefficient of variation across all main muscle categories
  const balanceScore = useMemo(() => {
    const mainMuscles = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Beine', 'Core'];
    const values = mainMuscles.map(m => muscleVolume[m] || 0);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg === 0) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const cv = Math.sqrt(variance) / avg; // coefficient of variation
    return Math.max(0, Math.round(100 - cv * 60));
  }, [muscleVolume]);

  // Push/Pull score
  const pushPullScore = useMemo(() => {
    const { push, pull } = pushPullBalance;
    const total = push + pull;
    if (total === 0) return 50;
    const ratio = push / total;
    // Ideal ~0.5. Deviation from 0.5 reduces score.
    return Math.round(100 - Math.abs(ratio - 0.5) * 200);
  }, [pushPullBalance]);

  // Upper/Lower score
  const upperLowerScore = useMemo(() => {
    const { upper, lower } = upperLowerBalance;
    const total = upper + lower;
    if (total === 0) return 50;
    const ratio = upper / total;
    // Ideal ~0.6 upper / 0.4 lower (typical recommendation)
    return Math.round(100 - Math.abs(ratio - 0.6) * 200);
  }, [upperLowerBalance]);

  // Composite balance score
  const compositeScore = useMemo(() => {
    if (filteredSessions.length === 0) return 0;
    return Math.round((balanceScore + pushPullScore + upperLowerScore) / 3);
  }, [balanceScore, pushPullScore, upperLowerScore, filteredSessions.length]);

  const scoreLabel = (s: number) =>
    s >= 80 ? 'Sehr ausgewogen' :
    s >= 60 ? 'Gut ausgewogen' :
    s >= 40 ? 'Verbesserungswürdig' :
              'Unausgewogen';

  // ── Weaknesses ─────────────────────────────────────────────────────────────
  const weaknesses = useMemo(() => {
    const mainMuscles = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Beine', 'Core', 'Unterarme'];
    return mainMuscles
      .map(muscle => ({ muscle, sets: muscleVolume[muscle] || 0 }))
      .sort((a, b) => a.sets - b.sets)
      .slice(0, 3)
      .map(({ muscle, sets }) => ({
        muscle,
        sets,
        recommendation: (RECOMMENDATIONS[muscle] || ['Mehr Volumen für diese Muskelgruppe einplanen'])[0],
      }));
  }, [muscleVolume]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalSets = useMemo(() =>
    Object.values(muscleVolume).reduce((a, b) => a + b, 0),
    [muscleVolume]
  );

  const mostTrained = useMemo(() => {
    const entries = Object.entries(muscleVolume);
    if (entries.length === 0) return '-';
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [muscleVolume]);

  const timeRangeLabel =
    timeRange === 'week' ? 'Diese Woche' :
    timeRange === 'month' ? 'Diesen Monat' : 'Gesamt';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Muskelbalance</h1>
            <p className="text-slate-500 mt-1">Analysiere deine Trainingsverteilung</p>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-1 flex-shrink-0">
            {[
              { key: 'week', label: 'Woche' },
              { key: 'month', label: 'Monat' },
              { key: 'all', label: 'Alles' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key as typeof timeRange)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── No Data State ── */}
        {workoutSessions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Keine Daten vorhanden</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Schließe dein erstes Training ab, um hier deine Muskelbalance zu sehen.
            </p>
          </div>
        )}

        {workoutSessions.length > 0 && (
          <>
            {/* ── Quick Stats Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: Activity,
                  label: 'Trainings',
                  value: filteredSessions.length,
                  sub: timeRangeLabel,
                  color: 'bg-blue-100 text-blue-700',
                },
                {
                  icon: Scale,
                  label: 'Gewichtete Sätze',
                  value: Math.round(totalSets * 10) / 10,
                  sub: 'inkl. Hilfsmuskeln',
                  color: 'bg-emerald-100 text-emerald-700',
                },
                {
                  icon: TrendingUp,
                  label: 'Meisttrainiert',
                  value: mostTrained,
                  sub: `${(muscleVolume[mostTrained] || 0).toFixed(1)} Sätze`,
                  color: 'bg-violet-100 text-violet-700',
                },
                {
                  icon: Target,
                  label: 'Balancescore',
                  value: compositeScore,
                  sub: scoreLabel(compositeScore),
                  color: compositeScore >= 70 ? 'bg-emerald-100 text-emerald-700' : compositeScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700',
                },
              ].map(({ icon: Icon, label, value, sub, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                      <p className="text-xl font-bold text-slate-800 truncate">{value}</p>
                      {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Balancescore Section ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Balancescore</h2>
                  <p className="text-sm text-slate-500">Push/Pull, Ober-/Unterkörper und Gesamtverteilung</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  {
                    label: 'Gesamtverteilung',
                    score: balanceScore,
                    description: 'Gleichmäßigkeit über alle Muskelgruppen',
                  },
                  {
                    label: 'Push / Pull',
                    score: pushPullScore,
                    description: 'Drück- vs. Zugübungen',
                  },
                  {
                    label: 'Ober / Unter',
                    score: upperLowerScore,
                    description: 'Oberkörper vs. Beine',
                  },
                ].map(({ label, score, description }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                    <ScoreBadge score={score} size="lg" />
                    <p className="font-semibold text-slate-800 mt-3">{label}</p>
                    <p className="text-xs text-slate-500 mt-1">{description}</p>
                    <p className={`text-xs font-medium mt-1.5 ${
                      score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {scoreLabel(score)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Push/Pull bar */}
              <div className="space-y-4">
                <BalanceBar
                  leftLabel="Push (Brust / Schultern / Trizeps)"
                  leftValue={pushPullBalance.push}
                  rightLabel="Pull (Rücken / Bizeps)"
                  rightValue={pushPullBalance.pull}
                />
                <BalanceBar
                  leftLabel="Oberkörper"
                  leftValue={upperLowerBalance.upper}
                  rightLabel="Beine"
                  rightValue={upperLowerBalance.lower}
                />
              </div>
            </div>

            {/* ── Schwachstellen Section ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Schwachstellen</h2>
                  <p className="text-sm text-slate-500">Muskelgruppen mit dem wenigsten Volumen – hier lohnt es sich anzusetzen</p>
                </div>
              </div>

              {filteredSessions.length === 0 ? (
                <p className="text-slate-400 text-sm">Noch keine Daten für diesen Zeitraum.</p>
              ) : (
                <div className="space-y-3">
                  {weaknesses.map((w, i) => (
                    <WeaknessCard
                      key={w.muscle}
                      rank={i}
                      muscle={w.muscle}
                      sets={w.sets}
                      recommendation={w.recommendation}
                    />
                  ))}
                </div>
              )}

              {filteredSessions.length > 0 && weaknesses.every(w => w.sets > 0) && (
                <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 font-medium">
                    Alle Hauptmuskelgruppen wurden in diesem Zeitraum trainiert.
                  </p>
                </div>
              )}
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Volumen pro Muskelgruppe</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Primärer Muskel = 1,0 Satz · Hilfsmuskel = 0,5 Satz
                </p>
                <MuscleBalanceChart />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Trainingsfrequenz</h2>
                <p className="text-sm text-slate-500 mb-5">Trainingstage pro Muskelgruppe</p>
                <TrainingFrequencyAnalysis />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
