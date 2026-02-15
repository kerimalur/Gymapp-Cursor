'use client';

import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AutoRegulationRecommendation {
  exerciseId: string;
  exerciseName: string;
  lastWeight: number;
  lastReps: number;
  lastRIR: number | undefined;
  avgRIR: number;
  recommendedWeight: number;
  recommendation: 'increase' | 'maintain' | 'decrease' | 'deload';
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export function AutoRegulationTracker() {
  const { workoutSessions, trainingDays } = useWorkoutStore();
  
  // Calculate recommendations for each exercise
  const recommendations = useMemo(() => {
    const exerciseRecommendations: AutoRegulationRecommendation[] = [];
    const exerciseHistory = new Map<string, Array<{
      date: Date;
      weight: number;
      reps: number;
      rir: number | undefined;
      volume: number;
    }>>();
    
    // Collect exercise history from last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentSessions = workoutSessions
      .filter(s => new Date(s.startTime) >= fourWeeksAgo)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Build exercise history
    recentSessions.forEach(session => {
      session.exercises.forEach(ex => {
        // Only count completed sets with weight > 0
        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0);
        if (completedSets.length === 0) return;
        
        // Calculate best set (highest weight x reps)
        const bestSet = completedSets.reduce((best, set) => {
          const volume = set.weight * set.reps;
          const bestVolume = best.weight * best.reps;
          return volume > bestVolume ? set : best;
        }, completedSets[0]);
        
        // Calculate average RIR for this exercise in this session
        const rirValues = completedSets
          .filter(s => s.rir !== undefined)
          .map(s => s.rir as number);
        const avgRIR = rirValues.length > 0 
          ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length 
          : undefined;
        
        if (!exerciseHistory.has(ex.exerciseId)) {
          exerciseHistory.set(ex.exerciseId, []);
        }
        
        exerciseHistory.get(ex.exerciseId)?.push({
          date: new Date(session.startTime),
          weight: bestSet.weight,
          reps: bestSet.reps,
          rir: avgRIR,
          volume: completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0)
        });
      });
    });
    
    // Generate recommendations for each exercise
    exerciseHistory.forEach((history, exerciseId) => {
      if (history.length < 2) return; // Need at least 2 sessions for comparison
      
      const exercise = exerciseDatabase.find(e => e.id === exerciseId);
      if (!exercise) return;
      
      const latestSession = history[history.length - 1];
      const previousSessions = history.slice(0, -1);
      
      // Calculate average RIR across all sessions
      const allRIRs = history
        .filter(h => h.rir !== undefined)
        .map(h => h.rir as number);
      const avgRIR = allRIRs.length > 0 
        ? allRIRs.reduce((a, b) => a + b, 0) / allRIRs.length 
        : 2; // Default to RIR 2 if no data
      
      // Calculate weight progression trend
      const weights = history.map(h => h.weight);
      const avgPreviousWeight = previousSessions.reduce((sum, s) => sum + s.weight, 0) / previousSessions.length;
      
      // Determine recommendation based on RIR
      let recommendation: 'increase' | 'maintain' | 'decrease' | 'deload';
      let recommendedWeight: number;
      let reason: string;
      let confidence: 'high' | 'medium' | 'low';
      
      const lastRIR = latestSession.rir ?? avgRIR;
      
      if (lastRIR >= 3) {
        // RIR 3+ = Too easy, increase weight
        recommendation = 'increase';
        recommendedWeight = Math.round((latestSession.weight * 1.025) / 2.5) * 2.5; // +2.5%, rounded to 2.5kg
        if (recommendedWeight === latestSession.weight) {
          recommendedWeight = latestSession.weight + 2.5;
        }
        reason = `RIR ${lastRIR.toFixed(1)} - Du hast noch Reserven! Zeit für mehr Gewicht.`;
        confidence = lastRIR >= 4 ? 'high' : 'medium';
      } else if (lastRIR >= 1.5) {
        // RIR 1.5-3 = Sweet spot, maintain or slight increase
        recommendation = 'maintain';
        recommendedWeight = latestSession.weight;
        
        // Check if consistently in sweet spot - might suggest slight increase
        if (allRIRs.length >= 3 && avgRIR >= 2) {
          recommendation = 'increase';
          recommendedWeight = latestSession.weight + 2.5;
          reason = `RIR ${lastRIR.toFixed(1)} - Stabile Performance. Nächste Steigerung möglich.`;
        } else {
          reason = `RIR ${lastRIR.toFixed(1)} - Optimale Intensität. Gewicht beibehalten.`;
        }
        confidence = 'high';
      } else if (lastRIR >= 0.5) {
        // RIR 0.5-1.5 = Hard, maintain weight
        recommendation = 'maintain';
        recommendedWeight = latestSession.weight;
        reason = `RIR ${lastRIR.toFixed(1)} - Hohe Intensität. Gewicht beibehalten für Anpassung.`;
        confidence = 'high';
      } else {
        // RIR < 0.5 = Too hard, might need deload
        recommendation = 'decrease';
        recommendedWeight = Math.round((latestSession.weight * 0.95) / 2.5) * 2.5; // -5%, rounded
        reason = `RIR ${lastRIR.toFixed(1)} - Zu hart! Reduziere Gewicht oder mache ein Deload.`;
        confidence = 'high';
      }
      
      // Check for deload indicators (3+ sessions with RIR < 1)
      const recentLowRIR = history.slice(-3).filter(h => h.rir !== undefined && h.rir < 1);
      if (recentLowRIR.length >= 3) {
        recommendation = 'deload';
        recommendedWeight = Math.round((latestSession.weight * 0.6) / 2.5) * 2.5; // -40%
        reason = '3+ Sessions mit RIR < 1. Deload empfohlen: -40% Gewicht, -40% Volumen.';
        confidence = 'high';
      }
      
      exerciseRecommendations.push({
        exerciseId,
        exerciseName: exercise.name,
        lastWeight: latestSession.weight,
        lastReps: latestSession.reps,
        lastRIR: latestSession.rir,
        avgRIR,
        recommendedWeight,
        recommendation,
        reason,
        confidence
      });
    });
    
    return exerciseRecommendations;
  }, [workoutSessions]);
  
  const getRecommendationIcon = (rec: 'increase' | 'maintain' | 'decrease' | 'deload') => {
    switch (rec) {
      case 'increase': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'maintain': return <Minus className="w-5 h-5 text-blue-500" />;
      case 'decrease': return <TrendingDown className="w-5 h-5 text-orange-500" />;
      case 'deload': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };
  
  const getRecommendationColor = (rec: 'increase' | 'maintain' | 'decrease' | 'deload') => {
    switch (rec) {
      case 'increase': return 'bg-emerald-50 border-emerald-200';
      case 'maintain': return 'bg-blue-50 border-blue-200';
      case 'decrease': return 'bg-orange-50 border-orange-200';
      case 'deload': return 'bg-red-50 border-red-200';
    }
  };
  
  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Hohe Konfidenz</span>;
      case 'medium': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Mittlere Konfidenz</span>;
      case 'low': return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Niedrige Konfidenz</span>;
    }
  };
  
  // Group by recommendation type
  const increaseRecs = recommendations.filter(r => r.recommendation === 'increase');
  const maintainRecs = recommendations.filter(r => r.recommendation === 'maintain');
  const decreaseRecs = recommendations.filter(r => r.recommendation === 'decrease' || r.recommendation === 'deload');
  
  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Auto-Regulation</h3>
        </div>
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Trainiere mit RIR-Tracking für automatische Empfehlungen.</p>
          <p className="text-sm text-slate-400 mt-1">Mindestens 2 Sessions pro Übung benötigt.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Auto-Regulation Empfehlungen</h3>
          <p className="text-sm text-slate-500">Basierend auf deinem RIR der letzten 4 Wochen</p>
        </div>
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{increaseRecs.length}</p>
          <p className="text-sm text-emerald-700">Steigern</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{maintainRecs.length}</p>
          <p className="text-sm text-blue-700">Beibehalten</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{decreaseRecs.length}</p>
          <p className="text-sm text-orange-700">Reduzieren</p>
        </div>
      </div>
      
      {/* Recommendations list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recommendations.map((rec) => (
          <div 
            key={rec.exerciseId} 
            className={`p-4 rounded-xl border ${getRecommendationColor(rec.recommendation)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getRecommendationIcon(rec.recommendation)}
                <div>
                  <h4 className="font-semibold text-slate-800">{rec.exerciseName}</h4>
                  <p className="text-sm text-slate-600">
                    Letztes Training: {rec.lastWeight}kg × {rec.lastReps} 
                    {rec.lastRIR !== undefined && ` (RIR ${rec.lastRIR.toFixed(1)})`}
                  </p>
                </div>
              </div>
              {getConfidenceBadge(rec.confidence)}
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-slate-600">{rec.reason}</p>
              <div className="text-right">
                <p className="text-xs text-slate-500">Empfohlen</p>
                <p className="text-lg font-bold text-slate-800">{rec.recommendedWeight} kg</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
