'use client';

import { useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Exercise, MuscleGroup, ExerciseCategory, MuscleInvolvement } from '@/types';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Dumbbell, X, Check, Info } from 'lucide-react';

interface CreateCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated?: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS: { id: MuscleGroup; name: string }[] = [
  { id: 'chest', name: 'Brust' },
  { id: 'back', name: 'Rücken' },
  { id: 'lats', name: 'Latissimus' },
  { id: 'shoulders', name: 'Schultern' },
  { id: 'biceps', name: 'Bizeps' },
  { id: 'triceps', name: 'Trizeps' },
  { id: 'forearms', name: 'Unterarme' },
  { id: 'abs', name: 'Bauch' },
  { id: 'quadriceps', name: 'Quadrizeps' },
  { id: 'hamstrings', name: 'Beinbeuger' },
  { id: 'glutes', name: 'Gesäß' },
  { id: 'calves', name: 'Waden' },
  { id: 'traps', name: 'Trapez' },
  { id: 'adductors', name: 'Adduktoren' },
  { id: 'abductors', name: 'Abduktoren' },
  { id: 'lower_back', name: 'Unterer Rücken' },
  { id: 'neck', name: 'Nacken' },
];

const CATEGORIES: { id: ExerciseCategory; name: string }[] = [
  { id: 'push', name: 'Drücken (Push)' },
  { id: 'pull', name: 'Ziehen (Pull)' },
  { id: 'legs', name: 'Beine' },
  { id: 'core', name: 'Core' },
  { id: 'other', name: 'Sonstige' },
];

export function CreateCustomExerciseModal({ isOpen, onClose, onExerciseCreated }: CreateCustomExerciseModalProps) {
  const { addCustomExercise } = useWorkoutStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('push');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup | ''>('');
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSecondaryMuscle = (muscle: MuscleGroup) => {
    if (muscle === primaryMuscle) return; // Can't be both primary and secondary
    setSecondaryMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }
    if (!primaryMuscle) {
      toast.error('Bitte wähle einen Hauptmuskel');
      return;
    }

    setLoading(true);

    // Build muscle groups array (primary first, then secondary)
    const muscleGroups: MuscleGroup[] = [primaryMuscle, ...secondaryMuscles];
    
    // Build muscles array with roles
    const muscles: MuscleInvolvement[] = [
      { muscle: primaryMuscle, role: 'primary' },
      ...secondaryMuscles.map(m => ({ muscle: m, role: 'secondary' as const }))
    ];

    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      muscleGroups,
      muscles,
      category,
      description: description.trim() || undefined,
      isCustom: true,
    };

    addCustomExercise(newExercise);
    
    if (onExerciseCreated) {
      onExerciseCreated(newExercise);
    }
    
    toast.success('Übung erfolgreich erstellt!');
    handleClose();
    setLoading(false);
  };

  const handleClose = () => {
    setName('');
    setCategory('push');
    setPrimaryMuscle('');
    setSecondaryMuscles([]);
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Eigene Übung erstellen"
      subtitle="Füge eine neue Übung zu deiner Bibliothek hinzu"
      icon={<Dumbbell className="w-6 h-6" />}
      iconColor="violet"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim() || !primaryMuscle}
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Speichern...' : 'Übung erstellen'}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Wichtig für die Regeneration</p>
            <p className="text-blue-600">
              Der Hauptmuskel wird für die Erholungszeit voll berücksichtigt. 
              Nebenmuskeln erholen sich schneller (ca. 40% der normalen Zeit).
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Name der Übung *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Einarmiges Rudern, Incline Curls..."
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Kategorie *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  category === cat.id
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Muscle */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Hauptmuskel (Primary) *
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Der Muskel, der bei dieser Übung am meisten beansprucht wird
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {MUSCLE_GROUPS.map((muscle) => (
              <button
                key={muscle.id}
                onClick={() => {
                  setPrimaryMuscle(muscle.id);
                  // Remove from secondary if selected
                  setSecondaryMuscles(prev => prev.filter(m => m !== muscle.id));
                }}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  primaryMuscle === muscle.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {primaryMuscle === muscle.id && <Check className="w-3 h-3 inline mr-1" />}
                {muscle.name}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Muscles */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Nebenmuskeln (Secondary)
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Muskeln, die zusätzlich mittrainiert werden (optional)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {MUSCLE_GROUPS.filter(m => m.id !== primaryMuscle).map((muscle) => (
              <button
                key={muscle.id}
                onClick={() => toggleSecondaryMuscle(muscle.id)}
                disabled={!primaryMuscle}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  secondaryMuscles.includes(muscle.id)
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                    : primaryMuscle
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                {secondaryMuscles.includes(muscle.id) && <Check className="w-3 h-3 inline mr-1" />}
                {muscle.name}
              </button>
            ))}
          </div>
        </div>

        {/* Description (optional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Beschreibung (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ausführungshinweise, Varianten, Equipment..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Preview */}
        {name && primaryMuscle && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-2">Vorschau</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{name}</p>
                <p className="text-xs text-slate-500">
                  {MUSCLE_GROUPS.find(m => m.id === primaryMuscle)?.name}
                  {secondaryMuscles.length > 0 && (
                    <> + {secondaryMuscles.map(m => MUSCLE_GROUPS.find(mg => mg.id === m)?.name).join(', ')}</>
                  )}
                  {' • '}
                  {CATEGORIES.find(c => c.id === category)?.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
