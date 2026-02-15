'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, ChevronUp, ChevronDown, Calendar, Target, 
  Info, GripVertical, Check, ClipboardList
} from 'lucide-react';

interface CreateTrainingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlanDay {
  id: string;
  trainingDayId: string;
}

export function CreateTrainingPlanModal({ isOpen, onClose }: CreateTrainingPlanModalProps) {
  const { user } = useAuthStore();
  const { trainingDays, addTrainingPlan } = useWorkoutStore();
  const [name, setName] = useState('');
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false);

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

  const handleSave = () => {
    if (!user) {
      toast.error('Bitte melde dich an');
      return;
    }
    
    if (!name.trim()) {
      toast.error('Bitte gib einen Namen für den Plan ein');
      return;
    }
    
    if (planDays.length === 0) {
      toast.error('Bitte füge mindestens einen Trainingstag hinzu');
      return;
    }

    setLoading(true);
    
    addTrainingPlan({
      id: `plan-${Date.now()}`,
      userId: user.uid,
      name: name.trim(),
      sessionsPerWeek: planDays.length,
      trainingDays: planDays.map(d => d.trainingDayId),
      isActive,
      currentDayIndex: 0,
      createdAt: new Date(),
    });
    
    toast.success('Trainingsplan erfolgreich erstellt!');
    handleClose();
    setLoading(false);
  };

  const handleClose = () => {
    setName('');
    setPlanDays([]);
    setIsActive(true);
    setShowDaySelector(false);
    onClose();
  };

  const getDayCount = (dayId: string) => planDays.filter(d => d.trainingDayId === dayId).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      title="Neuer Trainingsplan"
      subtitle="Kombiniere deine Trainingstage zu einem Plan"
      icon={<ClipboardList className="w-6 h-6" />}
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
            {loading ? 'Speichern...' : 'Trainingsplan erstellen'}
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

        {/* Sessions Summary */}
        <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-violet-900">Trainingseinheiten pro Woche</p>
                <p className="text-sm text-violet-600">Basierend auf deinen hinzugefügten Tagen</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-violet-600">{sessionsPerWeek}×</div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="font-semibold text-slate-700">Als aktiven Plan setzen</p>
            <p className="text-sm text-slate-500">Dieser Plan wird für dein Training verwendet</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative w-14 h-8 rounded-full transition-all ${
              isActive ? 'bg-violet-500' : 'bg-slate-300'
            }`}
          >
            <span className={`absolute w-6 h-6 rounded-full bg-white shadow-md top-1 transition-all ${
              isActive ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        {/* Day Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Trainingstage ({planDays.length})</h3>
              <p className="text-xs text-slate-500">Füge Trainingstage in der gewünschten Reihenfolge hinzu</p>
            </div>
            <button
              onClick={() => setShowDaySelector(!showDaySelector)}
              disabled={trainingDays.length === 0}
              className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 ${
                showDaySelector 
                  ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
              }`}
            >
              <Plus className="w-4 h-4" />
              Tag hinzufügen
            </button>
          </div>

          {/* Day Selector */}
          {showDaySelector && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 animate-slide-up">
              {trainingDays.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p className="mb-2">Keine Trainingstage vorhanden</p>
                  <p className="text-sm">Erstelle zuerst einen Trainingstag</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trainingDays.map((day) => {
                    const count = getDayCount(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => handleAddDay(day.id)}
                        className="p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-sm transition-all text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{day.name}</p>
                            <p className="text-xs text-slate-500">{day.exercises.length} Übungen</p>
                          </div>
                        </div>
                        {count > 0 && (
                          <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
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
            <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">Noch keine Trainingstage</p>
              <p className="text-sm text-slate-400">Füge Trainingstage hinzu um deinen Plan zu erstellen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {planDays.map((planDay, index) => {
                const dayData = trainingDays.find(d => d.id === planDay.trainingDayId);
                return (
                  <div
                    key={planDay.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-3 group hover:border-violet-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveDayUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleMoveDayDown(index)}
                        disabled={index === planDays.length - 1}
                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-lg shadow-violet-500/30">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{dayData?.name || 'Unbekannt'}</p>
                      <p className="text-sm text-slate-500">{dayData?.exercises.length || 0} Übungen</p>
                    </div>

                    <button
                      onClick={() => handleRemoveDay(planDay.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
