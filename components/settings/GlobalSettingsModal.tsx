'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useNutritionStore } from '@/store/useNutritionStore';
import { MuscleGroup } from '@/types';
import toast from 'react-hot-toast';

// Icons
const Icons = {
  settings: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
};

// All available muscle groups with German labels
const ALL_MUSCLES: { id: MuscleGroup; label: string; category: 'upper' | 'core' | 'lower' }[] = [
  { id: 'chest', label: 'Brust', category: 'upper' },
  { id: 'back', label: 'Rücken', category: 'upper' },
  { id: 'lats', label: 'Latissimus', category: 'upper' },
  { id: 'shoulders', label: 'Schultern', category: 'upper' },
  { id: 'traps', label: 'Trapezius', category: 'upper' },
  { id: 'biceps', label: 'Bizeps', category: 'upper' },
  { id: 'triceps', label: 'Trizeps', category: 'upper' },
  { id: 'forearms', label: 'Unterarme', category: 'upper' },
  { id: 'abs', label: 'Bauch', category: 'core' },
  { id: 'quadriceps', label: 'Quadrizeps', category: 'lower' },
  { id: 'hamstrings', label: 'Beinbizeps', category: 'lower' },
  { id: 'glutes', label: 'Gesäß', category: 'lower' },
  { id: 'calves', label: 'Waden', category: 'lower' },
];

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
  const { trackingSettings, setEnabledMuscles: saveEnabledMuscles } = useNutritionStore();
  const [enabledMuscles, setEnabledMuscles] = useState<MuscleGroup[]>(
    trackingSettings?.enabledMuscles || ALL_MUSCLES.map(m => m.id)
  );

  useEffect(() => {
    if (trackingSettings?.enabledMuscles) {
      setEnabledMuscles(trackingSettings.enabledMuscles);
    }
  }, [trackingSettings]);

  const toggleMuscle = (muscleId: MuscleGroup) => {
    setEnabledMuscles(prev => {
      if (prev.includes(muscleId)) {
        // Don't allow removing all muscles
        if (prev.length === 1) {
          toast.error('Mindestens ein Muskel muss aktiviert sein');
          return prev;
        }
        return prev.filter(m => m !== muscleId);
      } else {
        return [...prev, muscleId];
      }
    });
  };

  const selectAll = () => {
    setEnabledMuscles(ALL_MUSCLES.map(m => m.id));
  };

  const selectNone = () => {
    // Keep at least one muscle
    setEnabledMuscles(['chest']);
    toast('Mindestens ein Muskel bleibt aktiviert', { icon: 'ℹ️' });
  };

  const handleSave = () => {
    saveEnabledMuscles(enabledMuscles);
    toast.success('Einstellungen gespeichert');
    onClose();
  };

  const upperMuscles = ALL_MUSCLES.filter(m => m.category === 'upper');
  const coreMuscles = ALL_MUSCLES.filter(m => m.category === 'core');
  const lowerMuscles = ALL_MUSCLES.filter(m => m.category === 'lower');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trainings-Einstellungen"
      subtitle="Konfiguriere welche Muskeln getrackt werden"
      icon={Icons.settings}
      iconColor="violet"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Info Text */}
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-sm text-violet-700">
            Diese Einstellungen gelten für die gesamte App: Statistiken, Regeneration und Trainingsfrequenz-Analysen.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={selectAll}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Alle auswählen
          </button>
          <button
            onClick={selectNone}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Auswahl aufheben
          </button>
        </div>

        {/* Upper Body */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Oberkörper
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {upperMuscles.map(muscle => (
              <button
                key={muscle.id}
                onClick={() => toggleMuscle(muscle.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  enabledMuscles.includes(muscle.id)
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {enabledMuscles.includes(muscle.id) && (
                  <span className="text-white">{Icons.check}</span>
                )}
                {muscle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Core */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Core
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {coreMuscles.map(muscle => (
              <button
                key={muscle.id}
                onClick={() => toggleMuscle(muscle.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  enabledMuscles.includes(muscle.id)
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {enabledMuscles.includes(muscle.id) && (
                  <span className="text-white">{Icons.check}</span>
                )}
                {muscle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lower Body */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Unterkörper
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {lowerMuscles.map(muscle => (
              <button
                key={muscle.id}
                onClick={() => toggleMuscle(muscle.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  enabledMuscles.includes(muscle.id)
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {enabledMuscles.includes(muscle.id) && (
                  <span className="text-white">{Icons.check}</span>
                )}
                {muscle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            {enabledMuscles.length} von {ALL_MUSCLES.length} Muskelgruppen aktiv
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
