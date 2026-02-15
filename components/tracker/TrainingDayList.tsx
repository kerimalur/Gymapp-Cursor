'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { TrainingDay } from '@/types';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { EditTrainingDayModal } from './EditTrainingDayModal';
import { TrainingDayDetailModal } from './TrainingDayDetailModal';
import toast from 'react-hot-toast';

// Helper to find exercise in both database and custom exercises
const findExercise = (exerciseId: string, customExercises: any[]) => {
  return exerciseDatabase.find(ex => ex.id === exerciseId) || 
         customExercises.find(ex => ex.id === exerciseId);
};

// Inline SVG Icons
const Icons = {
  dumbbell: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h2l1-2h12l1 2h2M5 7v10M19 7v10M9 7v10M15 7v10M5 12h14" />
    </svg>
  ),
  play: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  empty: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7h2l1-2h12l1 2h2M5 7v10M19 7v10M9 7v10M15 7v10M5 12h14" />
    </svg>
  ),
  exercises: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

interface TrainingDayListProps {
  limit?: number;
}

export function TrainingDayList({ limit }: TrainingDayListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { trainingDays, setTrainingDays, customExercises } = useWorkoutStore();
  const [editingDay, setEditingDay] = useState<TrainingDay | null>(null);
  const [viewingDay, setViewingDay] = useState<TrainingDay | null>(null);

  const handleStartWorkout = (day: TrainingDay) => {
    router.push(`/workout?id=${day.id}`);
  };

  const handleViewDetails = (day: TrainingDay) => {
    setViewingDay(day);
  };

  const handleEdit = (day: TrainingDay) => {
    setEditingDay(day);
  };

  const handleSaveEdit = (updatedDay: TrainingDay) => {
    setTrainingDays(trainingDays.map(d => d.id === updatedDay.id ? updatedDay : d));
    setEditingDay(null);
  };

  const handleDelete = (dayId: string) => {
    if (confirm('Trainingstag wirklich löschen?')) {
      setTrainingDays(trainingDays.filter(d => d.id !== dayId));
      toast.success('Trainingstag gelöscht');
    }
  };

  // Get exercise name from database or custom exercises
  const getExerciseName = (exerciseId: string): string => {
    const exercise = findExercise(exerciseId, customExercises);
    return exercise?.name || exerciseId;
  };

  const displayDays = limit ? trainingDays.slice(0, limit) : trainingDays;

  if (displayDays.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-300">
          {Icons.empty}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Noch keine Trainingstage
        </h3>
        <p className="text-gray-500">
          Erstelle deinen ersten Trainingstag, um loszulegen
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayDays.map((day, index) => (
          <div
            key={day.id}
            className="card-interactive group animate-slide-up cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleViewDetails(day)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                  {Icons.dumbbell}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{day.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span className="text-gray-400">{Icons.exercises}</span>
                    {day.exercises.length} Übungen
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleViewDetails(day); }}
                className="p-2 rounded-xl text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
                title="Details anzeigen"
              >
                {Icons.info}
              </button>
            </div>

            {/* Exercise Tags */}
            <div className="mb-4 min-h-[32px]">
              <div className="flex flex-wrap gap-1.5">
                {day.exercises.slice(0, 3).map((ex, idx) => (
                  <span
                    key={idx}
                    className="chip chip-default text-xs"
                  >
                    {getExerciseName(ex.exerciseId)}
                  </span>
                ))}
                {day.exercises.length > 3 && (
                  <span className="chip chip-primary text-xs">
                    +{day.exercises.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleStartWorkout(day)}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 shadow-glow"
              >
                {Icons.play}
                Starten
              </button>
              <button 
                onClick={() => handleEdit(day)}
                className="p-3 rounded-xl bg-white/60 border border-gray-100 text-gray-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/50 transition-all"
                title="Bearbeiten"
              >
                {Icons.edit}
              </button>
              <button 
                onClick={() => handleDelete(day.id)}
                className="p-3 rounded-xl bg-white/60 border border-gray-100 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-all"
                title="Löschen"
              >
                {Icons.trash}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {editingDay && (
        <EditTrainingDayModal
          isOpen={!!editingDay}
          trainingDay={editingDay}
          onClose={() => setEditingDay(null)}
          onSave={handleSaveEdit}
        />
      )}
      
      <TrainingDayDetailModal
        isOpen={!!viewingDay}
        trainingDay={viewingDay}
        onClose={() => setViewingDay(null)}
        onStart={(day) => {
          setViewingDay(null);
          handleStartWorkout(day);
        }}
      />
    </>
  );
}
