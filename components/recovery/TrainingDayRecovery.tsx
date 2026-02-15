'use client';

import { TrainingDayRecovery as TDRecovery } from '@/types';
import { Dumbbell, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TrainingDayRecoveryProps {
  trainingDays: TDRecovery[];
}

export function TrainingDayRecovery({ trainingDays }: TrainingDayRecoveryProps) {
  const getStatusColor = (recovery: number) => {
    if (recovery >= 80) return 'bg-[hsl(var(--success))]';
    if (recovery >= 60) return 'bg-[hsl(var(--warning))]';
    return 'bg-[hsl(var(--error))]';
  };

  const getStatusText = (recovery: number) => {
    if (recovery >= 80) return 'Bereit zu trainieren';
    if (recovery >= 60) return 'Bald bereit';
    return 'Noch Ruhe nötig';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainingDays.map((day) => (
        <div
          key={day.trainingDayId}
          className="card card-interactive group"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">
                  {day.trainingDayName}
                </h3>
                <p className="text-sm text-muted">
                  {day.muscleRecoveries.length} Muskelgruppen
                </p>
              </div>
            </div>
          </div>

          {/* Overall Recovery */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-secondary">
                Gesamt-Regeneration
              </span>
              <span className="stat-number text-primary">
                {day.averageRecovery}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-bar-fill ${getStatusColor(day.averageRecovery)}`}
                style={{ width: `${day.averageRecovery}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              {getStatusText(day.averageRecovery)}
            </p>
          </div>

          {/* Individual Muscles */}
          <div className="space-y-2 border-t border-[hsl(var(--border))] pt-4">
            {day.muscleRecoveries.map((muscle, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-secondary capitalize">
                  {muscle.muscleGroup}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-[hsl(var(--bg-tertiary))] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${getStatusColor(muscle.recoveryPercentage)} rounded-full transition-all`}
                      style={{ width: `${muscle.recoveryPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-primary w-10 text-right">
                    {muscle.recoveryPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Last Trained */}
          {day.muscleRecoveries[0]?.lastTrainedAt && (
            <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
              <p className="text-xs text-muted">
                Zuletzt trainiert:{' '}
                {format(day.muscleRecoveries[0].lastTrainedAt, 'dd. MMM yyyy', {
                  locale: de,
                })}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
