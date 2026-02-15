'use client';

import { useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { WorkoutSession } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Dumbbell } from 'lucide-react';

// Helper to find exercise in both database and custom exercises
const findExercise = (exerciseId: string, customExercises: any[]) => {
  return exerciseDatabase.find(ex => ex.id === exerciseId) || 
         customExercises.find(ex => ex.id === exerciseId);
};

// Icons
const Icons = {
  calendar: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trending: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  dumbbell: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
};

interface WorkoutHistoryProps {
  limit?: number;
}

export function WorkoutHistory({ limit: limitProp }: WorkoutHistoryProps) {
  const { workoutSessions, deleteWorkoutSession, customExercises } = useWorkoutStore();
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  const handleDelete = (sessionId: string) => {
    if (confirm('Training wirklich löschen?')) {
      deleteWorkoutSession(sessionId);
      toast.success('Training gelöscht');
    }
  };

  // Sort by startTime descending (newest first)
  const sortedSessions = [...workoutSessions].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const displaySessions = limitProp
    ? sortedSessions.slice(0, limitProp)
    : sortedSessions;

  if (displaySessions.length === 0) {
    return (
      <div className="card-elevated p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
          {Icons.dumbbell}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Noch keine Trainings
        </h3>
        <p className="text-slate-500 text-sm">
          Starte dein erstes Training, um deine Historie zu sehen
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {displaySessions.map((session, index) => (
          <div
            key={session.id}
            className="card-interactive p-5 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  {session.trainingDayName}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    {Icons.calendar}
                    {format(new Date(session.startTime), 'dd. MMM yyyy', { locale: de })}
                  </span>
                  {session.duration && (
                    <span className="flex items-center gap-1.5">
                      {Icons.clock}
                      {session.duration} Min
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-primary-600 font-medium">
                    {Icons.trending}
                    {Math.round(session.totalVolume).toLocaleString()} kg
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelectedSession(session)}
                  className="btn-icon !p-2 text-slate-400"
                  title="Ansehen"
                >
                  {Icons.eye}
                </button>
                <button 
                  onClick={() => handleDelete(session.id)}
                  className="btn-icon !p-2 text-slate-400 hover:text-red-500 hover:bg-red-50"
                  title="Löschen"
                >
                  {Icons.trash}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {session.exercises.slice(0, 4).map((ex, idx) => {
                const exerciseData = findExercise(ex.exerciseId, customExercises);
                const exerciseName = exerciseData?.name || ex.exerciseId;
                return (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full"
                  >
                    {exerciseName}
                  </span>
                );
              })}
              {session.exercises.length > 4 && (
                <span className="text-xs px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full">
                  +{session.exercises.length - 4}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSession(null)}
          size="xl"
          title={selectedSession.trainingDayName}
          subtitle={format(new Date(selectedSession.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })}
          icon={<Dumbbell className="w-6 h-6" />}
          iconColor="primary"
        >
          <div className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  {Icons.calendar}
                  <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Datum</p>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {format(new Date(selectedSession.startTime), 'dd. MMM yy', { locale: de })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  {Icons.clock}
                  <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Dauer</p>
                </div>
                <p className="text-lg font-bold text-emerald-900">
                  {selectedSession.duration || '-'} Min
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center gap-2 mb-2">
                  {Icons.trending}
                  <p className="text-xs text-violet-700 font-semibold uppercase tracking-wide">Volumen</p>
                </div>
                <p className="text-lg font-bold text-violet-900">
                  {Math.round(selectedSession.totalVolume).toLocaleString()} kg
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  {Icons.dumbbell}
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Übungen</p>
                </div>
                <p className="text-lg font-bold text-amber-900">
                  {selectedSession.exercises.length}
                </p>
              </div>
            </div>

            {/* Exercises */}
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Übungen ({selectedSession.exercises.length})
            </h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {selectedSession.exercises.map((exercise, exIdx) => {
                const exerciseData = findExercise(exercise.exerciseId, customExercises);
                const exerciseName = exerciseData?.name || exercise.exerciseId;
                const completedSets = exercise.sets.filter(s => s.completed).length;
                const totalVolume = exercise.sets.reduce((sum, set) => 
                  sum + (set.completed ? set.weight * set.reps : 0), 0
                );
                
                return (
                  <div key={exIdx} className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-900">
                        {exerciseName}
                      </h4>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">
                          {completedSets}/{exercise.sets.length} Sätze
                        </p>
                        <p className="text-xs text-slate-500">
                          {Math.round(totalVolume)} kg Volumen
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                            set.completed
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <span className={`font-medium text-sm ${
                            set.completed ? 'text-emerald-800' : 'text-slate-500'
                          }`}>
                            Satz {setIdx + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold text-sm ${
                              set.completed ? 'text-emerald-700' : 'text-slate-600'
                            }`}>
                              {set.weight} kg × {set.reps}
                            </span>
                            {set.rir !== undefined && (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                set.completed ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}>
                                RIR {set.rir}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
