'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Apple, Pill, UtensilsCrossed, Coffee, Edit2, Target, Settings } from 'lucide-react';
import { useNutritionStore, CustomFood, SupplementPreset } from '@/store/useNutritionStore';
import { NutritionGoals } from '@/types';
import { Modal } from '@/components/ui/Modal';

interface NutritionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'goals' | 'foods' | 'supplements' | 'templates';

const CATEGORY_LABELS = {
  meal: 'Mahlzeit',
  snack: 'Snack',
  supplement: 'Supplement',
  drink: 'Getränk',
};

const CATEGORY_ICONS = {
  meal: UtensilsCrossed,
  snack: Apple,
  supplement: Pill,
  drink: Coffee,
};

export function NutritionSettingsModal({ isOpen, onClose }: NutritionSettingsModalProps) {
  const {
    customFoods,
    supplementPresets,
    mealTemplates,
    supplements,
    nutritionGoals,
    addCustomFood,
    removeCustomFood,
    addSupplementPreset,
    removeSupplementPreset,
    removeMealTemplate,
    addSupplement,
    removeSupplement,
    setNutritionGoals,
  } = useNutritionStore();

  const handleDeleteSupplement = (id: string) => {
    removeSupplement(id);
  };

  const [activeTab, setActiveTab] = useState<Tab>('goals');
  const [showAddFood, setShowAddFood] = useState(false);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [showAddActiveSupplement, setShowAddActiveSupplement] = useState(false);

  // Goals form state
  const [goalsForm, setGoalsForm] = useState({
    dailyCalories: nutritionGoals?.dailyCalories || 2500,
    dailyProtein: nutritionGoals?.dailyProtein || 150,
    dailyCarbs: nutritionGoals?.dailyCarbs || 250,
    dailyFats: nutritionGoals?.dailyFats || 65,
    waterGoal: nutritionGoals?.waterGoal || 2000,
  });

  // Update form when nutritionGoals changes
  useEffect(() => {
    if (nutritionGoals) {
      setGoalsForm({
        dailyCalories: nutritionGoals.dailyCalories,
        dailyProtein: nutritionGoals.dailyProtein,
        dailyCarbs: nutritionGoals.dailyCarbs,
        dailyFats: nutritionGoals.dailyFats,
        waterGoal: nutritionGoals.waterGoal,
      });
    }
  }, [nutritionGoals]);

  const handleSaveGoals = () => {
    setNutritionGoals({
      userId: 'user-1',
      dailyCalories: goalsForm.dailyCalories,
      dailyProtein: goalsForm.dailyProtein,
      dailyCarbs: goalsForm.dailyCarbs,
      dailyFats: goalsForm.dailyFats,
      waterGoal: goalsForm.waterGoal,
      caffeineGoal: nutritionGoals?.caffeineGoal || 400,
    });
  };

  // New food form state
  const [newFood, setNewFood] = useState<Partial<CustomFood>>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    servingSize: 100,
    servingUnit: 'g',
    category: 'meal',
  });

  // New supplement form state
  const [newSupplement, setNewSupplement] = useState<Partial<SupplementPreset>>({
    name: '',
    dosage: '',
    timing: 'morning',
    notes: '',
  });

  if (!isOpen) return null;

  const handleAddFood = () => {
    if (!newFood.name) return;
    
    addCustomFood({
      id: Date.now().toString(),
      name: newFood.name,
      calories: newFood.calories || 0,
      protein: newFood.protein || 0,
      carbs: newFood.carbs || 0,
      fats: newFood.fats || 0,
      servingSize: newFood.servingSize || 100,
      servingUnit: newFood.servingUnit || 'g',
      category: newFood.category || 'meal',
    });

    setNewFood({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      servingSize: 100,
      servingUnit: 'g',
      category: 'meal',
    });
    setShowAddFood(false);
  };

  const handleAddSupplement = () => {
    if (!newSupplement.name || !newSupplement.dosage) return;

    addSupplementPreset({
      id: Date.now().toString(),
      name: newSupplement.name,
      dosage: newSupplement.dosage,
      timing: newSupplement.timing || 'morning',
      notes: newSupplement.notes,
    });

    setNewSupplement({
      name: '',
      dosage: '',
      timing: 'morning',
      notes: '',
    });
    setShowAddSupplement(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Ernährungs-Einstellungen"
      icon={<Settings className="w-6 h-6" />}
      iconColor="primary"
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto px-4">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap px-2 ${
              activeTab === 'goals'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tagesziele
          </button>
          <button
            onClick={() => setActiveTab('foods')}
            className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap px-2 ${
              activeTab === 'foods'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lebensmittel
          </button>
          <button
            onClick={() => setActiveTab('supplements')}
            className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap px-2 ${
              activeTab === 'supplements'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Supplements
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap px-2 ${
              activeTab === 'templates'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Mahlzeiten
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">Deine Tagesziele</h4>
                  <p className="text-sm text-slate-500">Passe deine täglichen Ernährungsziele an</p>
                </div>
              </div>

              {/* Calories & Protein */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Kalorien (kcal)
                  </label>
                  <input
                    type="number"
                    value={goalsForm.dailyCalories}
                    onChange={(e) => setGoalsForm({ ...goalsForm, dailyCalories: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={goalsForm.dailyProtein}
                    onChange={(e) => setGoalsForm({ ...goalsForm, dailyProtein: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Carbs & Fats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Kohlenhydrate (g)
                  </label>
                  <input
                    type="number"
                    value={goalsForm.dailyCarbs}
                    onChange={(e) => setGoalsForm({ ...goalsForm, dailyCarbs: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="250"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Fette (g)
                  </label>
                  <input
                    type="number"
                    value={goalsForm.dailyFats}
                    onChange={(e) => setGoalsForm({ ...goalsForm, dailyFats: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="65"
                  />
                </div>
              </div>

              {/* Water Goal */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Wasserziel (ml)
                </label>
                <input
                  type="number"
                  value={goalsForm.waterGoal}
                  onChange={(e) => setGoalsForm({ ...goalsForm, waterGoal: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="2000"
                />
                <p className="text-xs text-slate-400 mt-1">Empfohlen: 2000-3000ml pro Tag</p>
              </div>

              {/* Macro Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mt-4">
                <h5 className="text-sm font-medium text-slate-700 mb-3">Makro-Übersicht</h5>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-lg font-bold text-blue-600">{Math.round((goalsForm.dailyProtein * 4 / goalsForm.dailyCalories) * 100) || 0}%</p>
                    <p className="text-xs text-slate-500">Protein</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-lg font-bold text-green-600">{Math.round((goalsForm.dailyCarbs * 4 / goalsForm.dailyCalories) * 100) || 0}%</p>
                    <p className="text-xs text-slate-500">Carbs</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-lg font-bold text-amber-600">{Math.round((goalsForm.dailyFats * 9 / goalsForm.dailyCalories) * 100) || 0}%</p>
                    <p className="text-xs text-slate-500">Fette</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveGoals}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
              >
                Ziele speichern
              </button>
            </div>
          )}

          {/* Custom Foods Tab */}
          {activeTab === 'foods' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                  Füge eigene Lebensmittel hinzu, die du regelmäßig trackst.
                </p>
                <button
                  onClick={() => setShowAddFood(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Hinzufügen
                </button>
              </div>

              {/* Add Food Form */}
              {showAddFood && (
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-3">Neues Lebensmittel</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Name</label>
                      <input
                        type="text"
                        value={newFood.name}
                        onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="z.B. Haferflocken mit Milch"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Kalorien</label>
                      <input
                        type="number"
                        value={newFood.calories || ''}
                        onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="kcal"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Protein (g)</label>
                      <input
                        type="number"
                        value={newFood.protein || ''}
                        onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="g"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Kohlenhydrate (g)</label>
                      <input
                        type="number"
                        value={newFood.carbs || ''}
                        onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="g"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Fett (g)</label>
                      <input
                        type="number"
                        value={newFood.fats || ''}
                        onChange={(e) => setNewFood({ ...newFood, fats: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="g"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Portionsgröße</label>
                      <input
                        type="number"
                        value={newFood.servingSize || ''}
                        onChange={(e) => setNewFood({ ...newFood, servingSize: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Einheit</label>
                      <select
                        value={newFood.servingUnit}
                        onChange={(e) => setNewFood({ ...newFood, servingUnit: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="stk">Stück</option>
                        <option value="portion">Portion</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Kategorie</label>
                      <select
                        value={newFood.category}
                        onChange={(e) => setNewFood({ ...newFood, category: e.target.value as CustomFood['category'] })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="meal">Mahlzeit</option>
                        <option value="snack">Snack</option>
                        <option value="drink">Getränk</option>
                        <option value="supplement">Supplement</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowAddFood(false)}
                      className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleAddFood}
                      className="flex-1 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}

              {/* Food List */}
              {customFoods.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Apple className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Keine eigenen Lebensmittel</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customFoods.map((food) => {
                    const CategoryIcon = CATEGORY_ICONS[food.category];
                    return (
                      <div
                        key={food.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <CategoryIcon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{food.name}</p>
                            <p className="text-xs text-slate-500">
                              {food.calories} kcal · {food.protein}g P · {food.carbs}g K · {food.fats}g F
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCustomFood(food.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* Supplements Tab */}
          {activeTab === 'supplements' && (
            <div>
              {/* Active Supplements Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-900">Aktive Supplements</h4>
                    <p className="text-xs text-slate-500">Diese erscheinen in deinem täglichen Tracking</p>
                  </div>
                  <button
                    onClick={() => setShowAddActiveSupplement(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Hinzufügen
                  </button>
                </div>

                {/* Add Active Supplement Form */}
                {showAddActiveSupplement && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-medium text-slate-900 mb-3">Neues aktives Supplement</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-500">Name</label>
                        <input
                          type="text"
                          value={newSupplement.name}
                          onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="z.B. Kreatin, Omega-3, Vitamin D"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Dosierung</label>
                        <input
                          type="text"
                          value={newSupplement.dosage}
                          onChange={(e) => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="z.B. 5g, 1000mg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Zeitpunkt</label>
                        <input
                          type="text"
                          value={newSupplement.timing}
                          onChange={(e) => setNewSupplement({ ...newSupplement, timing: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="z.B. Morgens, Abends"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setShowAddActiveSupplement(false)}
                        className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={() => {
                          if (!newSupplement.name || !newSupplement.dosage) return;
                          addSupplement({
                            id: Date.now().toString(),
                            userId: 'user-1',
                            name: newSupplement.name,
                            dosage: newSupplement.dosage || '',
                            timing: newSupplement.timing || 'Täglich',
                            isActive: true,
                          });
                          setNewSupplement({ name: '', dosage: '', timing: 'morning', notes: '' });
                          setShowAddActiveSupplement(false);
                        }}
                        className="flex-1 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Supplement List */}
                {supplements.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl">
                    <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Keine aktiven Supplements</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {supplements.map((supp) => (
                      <div
                        key={supp.id}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Pill className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{supp.name}</p>
                            <p className="text-xs text-slate-500">
                              {supp.dosage} · {supp.timing}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSupplement(supp.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 my-6"></div>

              {/* Supplement Presets Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-900">Supplement-Vorlagen</h4>
                    <p className="text-xs text-slate-500">Vorlagen für schnelles Hinzufügen</p>
                  </div>
                  <button
                    onClick={() => setShowAddSupplement(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Vorlage
                  </button>
                </div>

                {/* Add Supplement Preset Form */}
                {showAddSupplement && (
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-3">Neues Supplement</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Name</label>
                      <input
                        type="text"
                        value={newSupplement.name}
                        onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="z.B. Kreatin, Omega-3, Vitamin D"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Dosierung</label>
                      <input
                        type="text"
                        value={newSupplement.dosage}
                        onChange={(e) => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="z.B. 5g, 1000mg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Zeitpunkt</label>
                      <select
                        value={newSupplement.timing}
                        onChange={(e) => setNewSupplement({ ...newSupplement, timing: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="morning">Morgens</option>
                        <option value="pre-workout">Pre-Workout</option>
                        <option value="post-workout">Post-Workout</option>
                        <option value="evening">Abends</option>
                        <option value="with-meal">Zu Mahlzeiten</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Notizen (optional)</label>
                      <input
                        type="text"
                        value={newSupplement.notes || ''}
                        onChange={(e) => setNewSupplement({ ...newSupplement, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="z.B. mit Wasser nehmen"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowAddSupplement(false)}
                      className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleAddSupplement}
                      className="flex-1 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}

              {/* Supplement List */}
              {supplementPresets.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Supplements definiert</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {supplementPresets.map((supp) => (
                    <div
                      key={supp.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Pill className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{supp.name}</p>
                          <p className="text-xs text-slate-500">
                            {supp.dosage} · {
                              supp.timing === 'morning' ? 'Morgens' :
                              supp.timing === 'pre-workout' ? 'Pre-Workout' :
                              supp.timing === 'post-workout' ? 'Post-Workout' :
                              supp.timing === 'evening' ? 'Abends' : 'Zu Mahlzeiten'
                            }
                            {supp.notes && ` · ${supp.notes}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            addSupplement({
                              id: Date.now().toString(),
                              userId: 'user-1',
                              name: supp.name,
                              dosage: supp.dosage,
                              timing: supp.timing === 'morning' ? 'Morgens' :
                                supp.timing === 'pre-workout' ? 'Pre-Workout' :
                                supp.timing === 'post-workout' ? 'Post-Workout' :
                                supp.timing === 'evening' ? 'Abends' : 'Zu Mahlzeiten',
                              isActive: true,
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Zu aktiven Supplements hinzufügen"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSupplementPreset(supp.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* Meal Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <p className="text-sm text-slate-500 mb-4">
                Hier siehst du alle gespeicherten Mahlzeiten. Du kannst sie im Ernährungs-Tab beim Quick-Add verwenden.
              </p>

              {mealTemplates.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Keine gespeicherten Mahlzeiten</p>
                  <p className="text-xs mt-1">Speichere Mahlzeiten mit dem Stern-Symbol beim Tracken</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mealTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{template.name}</p>
                          <p className="text-xs text-slate-500">
                            {template.calories} kcal · {template.protein}g Protein · {template.mealTime}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMealTemplate(template.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
