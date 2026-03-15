'use client';

import { useState, useMemo } from 'react';
import { useNutritionStore, TrackedMeal, MealTemplate } from '@/store/useNutritionStore';
import { format } from 'date-fns';
import { 
  Plus, 
  Copy, 
  Star, 
  X, 
  Zap, 
  Clock,
  ChevronRight,
  Search,
  Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface QuickLogNutritionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickLogNutrition({ isOpen, onClose }: QuickLogNutritionProps) {
  const { 
    trackedMeals, 
    mealTemplates, 
    addTrackedMeal, 
    getTrackedMealsForDate 
  } = useNutritionStore();

  const [mode, setMode] = useState<'quick' | 'copy' | 'template' | 'custom'>('quick');
  const [quickCalories, setQuickCalories] = useState('');
  const [quickProtein, setQuickProtein] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickMealTime, setQuickMealTime] = useState('lunch');
  const [searchTerm, setSearchTerm] = useState('');

  // Get yesterday's meals
  const yesterdayStr = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return format(yesterday, 'yyyy-MM-dd');
  }, []);

  const yesterdayMeals = useMemo(() => {
    return (trackedMeals || []).filter(m => m.date === yesterdayStr);
  }, [trackedMeals, yesterdayStr]);

  // Get frequently used meals (top 10 by count)
  const frequentMeals = useMemo(() => {
    const mealCounts: Record<string, { name: string; calories: number; protein: number; carbs?: number; fats?: number; count: number; time: string }> = {};

    (trackedMeals || []).forEach(meal => {
      const key = meal.name.toLowerCase().trim();
      if (!mealCounts[key]) {
        mealCounts[key] = {
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          count: 0,
          time: meal.time,
        };
      }
      mealCounts[key].count++;
    });

    return Object.values(mealCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [trackedMeals]);

  // Filter frequent meals
  const filteredFrequent = useMemo(() => {
    if (!searchTerm) return frequentMeals;
    return frequentMeals.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [frequentMeals, searchTerm]);

  const handleQuickAdd = () => {
    const cal = parseInt(quickCalories);
    const prot = parseInt(quickProtein);

    if (!cal || cal <= 0) {
      toast.error('Bitte Kalorien eingeben');
      return;
    }

    addTrackedMeal({
      name: quickName || `Schnell-Eintrag (${quickMealTime})`,
      calories: cal,
      protein: prot || 0,
      time: quickMealTime,
    });

    toast.success(`✅ ${cal} kcal, ${prot || 0}g Protein geloggt`);
    setQuickCalories('');
    setQuickProtein('');
    setQuickName('');
    onClose();
  };

  const handleCopyYesterday = () => {
    if (yesterdayMeals.length === 0) {
      toast.error('Keine Mahlzeiten von gestern vorhanden');
      return;
    }

    yesterdayMeals.forEach(meal => {
      addTrackedMeal({
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        time: meal.time,
      });
    });

    toast.success(`✅ ${yesterdayMeals.length} Mahlzeiten von gestern kopiert`);
    onClose();
  };

  const handleAddFrequent = (meal: typeof frequentMeals[0]) => {
    addTrackedMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      time: meal.time,
    });

    toast.success(`✅ ${meal.name} geloggt`);
  };

  const handleAddTemplate = (template: MealTemplate) => {
    addTrackedMeal({
      name: template.name,
      calories: template.calories,
      protein: template.protein,
      carbs: template.carbs,
      fats: template.fats,
      time: template.mealTime,
    });

    toast.success(`✅ ${template.name} geloggt`);
  };

  if (!isOpen) return null;

  const mealTimeLabels: Record<string, string> = {
    breakfast: '🌅 Frühstück',
    lunch: '☀️ Mittagessen',
    dinner: '🌙 Abendessen',
    snacks: '🍿 Snacks',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="bg-[hsl(225,14%,10%)] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b border-[hsl(225,10%,14%)] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Quick Log</h3>
                  <p className="text-xs text-[hsl(var(--fg-muted))]">Schnell eintragen, kein Aufwand</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[hsl(225,12%,18%)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[hsl(var(--fg-muted))]" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 mt-4 bg-[hsl(225,12%,15%)] rounded-xl p-1">
              {[
                { id: 'quick', label: 'Schnell', icon: <Zap className="w-3.5 h-3.5" /> },
                { id: 'copy', label: 'Gestern', icon: <Copy className="w-3.5 h-3.5" /> },
                { id: 'template', label: 'Favoriten', icon: <Star className="w-3.5 h-3.5" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === tab.id
                    ? 'bg-[hsl(225,14%,10%)] text-[hsl(var(--fg-primary))] shadow-sm'
                    : 'text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'quick' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">
                    Mahlzeit (optional)
                  </label>
                  <input
                    type="text"
                    value={quickName}
                    onChange={e => setQuickName(e.target.value)}
                    placeholder="z.B. H?hnchen mit Reis"
                    className="w-full px-4 py-3 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">
                      Kalorien *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quickCalories}
                        onChange={e => setQuickCalories(e.target.value)}
                        placeholder="500"
                        className="w-full px-4 py-3 pr-16 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-emerald-500 focus:outline-none text-lg font-semibold"
                        min="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))] text-sm">kcal</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">
                      Protein
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quickProtein}
                        onChange={e => setQuickProtein(e.target.value)}
                        placeholder="30"
                        className="w-full px-4 py-3 pr-10 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-emerald-500 focus:outline-none text-lg font-semibold"
                        min="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))] text-sm">g</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">Mahlzeit</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(mealTimeLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setQuickMealTime(key)}
                        className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          quickMealTime === key
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[hsl(225,12%,15%)] text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,20%)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleQuickAdd}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Eintragen
                </button>

                {/* Frequent Meals */}
                {frequentMeals.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-[hsl(var(--fg-subtle))]" />
                      <h4 className="text-sm font-bold text-[hsl(var(--fg-secondary))]">Haeufig verwendet</h4>
                    </div>

                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg-subtle))]" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Suchen..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[hsl(225,12%,13%)] border border-[hsl(225,10%,16%)] rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredFrequent.map((meal, i) => (
                        <button
                          key={i}
                          onClick={() => handleAddFrequent(meal)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-[hsl(225,10%,16%)] hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                        >
                          <div>
                            <p className="font-semibold text-[hsl(var(--fg-primary))] text-sm">{meal.name}</p>
                            <p className="text-xs text-[hsl(var(--fg-muted))]">{meal.calories} kcal · {meal.protein}g P</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[hsl(var(--fg-subtle))]">{meal.count}×</span>
                            <Plus className="w-4 h-4 text-emerald-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'copy' && (
              <div className="space-y-4">
                <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-1">Von gestern kopieren</h4>
                  <p className="text-xs text-cyan-400">
                    Alle Mahlzeiten von gestern werden für heute übernommen.
                  </p>
                </div>

                {yesterdayMeals.length === 0 ? (
                  <div className="text-center py-8">
                    <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-[hsl(var(--fg-muted))] font-medium">Keine Mahlzeiten von gestern</p>
                    <p className="text-sm text-[hsl(var(--fg-subtle))] mt-1">Gestern wurde nichts geloggt.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {yesterdayMeals.map((meal, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[hsl(225,12%,13%)] border border-[hsl(225,10%,16%)]">
                          <div>
                            <p className="font-semibold text-[hsl(var(--fg-primary))] text-sm">{meal.name}</p>
                            <p className="text-xs text-[hsl(var(--fg-muted))]">
                              {meal.calories} kcal · {meal.protein}g P · {mealTimeLabels[meal.time] || meal.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[hsl(225,12%,13%)] rounded-xl p-3 border border-[hsl(225,10%,16%)]">
                      <p className="text-sm font-semibold text-[hsl(var(--fg-secondary))]">
                        Gesamt: {yesterdayMeals.reduce((s, m) => s + m.calories, 0)} kcal · {yesterdayMeals.reduce((s, m) => s + m.protein, 0)}g Protein
                      </p>
                    </div>

                    <button
                      onClick={handleCopyYesterday}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Copy className="w-5 h-5" />
                      Alle {yesterdayMeals.length} Mahlzeiten kopieren
                    </button>
                  </>
                )}
              </div>
            )}

            {mode === 'template' && (
              <div className="space-y-4">
                {(!mealTemplates || mealTemplates.length === 0) ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-[hsl(var(--fg-muted))] font-medium">Keine Vorlagen gespeichert</p>
                    <p className="text-sm text-[hsl(var(--fg-subtle))] mt-1">
                      Speichere Mahlzeiten als Vorlagen in der Ernährungs-Seite.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mealTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleAddTemplate(template)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-[hsl(225,10%,16%)] hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <p className="font-semibold text-[hsl(var(--fg-primary))]">{template.name}</p>
                          </div>
                          <p className="text-sm text-[hsl(var(--fg-muted))] mt-1">
                            {template.calories} kcal · {template.protein}g Protein
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[hsl(var(--fg-subtle))]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
