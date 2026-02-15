'use client';

import { useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import { Exercise, WorkoutExercise, TrainingDay, ExerciseSet } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { CreateCustomExerciseModal } from './CreateCustomExerciseModal';
import toast from 'react-hot-toast';
import { 
  Pencil, X, Plus, Search, Trash2, Copy, ChevronDown, ChevronUp, 
  Dumbbell, Check, Sparkles
} from 'lucide-react';

interface EditTrainingDayModalProps {
  isOpen: boolean;
  trainingDay: TrainingDay;
  onClose: () => void;
  onSave: (updatedDay: TrainingDay) => void;
}

export function EditTrainingDayModal({ isOpen, trainingDay, onClose, onSave }: EditTrainingDayModalProps) {
  const { customExercises } = useWorkoutStore();
  const [name, setName] = useState(trainingDay.name);
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>(trainingDay.exercises);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);

  // Combine database exercises with custom exercises
  const allExercises = [...exerciseDatabase, ...customExercises];

  const filteredExercises = allExercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategory === 'custom') {
      return matchesSearch && ex.isCustom;
    }
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'Alle' },
    { id: 'push', name: 'Drücken' },
    { id: 'pull', name: 'Ziehen' },
    { id: 'legs', name: 'Beine' },
    { id: 'core', name: 'Core' },
    { id: 'custom', name: 'Eigene' },
  ];

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      sets: [
        { id: '1', reps: 10, weight: 0, completed: false },
        { id: '2', reps: 10, weight: 0, completed: false },
      ],
      notes: '',
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setExpandedExercise(selectedExercises.length);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newExercises = [...selectedExercises];
    const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      id: `${newExercises[exerciseIndex].sets.length + 1}`,
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      completed: false,
    });
    setSelectedExercises(newExercises);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...selectedExercises];
    if (newExercises[exerciseIndex].sets.length > 1) {
      newExercises[exerciseIndex].sets.splice(setIndex, 1);
      newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.map((s, i) => ({
        ...s,
        id: `${i + 1}`,
      }));
      setSelectedExercises(newExercises);
    }
  };

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: number) => {
    const newExercises = [...selectedExercises];
    (newExercises[exerciseIndex].sets[setIndex] as any)[field] = value;
    setSelectedExercises(newExercises);
  };

  const handleUpdateNotes = (exerciseIndex: number, notes: string) => {
    const newExercises = [...selectedExercises];
    newExercises[exerciseIndex].notes = notes;
    setSelectedExercises(newExercises);
  };

  const handleCopyLastSet = (exerciseIndex: number) => {
    const newExercises = [...selectedExercises];
    const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      id: `${newExercises[exerciseIndex].sets.length + 1}`,
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: false,
    });
    setSelectedExercises(newExercises);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
    if (expandedExercise === index) setExpandedExercise(null);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;
    
    const newExercises = [...selectedExercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setSelectedExercises(newExercises);
    setExpandedExercise(newIndex);
  };

  const handleSave = () => {
    if (!name.trim() || selectedExercises.length === 0) {
      toast.error('Bitte gib einen Namen ein und füge mindestens eine Übung hinzu');
      return;
    }

    const updatedDay: TrainingDay = {
      ...trainingDay,
      name: name.trim(),
      exercises: selectedExercises,
      updatedAt: new Date(),
    };

    onSave(updatedDay);
    toast.success('Trainingstag aktualisiert!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="Trainingstag bearbeiten"
      subtitle={`${trainingDay.name} anpassen`}
      icon={<Pencil className="w-6 h-6" />}
      iconColor="emerald"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim() || selectedExercises.length === 0}
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Speichern...' : 'Änderungen speichern'}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Name des Trainingstags
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Push Day, Oberkörper, Beine..."
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Exercise Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              Übungen ({selectedExercises.length})
            </h3>
            <p className="text-xs text-slate-500">Bearbeite deine Übungen</p>
          </div>
          <button
            onClick={() => setShowExerciseList(!showExerciseList)}
            className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
              showExerciseList 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
            }`}
          >
            {showExerciseList ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showExerciseList ? 'Schließen' : 'Übung hinzufügen'}
          </button>
        </div>

        {/* Exercise Selection Panel */}
        {showExerciseList && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Übung oder Muskelgruppe suchen..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredExercises.map((exercise) => {
                  const isAdded = selectedExercises.some(e => e.exerciseId === exercise.id);
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => !isAdded && handleAddExercise(exercise)}
                      disabled={isAdded}
                      className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                        isAdded
                          ? 'bg-emerald-50 border-2 border-emerald-200'
                          : 'bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isAdded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isAdded ? <Check className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{exercise.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {exercise.muscleGroups.join(', ')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Keine Übungen gefunden
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Exercises */}
        {selectedExercises.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Keine Übungen</p>
            <p className="text-sm text-slate-400">Füge Übungen hinzu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedExercises.map((exercise, index) => {
              const exerciseData = exerciseDatabase.find(ex => ex.id === exercise.exerciseId);
              const isExpanded = expandedExercise === index;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${
                    isExpanded ? 'border-emerald-300 shadow-lg shadow-emerald-500/10' : 'border-slate-200'
                  }`}
                >
                  {/* Header */}
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedExercise(isExpanded ? null : index)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveExercise(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveExercise(index, 'down'); }}
                        disabled={index === selectedExercises.length - 1}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{exerciseData?.name}</p>
                      <p className="text-sm text-slate-500">
                        {exercise.sets.length} Sätze
                        {exercise.notes && ' • Notiz vorhanden'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveExercise(index); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-4 animate-slide-up">
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-12 gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          <div className="col-span-1 text-center">Satz</div>
                          <div className="col-span-3 text-center">Wdh</div>
                          <div className="col-span-4 text-center">Gewicht</div>
                          <div className="col-span-3 text-center">RIR</div>
                          <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-2">
                          {exercise.sets.map((set, setIdx) => (
                            <div key={setIdx} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-1 flex justify-center">
                                <span className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold flex items-center justify-center text-sm">
                                  {setIdx + 1}
                                </span>
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) => handleUpdateSet(index, setIdx, 'reps', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                  min="0"
                                />
                              </div>
                              <div className="col-span-4">
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={set.weight || ''}
                                    onChange={(e) => handleUpdateSet(index, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    placeholder="0"
                                    min="0"
                                    step="0.5"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">kg</span>
                                </div>
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  value={set.rir || ''}
                                  onChange={(e) => handleUpdateSet(index, setIdx, 'rir', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                  placeholder="0"
                                  min="0"
                                  max="10"
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <button
                                  onClick={() => handleRemoveSet(index, setIdx)}
                                  disabled={exercise.sets.length <= 1}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-30"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => handleAddSet(index)}
                          className="flex-1 px-4 py-2.5 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Satz hinzufügen
                        </button>
                        <button
                          onClick={() => handleCopyLastSet(index)}
                          className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2"
                          title="Letzten Satz duplizieren"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Notizen
                        </label>
                        <textarea
                          value={exercise.notes || ''}
                          onChange={(e) => handleUpdateNotes(index, e.target.value)}
                          placeholder="Pausenzeit, Tempo, Hinweise..."
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-all"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
