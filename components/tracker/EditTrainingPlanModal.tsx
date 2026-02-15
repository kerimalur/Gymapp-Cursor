'use client';

import { useState, useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Modal } from '@/components/ui/Modal';
import { TrainingPlan } from '@/types';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, ChevronUp, ChevronDown, Calendar, Target, 
  Edit, GripVertical, Check, ClipboardList, Settings, 
  RefreshCw, Dumbbell, Clock, Star, Zap, RotateCcw
} from 'lucide-react';

interface EditTrainingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TrainingPlan | null;
}

interface PlanDay {
  id: string;
  trainingDayId: string;
}

export function EditTrainingPlanModal({ isOpen, onClose, plan }: EditTrainingPlanModalProps) {
  const { trainingDays, updateTrainingPlan, setActiveTrainingPlan } = useWorkoutStore();
  
  // Basic settings
  const [name, setName] = useState('');
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  
  // Advanced settings
  const [description, setDescription] = useState('');
  const [restDaysBetweenSessions, setRestDaysBetweenSessions] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [deloadWeek, setDeloadWeek] = useState(4); // Every X weeks
  const [planDuration, setPlanDuration] = useState(0); // 0 = unbegrenzt
  
  const [loading, setLoading] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [activeTab, setActiveTab] = useState<'days' | 'settings' | 'advanced'>('days');

  // Load plan data when modal opens
  useEffect(() => {
    if (plan && isOpen) {
      setName(plan.name);
      setPlanDays(plan.trainingDays.map((dayId, idx) => ({
        id: `slot-${idx}`,
        trainingDayId: dayId,
      })));
      setIsActive(plan.isActive);
      setCurrentDayIndex(plan.currentDayIndex || 0);
      // Load advanced settings if they exist
      setDescription((plan as any).description || '');
      setRestDaysBetweenSessions((plan as any).restDaysBetweenSessions || 1);
      setAutoAdvance((plan as any).autoAdvance !== false);
      setDeloadWeek((plan as any).deloadWeek || 4);
      setPlanDuration((plan as any).planDuration || 0);
    }
  }, [plan, isOpen]);

  const sessionsPerWeek = planDays.length;

  const handleAddDay = (trainingDayId: string) => {
    const newPlanDay: PlanDay = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      trainingDayId,
    };
    setPlanDays([...planDays, newPlanDay]);
  };

  const handleRemoveDay = (slotId: string) => {
    setPlanDays(planDays.filter(d => d.id !== slotId));
  };

  const handleMoveDayUp = (index: number) => {
    if (index === 0) return;
    const newDays = [...planDays];
    [newDays[index], newDays[index - 1]] = [newDays[index - 1], newDays[index]];
    setPlanDays(newDays);
  };

  const handleMoveDayDown = (index: number) => {
    if (index === planDays.length - 1) return;
    const newDays = [...planDays];
    [newDays[index], newDays[index + 1]] = [newDays[index + 1], newDays[index]];
    setPlanDays(newDays);
  };

  const handleResetProgress = () => {
    if (confirm('Fortschritt wirklich zurücksetzen? Du startest wieder bei Tag 1.')) {
      setCurrentDayIndex(0);
      toast.success('Fortschritt zurückgesetzt');
    }
  };

  const handleSave = () => {
    if (!plan) return;
    
    if (!name.trim()) {
      toast.error('Bitte gib einen Namen für den Plan ein');
      return;
    }
    
    if (planDays.length === 0) {
      toast.error('Bitte füge mindestens einen Trainingstag hinzu');
      return;
    }

    setLoading(true);
    
    const updatedPlan: TrainingPlan = {
      ...plan,
      name: name.trim(),
      sessionsPerWeek: planDays.length,
      trainingDays: planDays.map(d => d.trainingDayId),
      isActive,
      currentDayIndex: Math.min(currentDayIndex, planDays.length - 1),
      // Advanced settings
      description,
      restDaysBetweenSessions,
      autoAdvance,
      deloadWeek,
      planDuration,
    } as TrainingPlan;
    
    updateTrainingPlan(updatedPlan);
    
    if (isActive) {
      setActiveTrainingPlan(plan.id);
    }
    
    toast.success('Trainingsplan erfolgreich aktualisiert!');
    handleClose();
    setLoading(false);
  };

  const handleClose = () => {
    setName('');
    setPlanDays([]);
    setIsActive(false);
    setShowDaySelector(false);
    setActiveTab('days');
    onClose();
  };

  const getDayCount = (dayId: string) => planDays.filter(d => d.trainingDayId === dayId).length;

  if (!plan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      title="Trainingsplan bearbeiten"
      subtitle={`${plan.name} anpassen`}
      icon={<Edit className="w-6 h-6" />}
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
            disabled={loading || !name.trim() || planDays.length === 0}
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
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
            Name des Trainingsplans
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Push/Pull/Legs, Oberkörper/Unterkörper..."
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Beschreibung (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notizen zum Plan, Ziele, besondere Hinweise..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('days')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'days'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Trainingstage
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Einstellungen
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'advanced'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            Erweitert
          </button>
        </div>

        {/* Trainingstage Tab */}
        {activeTab === 'days' && (
          <div className="space-y-4">
            {/* Sessions Summary */}
            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-violet-900">{sessionsPerWeek}× pro Woche</p>
                    <p className="text-sm text-violet-600">Aktuell bei Tag {currentDayIndex + 1}</p>
                  </div>
                </div>
                <button
                  onClick={handleResetProgress}
                  className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                  title="Fortschritt zurücksetzen"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Day Selector Button */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{planDays.length} Trainingstage</p>
              <button
                onClick={() => setShowDaySelector(!showDaySelector)}
                disabled={trainingDays.length === 0}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50 ${
                  showDaySelector 
                    ? 'bg-violet-100 text-violet-700' 
                    : 'bg-violet-500 text-white hover:bg-violet-600'
                }`}
              >
                <Plus className="w-4 h-4" />
                Tag hinzufügen
              </button>
            </div>

            {/* Day Selector */}
            {showDaySelector && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 animate-slide-up">
                {trainingDays.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <p>Keine Trainingstage vorhanden</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {trainingDays.map((day) => {
                      const count = getDayCount(day.id);
                      return (
                        <button
                          key={day.id}
                          onClick={() => handleAddDay(day.id)}
                          className="p-3 bg-white rounded-lg border border-slate-200 hover:border-violet-300 transition-all text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-500" />
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{day.name}</p>
                              <p className="text-xs text-slate-500">{day.exercises.length} Übungen</p>
                            </div>
                          </div>
                          {count > 0 && (
                            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                              {count}×
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Selected Days */}
            {planDays.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">Keine Trainingstage</p>
                <p className="text-sm text-slate-400">Füge Trainingstage hinzu</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {planDays.map((planDay, index) => {
                  const dayData = trainingDays.find(d => d.id === planDay.trainingDayId);
                  const isCurrentDay = index === currentDayIndex;
                  return (
                    <div
                      key={planDay.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 group transition-all ${
                        isCurrentDay 
                          ? 'bg-violet-50 border-violet-300' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveDayUp(index)}
                          disabled={index === 0}
                          className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-3 h-3 text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleMoveDayDown(index)}
                          disabled={index === planDays.length - 1}
                          className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>

                      <div className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center ${
                        isCurrentDay 
                          ? 'bg-violet-500 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {dayData?.name || 'Unbekannt'}
                          {isCurrentDay && <span className="ml-2 text-violet-600">(Nächstes)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{dayData?.exercises.length || 0} Übungen</p>
                      </div>

                      <button
                        onClick={() => setCurrentDayIndex(index)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isCurrentDay 
                            ? 'bg-violet-200 text-violet-700' 
                            : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Als nächsten Tag setzen"
                      >
                        <Star className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRemoveDay(planDay.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Einstellungen Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-semibold text-slate-700">Als aktiven Plan setzen</p>
                <p className="text-sm text-slate-500">Dieser Plan wird für dein Training verwendet</p>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative w-12 h-7 rounded-full transition-all ${
                  isActive ? 'bg-violet-500' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute w-5 h-5 rounded-full bg-white shadow-md top-1 transition-all ${
                  isActive ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Auto Advance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-semibold text-slate-700">Automatisch weiterschalten</p>
                <p className="text-sm text-slate-500">Nach jedem Training zum nächsten Tag wechseln</p>
              </div>
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`relative w-12 h-7 rounded-full transition-all ${
                  autoAdvance ? 'bg-violet-500' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute w-5 h-5 rounded-full bg-white shadow-md top-1 transition-all ${
                  autoAdvance ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Current Day Selection */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700 mb-2">
                Aktueller Trainingstag
              </label>
              <select
                value={currentDayIndex}
                onChange={(e) => setCurrentDayIndex(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
              >
                {planDays.map((planDay, index) => {
                  const dayData = trainingDays.find(d => d.id === planDay.trainingDayId);
                  return (
                    <option key={planDay.id} value={index}>
                      Tag {index + 1}: {dayData?.name || 'Unbekannt'}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Wähle den Tag, mit dem dein nächstes Training beginnt
              </p>
            </div>
          </div>
        )}

        {/* Erweitert Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Rest Days */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Empfohlene Ruhetage zwischen Einheiten
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={restDaysBetweenSessions}
                  onChange={(e) => setRestDaysBetweenSessions(parseInt(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="w-16 text-center font-bold text-violet-600 bg-violet-100 px-3 py-1 rounded-lg">
                  {restDaysBetweenSessions} {restDaysBetweenSessions === 1 ? 'Tag' : 'Tage'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {restDaysBetweenSessions === 0 && 'Training an aufeinanderfolgenden Tagen'}
                {restDaysBetweenSessions === 1 && 'z.B. Mo-Mi-Fr Training'}
                {restDaysBetweenSessions === 2 && 'z.B. Mo-Do Training'}
                {restDaysBetweenSessions === 3 && 'z.B. Mo-Fr Training'}
              </p>
            </div>

            {/* Deload Week */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700 mb-2">
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Deload-Woche (Erholungswoche)
              </label>
              <select
                value={deloadWeek}
                onChange={(e) => setDeloadWeek(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
              >
                <option value={0}>Keine automatische Deload-Woche</option>
                <option value={3}>Alle 3 Wochen</option>
                <option value={4}>Alle 4 Wochen (empfohlen)</option>
                <option value={5}>Alle 5 Wochen</option>
                <option value={6}>Alle 6 Wochen</option>
                <option value={8}>Alle 8 Wochen</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Eine Deload-Woche hilft bei der Regeneration und beugt Übertraining vor
              </p>
            </div>

            {/* Plan Duration */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Plandauer
              </label>
              <select
                value={planDuration}
                onChange={(e) => setPlanDuration(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
              >
                <option value={0}>Unbegrenzt</option>
                <option value={4}>4 Wochen</option>
                <option value={6}>6 Wochen</option>
                <option value={8}>8 Wochen</option>
                <option value={12}>12 Wochen (3 Monate)</option>
                <option value={16}>16 Wochen (4 Monate)</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Nach Ablauf bekommst du eine Erinnerung, den Plan zu wechseln oder anzupassen
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 Tipp:</strong> Wechsle deinen Trainingsplan alle 8-12 Wochen, 
                um Plateaus zu vermeiden und neue Reize zu setzen.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
