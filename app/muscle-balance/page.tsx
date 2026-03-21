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
    'Rücken ist der grösste Oberkörpermuskel – priorisieren!',
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
    'Beine sind die grössten Muskeln – nicht vernachlässigen!',
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
    score >= 80 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
    score >= 60 ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' :
    score >= 40 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                  'text-rose-400 bg-rose-400/10 border-rose-400/20';

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
        <span className="font-medium text-[hsl(var(--fg-secondary))]">{leftLabel}</span>
        <span className="font-medium text-[hsl(var(--fg-secondary))]">{rightLabel}</span>
      </div>
      <div className="relative h-4 bg-[hsl(225,12%,15%)] rounded-full overflow-hidden flex">
        <div
          className={`h-full ${barColor} transition-all duration-700`}
          style={{ width: `${leftPct}%` }}
        />
        <div className="h-full bg-[hsl(225,12%,20%)] flex-1" />
      </div>
      <div className="flex items-center justify-between mt-1 text-xs text-[hsl(var(--fg-muted))]">
        <span>{leftPct}%</span>
        <span className={isBalanced ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
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
  const rankColors = ['bg-rose-400/10 text-rose-400', 'bg-orange-400/10 text-orange-400', 'bg-amber-400/10 text-amber-400'];
  return (
    <div className="flex items-start gap-4 p-4 bg-[hsl(225,14%,10%)] rounded-xl border border-[hsl(225,10%,16%)] hover:shadow-sm transition-shadow">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankColors[rank] || rankColors[2]}`}>
        {rank + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-[hsl(var(--fg-primary))]">{muscle}</p>
          {sets === 0 ? (
            <span className="text-xs bg-rose-400/10 text-rose-400 px-2 py-0.5 rounded-full font-medium">Nicht trainiert</span>
          ) : (
            <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">{sets.toFixed(1)} Sätze</span>
          )}
        </div>
        <p className="text-sm text-[hsl(var(--fg-muted))] leading-relaxed">{recommendation}</p>
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
            <h1 className="text-3xl font-bold text-[hsl(var(--fg-primary))]">Muskelbalance</h1>
            <p className="text-[hsl(var(--fg-muted))] mt-1">Analysiere deine Trainingsverteilung</p>
          </div>
          <div className="flex bg-[hsl(225,12%,15%)] rounded-xl p-1 flex-shrink-0">
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
                    ? 'bg-[hsl(225,14%,10%)] text-[hsl(var(--fg-primary))] shadow-sm'
                    : 'text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── No Data State ── */}
        {workoutSessions.length === 0 && (
          <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-12 text-center">
            <Scale className="w-16 h-16 text-[hsl(var(--fg-subtle))] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))] mb-2">Keine Daten vorhanden</h2>
            <p className="text-[hsl(var(--fg-muted))] max-w-md mx-auto">
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
                  color: 'bg-cyan-400/10 text-cyan-400',
                },
                {
                  icon: Scale,
                  label: 'Gewichtete Sätze',
                  value: Math.round(totalSets * 10) / 10,
                  sub: 'inkl. Hilfsmuskeln',
                  color: 'bg-emerald-400/10 text-emerald-400',
                },
                {
                  icon: TrendingUp,
                  label: 'Meisttrainiert',
                  value: mostTrained,
                  sub: `${(muscleVolume[mostTrained] || 0).toFixed(1)} Sätze`,
                  color: 'bg-violet-400/10 text-violet-400',
                },
                {
                  icon: Target,
                  label: 'Balancescore',
                  value: compositeScore,
                  sub: scoreLabel(compositeScore),
                  color: compositeScore >= 70 ? 'bg-emerald-400/10 text-emerald-400' : compositeScore >= 50 ? 'bg-amber-400/10 text-amber-400' : 'bg-rose-400/10 text-rose-400',
                },
              ].map(({ icon: Icon, label, value, sub, color }) => (
                <div key={label} className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[hsl(var(--fg-muted))] mb-1">{label}</p>
                      <p className="text-xl font-bold text-[hsl(var(--fg-primary))] truncate">{value}</p>
                      {sub && <p className="text-xs text-[hsl(var(--fg-subtle))] mt-0.5 truncate">{sub}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Balancescore Section ── */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-400/10 text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Balancescore</h2>
                  <p className="text-sm text-[hsl(var(--fg-muted))]">Push/Pull, Ober-/Unterkörper und Gesamtverteilung</p>
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
                  <div key={label} className="bg-[hsl(225,12%,13%)] rounded-xl p-4 text-center">
                    <ScoreBadge score={score} size="lg" />
                    <p className="font-semibold text-[hsl(var(--fg-primary))] mt-3">{label}</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))] mt-1">{description}</p>
                    <p className={`text-xs font-medium mt-1.5 ${
                      score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'
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
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-orange-400/10 text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))]">Schwachstellen</h2>
                  <p className="text-sm text-[hsl(var(--fg-muted))]">Muskelgruppen mit dem wenigsten Volumen – hier lohnt es sich anzusetzen</p>
                </div>
              </div>

              {filteredSessions.length === 0 ? (
                <p className="text-[hsl(var(--fg-subtle))] text-sm">Noch keine Daten für diesen Zeitraum.</p>
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
                <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-400/10 rounded-xl border border-emerald-400/20">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-emerald-400 font-medium">
                    Alle Hauptmuskelgruppen wurden in diesem Zeitraum trainiert.
                  </p>
                </div>
              )}
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-6">
                <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))] mb-1">Volumen pro Muskelgruppe</h2>
                <p className="text-sm text-[hsl(var(--fg-muted))] mb-5">
                  Primärer Muskel = 1,0 Satz · Hilfsmuskel = 0,5 Satz
                </p>
                <MuscleBalanceChart />
              </div>

              <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-6">
                <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))] mb-1">Trainingsfrequenz</h2>
                <p className="text-sm text-[hsl(var(--fg-muted))] mb-5">Trainingstage pro Muskelgruppe</p>
                <TrainingFrequencyAnalysis />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
