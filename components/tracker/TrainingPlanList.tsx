'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { TrainingPlan } from '@/types';
import { EditTrainingPlanModal } from './EditTrainingPlanModal';
import { 
  Calendar, 
  Target, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Play, 
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export function TrainingPlanList() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { trainingPlans, trainingDays, deleteTrainingPlan, setActiveTrainingPlan, setCurrentWorkout } = useWorkoutStore();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);

  const handleSetActive = (planId: string) => {
    setActiveTrainingPlan(planId);
    toast.success('Plan als aktiv gesetzt!');
  };

  const handleDelete = (planId: string) => {
    deleteTrainingPlan(planId);
    setConfirmDelete(null);
    toast.success('Trainingsplan gelöscht');
  };

  const handleStartWorkout = (trainingDayId: string) => {
    const day = trainingDays.find(d => d.id === trainingDayId);
    if (!day) {
      toast.error('Trainingstag nicht gefunden');
      return;
    }

    // Create a new workout session from the training day
    const newWorkout = {
      id: `workout-${Date.now()}`,
      userId: user?.uid || 'anonymous',
      trainingDayId: day.id,
      trainingDayName: day.name,
      exercises: day.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => ({
          ...set,
          completed: false,
        })),
      })),
      startTime: new Date(),
      totalVolume: 0,
    };

    setCurrentWorkout(newWorkout);
    router.push(`/workout?id=${day.id}`);
  };

  if (trainingPlans.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Noch keine Trainingspläne
        </h3>
        <p className="text-gray-600">
          Erstelle deinen ersten Trainingsplan, um strukturiert zu trainieren
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trainingPlans.map((plan) => {
        const isExpanded = expandedPlan === plan.id;
        const planDays = plan.trainingDays.map(dayId => 
          trainingDays.find(d => d.id === dayId)
        ).filter(Boolean);
        
        return (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
              plan.isActive ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* Plan Header */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    plan.isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      {plan.isActive && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Aktiv
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {plan.sessionsPerWeek}× pro Woche
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {planDays.length} Trainingstage
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!plan.isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetActive(plan.id); }}
                      className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Aktivieren
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {/* Training Days */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Trainingstage</h4>
                  <div className="space-y-2">
                    {planDays.map((day, index) => (
                      <div
                        key={day?.id || index}
                        className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{day?.name || 'Unbekannt'}</p>
                            <p className="text-sm text-gray-500">
                              {day?.exercises.length || 0} Übungen
                            </p>
                          </div>
                        </div>
                        {day && (
                          <button
                            onClick={() => handleStartWorkout(day.id)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-md"
                          >
                            <Play className="w-4 h-4" />
                            Starten
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {planDays.length === 0 && (
                      <div className="text-center py-6 bg-amber-50 rounded-xl">
                        <p className="text-amber-700">Keine Trainingstage gefunden</p>
                        <p className="text-sm text-amber-600">Die Trainingstage wurden möglicherweise gelöscht.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); }}
                    className="flex-1 px-4 py-3 bg-violet-50 text-violet-700 rounded-xl font-medium hover:bg-violet-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Bearbeiten
                  </button>
                  
                  {!plan.isActive && (
                    <button
                      onClick={() => handleSetActive(plan.id)}
                      className="flex-1 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Aktivieren
                    </button>
                  )}
                  
                  {confirmDelete === plan.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                      >
                        Ja, löschen
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-gray-300 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(plan.id)}
                      className="p-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-red-300 hover:text-red-600 transition-colors"
                      title="Löschen"
                      aria-label="Plan löschen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Edit Modal */}
      <EditTrainingPlanModal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        plan={editingPlan}
      />
    </div>
  );
}
