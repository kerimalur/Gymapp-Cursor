'use client';

import { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Play, FileText, CheckCircle, Clock, TrendingUp, X, Calendar } from 'lucide-react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { WorkoutSession } from '@/types';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface DayDetailModalProps {
  date: Date;
  onClose: () => void;
}

export function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const { trainingDays, workoutSessions } = useWorkoutStore();

  // Get workouts for this specific day - sorted by time descending (newest first)
  const dayWorkouts = useMemo(() => {
    return workoutSessions
      .filter(session => isSameDay(new Date(session.startTime), date))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [workoutSessions, date]);
  const [showPlanWorkout, setShowPlanWorkout] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [note, setNote] = useState('');
  const [selectedTrainingDay, setSelectedTrainingDay] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null);

  const handlePlanWorkout = () => {
    if (!selectedTrainingDay) {
      toast.error('Bitte wähle einen Trainingstag aus');
      return;
    }
    toast.success('Training geplant!');
    setShowPlanWorkout(false);
    onClose();
  };

  const handleAddNote = () => {
    if (!note.trim()) {
      toast.error('Bitte gib eine Notiz ein');
      return;
    }
    toast.success('Notiz hinzugefügt!');
    setNote('');
    setShowAddNote(false);
  };

  const handleStartWorkout = () => {
    toast.success('Training wird gestartet...');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        size="lg"
        title={format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
        subtitle="Was möchtest du heute tun?"
        icon={<Calendar className="w-6 h-6" />}
        iconColor="blue"
      >
        <div className="p-6">
          {/* Quick Actions */}
          {!showPlanWorkout && !showAddNote && (
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setShowPlanWorkout(true)}
                className="w-full p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Training planen</h3>
                      <p className="text-blue-100 text-sm">
                        Plane ein Workout für diesen Tag
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <span className="text-xl">→</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowAddNote(true)}
                className="w-full p-5 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Notiz hinzufügen</h3>
                      <p className="text-purple-100 text-sm">
                        Füge eine Notiz zu diesem Tag hinzu
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <span className="text-xl">→</span>
                  </div>
                </div>
              </button>

              <button
                onClick={handleStartWorkout}
                className="w-full p-5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Training starten</h3>
                      <p className="text-green-100 text-sm">
                        Starte jetzt ein neues Workout
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <span className="text-xl">→</span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Plan Workout Form */}
          {showPlanWorkout && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Trainingstag auswählen
                </label>
                <select
                  value={selectedTrainingDay}
                  onChange={(e) => setSelectedTrainingDay(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                  title="Trainingstag auswählen"
                  aria-label="Trainingstag auswählen"
                >
                  <option value="">Wähle einen Trainingstag...</option>
                  {trainingDays.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPlanWorkout(false)}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:border-slate-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handlePlanWorkout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                >
                  Planen
                </button>
              </div>
            </div>
          )}

          {/* Add Note Form */}
          {showAddNote && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notiz
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Schreibe eine Notiz..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNote('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:border-slate-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  Speichern
                </button>
              </div>
            </div>
          )}

          {/* Existing Workouts/Notes */}
          {!showPlanWorkout && !showAddNote && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Aktivitäten an diesem Tag
              </h3>
              {dayWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="bg-green-50 border-2 border-green-200 rounded-xl p-4 cursor-pointer hover:bg-green-100 transition-all"
                      onClick={() => setSelectedWorkout(workout)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">
                              {workout.trainingDayName}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {workout.duration || 0} Min
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {Math.round(workout.totalVolume)} kg
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {workout.exercises.slice(0, 3).map((ex, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
                                >
                                  {ex.exerciseId}
                                </span>
                              ))}
                              {workout.exercises.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                                  +{workout.exercises.length - 3}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Klicken für Details</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Noch keine Aktivitäten
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedWorkout(null)}
          size="lg"
          title={selectedWorkout.trainingDayName}
          subtitle={format(new Date(selectedWorkout.startTime), 'dd.MM.yyyy', { locale: de })}
          icon={<CheckCircle className="w-6 h-6" />}
          iconColor="emerald"
        >
          <div className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                <p className="text-sm text-blue-700 mb-1 font-medium">Datum</p>
                <p className="text-lg font-bold text-blue-900">
                  {format(new Date(selectedWorkout.startTime), 'dd.MM.yy')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                <p className="text-sm text-green-700 mb-1 font-medium">Dauer</p>
                <p className="text-lg font-bold text-green-900">
                  {selectedWorkout.duration || 0} Min
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                <p className="text-sm text-purple-700 mb-1 font-medium">Volumen</p>
                <p className="text-lg font-bold text-purple-900">
                  {Math.round(selectedWorkout.totalVolume)} kg
                </p>
              </div>
            </div>

            {/* Exercises */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Übungen ({selectedWorkout.exercises.length})
              </h3>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                {selectedWorkout.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-3">{ex.exerciseId}</h4>
                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                            set.completed
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-slate-200 opacity-50'
                          }`}
                        >
                          <span className={`font-medium text-sm ${
                            set.completed ? 'text-emerald-800' : 'text-slate-500'
                          }`}>
                            Satz {setIdx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${
                              set.completed ? 'text-emerald-700' : 'text-slate-600'
                            }`}>
                              {set.weight} kg × {set.reps}
                            </span>
                            {set.rir !== undefined && (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                set.completed
                                  ? 'bg-emerald-200 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                RIR {set.rir}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
