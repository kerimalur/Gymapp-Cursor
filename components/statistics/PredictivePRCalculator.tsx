'use client';

import { useMemo, useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { Target, TrendingUp, Calendar, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface PRPrediction {
  exerciseId: string;
  exerciseName: string;
  currentMax: number;
  currentMaxDate: Date;
  weeklyProgressRate: number; // kg per week
  predictions: {
    targetWeight: number;
    estimatedDate: Date;
    weeksAway: number;
    confidence: 'high' | 'medium' | 'low';
  }[];
  trendData: { date: Date; weight: number }[];
}

export function PredictivePRCalculator() {
  const { workoutSessions } = useWorkoutStore();
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [customTarget, setCustomTarget] = useState<{ [key: string]: string }>({});
  
  // Calculate PR predictions for each exercise
  const predictions = useMemo(() => {
    const exercisePredictions: PRPrediction[] = [];
    const exerciseMaxes = new Map<string, Array<{ date: Date; weight: number }>>();
    
    // Collect max weights per exercise over time
    workoutSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const completedSets = ex.sets.filter(s => s.completed && s.weight > 0);
        if (completedSets.length === 0) return;
        
        const maxWeight = Math.max(...completedSets.map(s => s.weight));
        
        if (!exerciseMaxes.has(ex.exerciseId)) {
          exerciseMaxes.set(ex.exerciseId, []);
        }
        
        exerciseMaxes.get(ex.exerciseId)?.push({
          date: new Date(session.startTime),
          weight: maxWeight
        });
      });
    });
    
    // Calculate predictions for each exercise
    exerciseMaxes.forEach((history, exerciseId) => {
      if (history.length < 3) return; // Need at least 3 data points
      
      const exercise = exerciseDatabase.find(e => e.id === exerciseId);
      if (!exercise) return;
      
      // Sort by date
      const sortedHistory = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Calculate running max (PR at each point)
      let runningMax = 0;
      const prHistory: { date: Date; weight: number }[] = [];
      
      sortedHistory.forEach(entry => {
        if (entry.weight > runningMax) {
          runningMax = entry.weight;
          prHistory.push({ date: entry.date, weight: runningMax });
        }
      });
      
      if (prHistory.length < 2) return;
      
      // Calculate weekly progression rate using linear regression
      const currentMax = prHistory[prHistory.length - 1].weight;
      const currentMaxDate = prHistory[prHistory.length - 1].date;
      const firstPR = prHistory[0];
      
      const totalDays = differenceInDays(currentMaxDate, firstPR.date);
      const totalWeeks = Math.max(1, totalDays / 7);
      const totalGain = currentMax - firstPR.weight;
      
      // Calculate weekly progress rate
      let weeklyProgressRate = totalGain / totalWeeks;
      
      // Adjust for diminishing returns (more weight = slower progress)
      // Roughly: heavier weights progress slower
      const diminishingFactor = Math.max(0.3, 1 - (currentMax / 300)); // Slower at heavier weights
      weeklyProgressRate = weeklyProgressRate * diminishingFactor;
      
      // Minimum progress rate of 0.25kg/week for active exercises
      if (weeklyProgressRate < 0.25 && totalGain > 0) {
        weeklyProgressRate = 0.25;
      }
      
      // Generate predictions for milestone weights
      const milestones: number[] = [];
      const roundedCurrent = Math.ceil(currentMax / 5) * 5;
      
      // Add next 5 milestones (every 5kg or 10kg depending on weight)
      const step = currentMax >= 100 ? 10 : 5;
      for (let i = 1; i <= 5; i++) {
        const milestone = roundedCurrent + (step * i);
        if (milestone > currentMax) {
          milestones.push(milestone);
        }
      }
      
      // Calculate predictions
      const milePredictions = milestones.map(target => {
        const kgToGain = target - currentMax;
        const weeksNeeded = weeklyProgressRate > 0 ? kgToGain / weeklyProgressRate : 999;
        const estimatedDate = addDays(new Date(), weeksNeeded * 7);
        
        // Confidence based on data quality and prediction distance
        let confidence: 'high' | 'medium' | 'low';
        if (weeksNeeded <= 8 && prHistory.length >= 5) {
          confidence = 'high';
        } else if (weeksNeeded <= 16 && prHistory.length >= 3) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
        
        return {
          targetWeight: target,
          estimatedDate,
          weeksAway: Math.round(weeksNeeded),
          confidence
        };
      });
      
      exercisePredictions.push({
        exerciseId,
        exerciseName: exercise.name,
        currentMax,
        currentMaxDate,
        weeklyProgressRate: Math.round(weeklyProgressRate * 100) / 100,
        predictions: milePredictions,
        trendData: prHistory
      });
    });
    
    // Sort by most recent PR
    return exercisePredictions.sort((a, b) => 
      b.currentMaxDate.getTime() - a.currentMaxDate.getTime()
    );
  }, [workoutSessions]);
  
  // Calculate custom target
  const getCustomPrediction = (exerciseId: string) => {
    const pred = predictions.find(p => p.exerciseId === exerciseId);
    const target = parseFloat(customTarget[exerciseId] || '0');
    
    if (!pred || !target || target <= pred.currentMax) return null;
    
    const kgToGain = target - pred.currentMax;
    const weeksNeeded = pred.weeklyProgressRate > 0 ? kgToGain / pred.weeklyProgressRate : 999;
    const estimatedDate = addDays(new Date(), weeksNeeded * 7);
    
    return {
      targetWeight: target,
      estimatedDate,
      weeksAway: Math.round(weeksNeeded)
    };
  };
  
  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-emerald-600 bg-emerald-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-slate-500 bg-slate-50';
    }
  };
  
  if (predictions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">PR Prognose</h3>
        </div>
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Trainiere mindestens 3 Sessions für Prognosen.</p>
          <p className="text-sm text-slate-400 mt-1">Je mehr Daten, desto genauer die Vorhersagen.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">PR Prognose Calculator</h3>
          <p className="text-sm text-slate-500">Wann erreichst du dein Zielgewicht?</p>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {predictions.slice(0, 10).map((pred) => (
          <div key={pred.exerciseId} className="border border-slate-100 rounded-xl overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedExercise(
                expandedExercise === pred.exerciseId ? null : pred.exerciseId
              )}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-slate-800">{pred.exerciseName}</h4>
                  <p className="text-sm text-slate-500">
                    Aktueller PR: <span className="font-bold text-amber-600">{pred.currentMax} kg</span>
                    <span className="mx-2">•</span>
                    +{pred.weeklyProgressRate} kg/Woche
                  </p>
                </div>
              </div>
              {expandedExercise === pred.exerciseId ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            {/* Expanded content */}
            {expandedExercise === pred.exerciseId && (
              <div className="px-4 pb-4 space-y-4">
                {/* Milestone predictions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pred.predictions.map((milestone) => (
                    <div 
                      key={milestone.targetWeight}
                      className={`p-3 rounded-lg ${getConfidenceColor(milestone.confidence)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{milestone.targetWeight} kg</span>
                        <span className="text-xs opacity-75">
                          {milestone.confidence === 'high' ? '●●●' : milestone.confidence === 'medium' ? '●●○' : '●○○'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>
                          ~{format(milestone.estimatedDate, 'dd. MMM yyyy', { locale: de })}
                        </span>
                        <span className="opacity-75">
                          ({milestone.weeksAway} Wochen)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Custom target input */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Eigenes Zielgewicht berechnen
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customTarget[pred.exerciseId] || ''}
                      onChange={(e) => setCustomTarget({
                        ...customTarget,
                        [pred.exerciseId]: e.target.value
                      })}
                      placeholder={`z.B. ${Math.round(pred.currentMax * 1.2)}`}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <span className="px-3 py-2 bg-slate-200 rounded-lg text-slate-600">kg</span>
                  </div>
                  
                  {getCustomPrediction(pred.exerciseId) && (
                    <div className="mt-3 p-3 bg-amber-100 rounded-lg">
                      <p className="font-medium text-amber-800">
                        {getCustomPrediction(pred.exerciseId)?.targetWeight} kg erreichst du voraussichtlich am{' '}
                        <span className="font-bold">
                          {format(getCustomPrediction(pred.exerciseId)!.estimatedDate, 'dd. MMMM yyyy', { locale: de })}
                        </span>
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Das sind noch etwa {getCustomPrediction(pred.exerciseId)?.weeksAway} Wochen.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* PR History mini chart */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">PR Verlauf</p>
                  <div className="flex items-end gap-1 h-16">
                    {pred.trendData.slice(-10).map((point, i) => {
                      const maxWeight = Math.max(...pred.trendData.map(p => p.weight));
                      const minWeight = Math.min(...pred.trendData.map(p => p.weight));
                      const range = maxWeight - minWeight || 1;
                      const height = ((point.weight - minWeight) / range) * 100;
                      
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-amber-400 rounded-t transition-all hover:bg-amber-500"
                          style={{ height: `${Math.max(10, height)}%` }}
                          title={`${format(point.date, 'dd.MM.yy')}: ${point.weight}kg`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>{pred.trendData.length > 0 && format(pred.trendData[Math.max(0, pred.trendData.length - 10)].date, 'MMM yy')}</span>
                    <span>Heute</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Info footer */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
        <p className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Prognosen basieren auf deinem bisherigen Fortschritt. 
            Regelmäßiges Training und progressive Overload verbessern die Genauigkeit.
          </span>
        </p>
      </div>
    </div>
  );
}
