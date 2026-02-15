'use client';

import { useState } from 'react';
import { Pill, Check, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import toast from 'react-hot-toast';

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  taken: boolean;
}

export function SupplementsTracker() {
  const { supplements, setSupplements, addSupplement, removeSupplement } = useNutritionStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    timing: '',
  });

  const handleToggleSupplement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSupplements = supplements.map((supp: any) =>
      supp.id === id ? { ...supp, taken: !supp.taken } : supp
    );
    setSupplements(updatedSupplements);
    const supplement = supplements.find((s: any) => s.id === id);
    if (supplement && !supplement.taken) {
      toast.success(`${supplement.name} abgehakt ✓`);
    }
  };

  const handleAddSupplement = () => {
    if (!newSupplement.name.trim()) {
      toast.error('Bitte Name eingeben');
      return;
    }
    
    if (editingId) {
      // Update existing
      const updatedSupplements = supplements.map((s: any) =>
        s.id === editingId
          ? { ...s, name: newSupplement.name.trim(), dosage: newSupplement.dosage.trim(), timing: newSupplement.timing.trim() }
          : s
      );
      setSupplements(updatedSupplements);
      toast.success('Supplement aktualisiert!');
    } else {
      // Add new
      const supplement = {
        id: `supp-${Date.now()}`,
        name: newSupplement.name.trim(),
        dosage: newSupplement.dosage.trim(),
        timing: newSupplement.timing.trim(),
        isActive: true,
        taken: false,
        userId: 'demo-user',
      };
      addSupplement(supplement);
      toast.success('Supplement hinzugefügt!');
    }
    
    setNewSupplement({ name: '', dosage: '', timing: '' });
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleEdit = (supplement: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewSupplement({
      name: supplement.name,
      dosage: supplement.dosage,
      timing: supplement.timing,
    });
    setEditingId(supplement.id);
    setShowAddModal(true);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`"${name}" wirklich löschen?`)) {
      removeSupplement(id);
      toast.success('Supplement gelöscht');
    }
  };

  const takenCount = supplements.filter((s) => s.taken).length;
  const totalCount = supplements.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplements</h2>
          <p className="text-sm text-gray-600">
            {takenCount} von {totalCount} genommen
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="p-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
          title="Supplement hinzufügen"
          aria-label="Supplement hinzufügen"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
            ref={(el) => { if (el) el.style.width = `${totalCount > 0 ? (takenCount / totalCount) * 100 : 0}%`; }}
          />
        </div>
      </div>

      {/* Supplements List */}
      {supplements.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            Noch keine Supplements hinzugefügt
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Klicke auf + um deine ersten Supplements zu verwalten
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {supplements.map((supplement) => (
          <div
            key={supplement.id}
            className={`relative group p-4 rounded-xl transition-all border-2 ${
              supplement.taken
                ? 'bg-green-50 border-green-500'
                : 'bg-gray-50 border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleToggleSupplement(supplement.id, e)}
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  supplement.taken
                    ? 'bg-green-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                {supplement.taken && <Check className="w-4 h-4 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold ${
                    supplement.taken
                      ? 'text-green-900 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {supplement.name}
                </p>
                <p className="text-sm text-gray-600">
                  {supplement.dosage} • {supplement.timing}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleEdit(supplement, e)}
                  className="p-2 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(supplement.id, supplement.name, e)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {supplements.length > 0 && takenCount === totalCount && (
        <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
          <p className="text-green-900 font-semibold">
            🎉 Alle Supplements für heute genommen!
          </p>
        </div>
      )}

      {/* Add/Edit Supplement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Supplement bearbeiten' : 'Supplement hinzufügen'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setNewSupplement({ name: '', dosage: '', timing: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                title="Schließen" 
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newSupplement.name}
                  onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                  placeholder="z.B. Whey Protein, Kreatin, BCAA..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dosierung
                </label>
                <input
                  type="text"
                  value={newSupplement.dosage}
                  onChange={(e) => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                  placeholder="z.B. 30g, 5g, 2 Kapseln..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Einnahmezeitpunkt
                </label>
                <select
                  value={newSupplement.timing}
                  onChange={(e) => setNewSupplement({ ...newSupplement, timing: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                >
                  <option value="">Auswählen oder eingeben</option>
                  <option value="Morgens">Morgens</option>
                  <option value="Vor dem Training">Vor dem Training</option>
                  <option value="Nach dem Training">Nach dem Training</option>
                  <option value="Abends">Abends</option>
                  <option value="Zu den Mahlzeiten">Zu den Mahlzeiten</option>
                </select>
                <input
                  type="text"
                  value={newSupplement.timing}
                  onChange={(e) => setNewSupplement({ ...newSupplement, timing: e.target.value })}
                  placeholder="Oder eigenen Zeitpunkt eingeben..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors mt-2"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                    setNewSupplement({ name: '', dosage: '', timing: '' });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAddSupplement}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  {editingId ? 'Speichern' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
