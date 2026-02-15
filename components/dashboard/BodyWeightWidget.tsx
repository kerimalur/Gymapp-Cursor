'use client';

import { useState } from 'react';
import { useBodyWeightStore, BodyWeightEntry } from '@/store/useBodyWeightStore';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Scale, TrendingUp, TrendingDown, Plus, X, Target, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

interface BodyWeightWidgetProps {
  compact?: boolean;
}

export function BodyWeightWidget({ compact = false }: BodyWeightWidgetProps) {
  const { entries, goal, addEntry, getLatestWeight, getWeightChange, setGoal } = useBodyWeightStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newGoalWeight, setNewGoalWeight] = useState('');

  const latestWeight = getLatestWeight();
  const weekChange = getWeightChange(7);
  const monthChange = getWeightChange(30);

  // Get last 7 entries for mini chart
  const recentEntries = entries.slice(0, 7).reverse();

  const handleAddEntry = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Bitte gib ein gültiges Gewicht ein');
      return;
    }

    addEntry({
      weight,
      date: new Date(),
      note: newNote || undefined,
    });

    toast.success(`${weight} kg eingetragen!`);
    setNewWeight('');
    setNewNote('');
    setShowAddModal(false);
  };

  const handleSetGoal = () => {
    const targetWeight = parseFloat(newGoalWeight);
    if (isNaN(targetWeight) || targetWeight <= 0) {
      toast.error('Bitte gib ein gültiges Zielgewicht ein');
      return;
    }

    setGoal({
      targetWeight,
      startWeight: latestWeight || targetWeight,
      startDate: new Date(),
    });

    toast.success(`Ziel auf ${targetWeight} kg gesetzt!`);
    setNewGoalWeight('');
    setShowGoalModal(false);
  };

  const progressToGoal = goal && latestWeight
    ? Math.round(((goal.startWeight - latestWeight) / (goal.startWeight - goal.targetWeight)) * 100)
    : null;

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Aktuelles Gewicht</p>
              <p className="text-xl font-bold text-slate-800">
                {latestWeight ? `${latestWeight} kg` : '-- kg'}
              </p>
            </div>
          </div>
          {weekChange !== null && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
              weekChange > 0 
                ? 'bg-red-100 text-red-700' 
                : weekChange < 0 
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
            }`}>
              {weekChange > 0 ? <TrendingUp className="w-4 h-4" /> : weekChange < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {weekChange > 0 ? '+' : ''}{weekChange?.toFixed(1)} kg
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full mt-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
        >
          + Eintragen
        </button>
        
        {/* Add Modal */}
        {showAddModal && (
          <AddWeightModal 
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddEntry}
            weight={newWeight}
            setWeight={setNewWeight}
            note={newNote}
            setNote={setNewNote}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Scale className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Körpergewicht</h3>
            <p className="text-sm text-slate-500">
              {entries.length > 0 
                ? `${entries.length} Einträge` 
                : 'Noch keine Einträge'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Current Weight Display */}
      <div className="text-center mb-6">
        <p className="text-5xl font-bold text-slate-800">
          {latestWeight ? latestWeight.toFixed(1) : '--'}
          <span className="text-2xl text-slate-400 ml-1">kg</span>
        </p>
        {entries[0]?.date && (
          <p className="text-sm text-slate-500 mt-1">
            Zuletzt: {format(new Date(entries[0].date), 'dd. MMM yyyy', { locale: de })}
          </p>
        )}
      </div>

      {/* Change Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${
          weekChange === null ? 'bg-slate-50' :
          weekChange > 0 ? 'bg-red-50' : weekChange < 0 ? 'bg-emerald-50' : 'bg-slate-50'
        }`}>
          <p className="text-xs text-slate-500 mb-1">7 Tage</p>
          <div className="flex items-center gap-2">
            {weekChange !== null ? (
              <>
                {weekChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : weekChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <span className={`font-bold ${
                  weekChange > 0 ? 'text-red-700' : weekChange < 0 ? 'text-emerald-700' : 'text-slate-600'
                }`}>
                  {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)} kg
                </span>
              </>
            ) : (
              <span className="text-slate-400">--</span>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-xl ${
          monthChange === null ? 'bg-slate-50' :
          monthChange > 0 ? 'bg-red-50' : monthChange < 0 ? 'bg-emerald-50' : 'bg-slate-50'
        }`}>
          <p className="text-xs text-slate-500 mb-1">30 Tage</p>
          <div className="flex items-center gap-2">
            {monthChange !== null ? (
              <>
                {monthChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : monthChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <span className={`font-bold ${
                  monthChange > 0 ? 'text-red-700' : monthChange < 0 ? 'text-emerald-700' : 'text-slate-600'
                }`}>
                  {monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)} kg
                </span>
              </>
            ) : (
              <span className="text-slate-400">--</span>
            )}
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      {recentEntries.length > 1 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 mb-2">Letzte 7 Einträge</p>
          <div className="flex items-end gap-1 h-16">
            {recentEntries.map((entry, idx) => {
              const minWeight = Math.min(...recentEntries.map(e => e.weight));
              const maxWeight = Math.max(...recentEntries.map(e => e.weight));
              const range = maxWeight - minWeight || 1;
              const height = ((entry.weight - minWeight) / range) * 100;
              
              return (
                <div
                  key={entry.id}
                  className="flex-1 bg-blue-200 rounded-t hover:bg-blue-300 transition-colors"
                  style={{ height: `${Math.max(20, height)}%` }}
                  title={`${format(new Date(entry.date), 'dd.MM')}: ${entry.weight} kg`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Section */}
      {goal ? (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Ziel: {goal.targetWeight} kg</span>
            </div>
            <button
              onClick={() => setGoal(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {progressToGoal !== null && (
            <>
              <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progressToGoal))}%` }}
                />
              </div>
              <p className="text-xs text-blue-600">
                {progressToGoal >= 100 
                  ? '🎉 Ziel erreicht!' 
                  : `${Math.abs(latestWeight! - goal.targetWeight).toFixed(1)} kg noch bis zum Ziel`}
              </p>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowGoalModal(true)}
          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Target className="w-4 h-4 inline mr-2" />
          Gewichtsziel setzen
        </button>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddWeightModal 
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEntry}
          weight={newWeight}
          setWeight={setNewWeight}
          note={newNote}
          setNote={setNewNote}
        />
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Gewichtsziel setzen</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zielgewicht (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newGoalWeight}
                  onChange={(e) => setNewGoalWeight(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="z.B. 75.0"
                />
              </div>
              <button
                onClick={handleSetGoal}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                Ziel speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate Modal Component
function AddWeightModal({ 
  onClose, 
  onAdd, 
  weight, 
  setWeight, 
  note, 
  setNote 
}: {
  onClose: () => void;
  onAdd: () => void;
  weight: string;
  setWeight: (w: string) => void;
  note: string;
  setNote: (n: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Gewicht eintragen</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gewicht (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-lg font-semibold"
              placeholder="z.B. 80.5"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notiz (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="z.B. Nach dem Training"
            />
          </div>
          <button
            onClick={onAdd}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
