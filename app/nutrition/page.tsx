'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNutritionStore, MealTemplate, TrackedMeal } from '@/store/useNutritionStore';
import { NutritionSettingsModal } from '@/components/nutrition/NutritionSettingsModal';
import { NutritionTrend } from '@/components/nutrition/NutritionTrend';
import { MealTimingAnalysis } from '@/components/nutrition/MealTimingAnalysis';
import { 
  Plus, 
  Utensils, 
  Coffee, 
  Moon, 
  Apple, 
  Droplets, 
  TrendingUp, 
  TrendingDown,
  Check,
  X,
  Flame,
  Target,
  Info,
  Minus,
  Pill,
  ChevronRight,
  Search,
  Beef,
  Settings,
  Save,
  Star,
  Trash2,
  Clock,
  Bed
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Quick meal templates for easy logging
const QUICK_MEALS = [
  { id: 'light', name: 'Leichte Mahlzeit', calories: 300, protein: 15, icon: '🥗', description: 'Salat, Obst, Snack' },
  { id: 'normal', name: 'Normale Mahlzeit', calories: 500, protein: 30, icon: '🍽️', description: 'Ausgewogene Mahlzeit' },
  { id: 'big', name: 'Große Mahlzeit', calories: 800, protein: 45, icon: '🍖', description: 'Reichhaltige Mahlzeit' },
  { id: 'snack', name: 'Snack', calories: 150, protein: 5, icon: '🍎', description: 'Obst, Riegel, Kleinigkeit' },
  { id: 'protein', name: 'Protein-Shake', calories: 200, protein: 30, icon: '🥤', description: 'Shake, Quark, Eier' },
  { id: 'treat', name: 'Süßigkeit', calories: 250, protein: 3, icon: '🍫', description: 'Schokolade, Kuchen, Eis' },
];

const MEAL_TIMES = [
  { id: 'breakfast', name: 'Frühstück', icon: Coffee, time: '6:00 - 10:00' },
  { id: 'lunch', name: 'Mittagessen', icon: Utensils, time: '11:00 - 14:00' },
  { id: 'dinner', name: 'Abendessen', icon: Moon, time: '17:00 - 21:00' },
  { id: 'snacks', name: 'Snacks', icon: Apple, time: 'Zwischendurch' },
];

// Default supplements
const DEFAULT_SUPPLEMENTS = [
  { id: 'creatine', name: 'Kreatin', dosage: '5g', timing: 'Täglich' },
  { id: 'omega3', name: 'Omega-3', dosage: '2 Kapseln', timing: 'Zum Essen' },
  { id: 'vitd', name: 'Vitamin D3', dosage: '2000 IE', timing: 'Morgens' },
  { id: 'magnesium', name: 'Magnesium', dosage: '400mg', timing: 'Abends' },
];

interface TrackedSupplement {
  id: string;
  name: string;
  dosage: string;
  taken: boolean;
}

export default function NutritionPage() {
  const { 
    nutritionGoals, dailyTracking, updateWater, supplements, addSupplement, 
    setSupplements, setNutritionGoals, mealTemplates, addMealTemplate, removeMealTemplate,
    sleepEntries, addSleepEntry, getSleepForDate,
    trackedMeals, addTrackedMeal, removeTrackedMeal, getTrackedMealsForDate,
    cleanupOldMeals
  } = useNutritionStore();
  
  // Get today's date for filtering
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  
  // Get today's meals from store (persisted)
  const todayMeals = trackedMeals.filter(m => m.date === todayDate);
  
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDetailedAdd, setShowDetailedAdd] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<string>('lunch');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customName, setCustomName] = useState('');
  const [showWaterInfo, setShowWaterInfo] = useState(false);
  const [showSupplements, setShowSupplements] = useState(false);
  const [trackedSupplements, setTrackedSupplements] = useState<TrackedSupplement[]>([]);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState('');
  const [newSupplementDosage, setNewSupplementDosage] = useState('');
  // New state for saved meals
  const [showSavedMeals, setShowSavedMeals] = useState(false);
  const [showSaveMealModal, setShowSaveMealModal] = useState(false);
  const [mealToSave, setMealToSave] = useState<{ id: string; name: string; calories: number; protein: number; time: string } | null>(null);
  const [templateName, setTemplateName] = useState('');
  // Sleep tracking state
  const [showSleepTracker, setShowSleepTracker] = useState(false);
  const [sleepHours, setSleepHours] = useState('7');
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  // Settings modal state
  const [showNutritionSettings, setShowNutritionSettings] = useState(false);
  const [hasInitializedSupplements, setHasInitializedSupplements] = useState(false);

  // Get today's sleep entry (reuse todayDate from above)
  const todaySleep = sleepEntries.find(e => e.date === todayDate);

  // Auto-cleanup old meals (30 days) on first load
  useEffect(() => {
    const lastCleanup = localStorage.getItem('meal-history-last-cleanup');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastCleanup !== today) {
      const removedCount = cleanupOldMeals(30);
      if (removedCount > 0) {
        console.log(`Auto-cleanup: Removed ${removedCount} meals older than 30 days`);
      }
      localStorage.setItem('meal-history-last-cleanup', today);
    }
  }, [cleanupOldMeals]);

  // Initialize supplements only once on first load if never been set
  useEffect(() => {
    // Check if we've already initialized (stored in localStorage)
    const initialized = localStorage.getItem('supplements-initialized');
    
    if (!initialized && supplements.length === 0 && !hasInitializedSupplements) {
      // Add default supplements only on very first load
      DEFAULT_SUPPLEMENTS.forEach(supp => {
        addSupplement({
          id: supp.id,
          userId: 'user-1',
          name: supp.name,
          dosage: supp.dosage,
          timing: supp.timing,
          isActive: true,
        });
      });
      localStorage.setItem('supplements-initialized', 'true');
      setHasInitializedSupplements(true);
    }
  }, []);

  // Update tracked supplements when store changes
  useEffect(() => {
    setTrackedSupplements(supplements.map(s => ({
      id: s.id,
      name: s.name,
      dosage: s.dosage,
      taken: false,
    })));
  }, [supplements]);

  // Calculate today's totals
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const dailyCalorieGoal = nutritionGoals?.dailyCalories || 2500;
  const dailyProteinGoal = nutritionGoals?.dailyProtein || 150;
  const caloriesRemaining = dailyCalorieGoal - totalCalories;
  const proteinRemaining = dailyProteinGoal - totalProtein;
  const calorieProgress = Math.min((totalCalories / dailyCalorieGoal) * 100, 100);
  const proteinProgress = Math.min((totalProtein / dailyProteinGoal) * 100, 100);

  // Water tracking
  const waterGlasses = dailyTracking?.waterIntake || 0;
  const waterGoal = 8; // 8 glasses = ~2L
  const waterMl = waterGlasses * 250; // 250ml per glass

  const handleAddQuickMeal = (meal: typeof QUICK_MEALS[0]) => {
    addTrackedMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      time: selectedMealTime,
    });
    setShowQuickAdd(false);
    toast.success(`${meal.name} hinzugefügt (+${meal.calories} kcal, +${meal.protein}g Protein)`);
  };

  // Add saved meal template to today
  const handleAddSavedMeal = (template: MealTemplate) => {
    addTrackedMeal({
      name: template.name,
      calories: template.calories,
      protein: template.protein,
      time: template.mealTime,
    });
    setShowSavedMeals(false);
    setShowQuickAdd(false);
    toast.success(`${template.name} hinzugefügt (+${template.calories} kcal)`);
  };

  // Save current meal as template
  const handleSaveMealAsTemplate = () => {
    if (!mealToSave || !templateName.trim()) {
      toast.error('Bitte Name eingeben');
      return;
    }
    
    const template: MealTemplate = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      calories: mealToSave.calories,
      protein: mealToSave.protein,
      mealTime: mealToSave.time,
      createdAt: new Date(),
    };
    
    addMealTemplate(template);
    setShowSaveMealModal(false);
    setMealToSave(null);
    setTemplateName('');
    toast.success(`"${template.name}" als Vorlage gespeichert ⭐`);
  };

  // Open save modal for a meal
  const handleOpenSaveMealModal = (meal: TrackedMeal) => {
    setMealToSave(meal);
    setTemplateName(meal.name);
    setShowSaveMealModal(true);
  };

  // Delete a meal template
  const handleDeleteTemplate = (templateId: string) => {
    removeMealTemplate(templateId);
    toast.success('Vorlage gelöscht');
  };

  // Save sleep entry
  const handleSaveSleep = () => {
    const hours = parseFloat(sleepHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast.error('Bitte gültige Stunden eingeben (0-24)');
      return;
    }

    const entry = {
      id: todaySleep?.id || `sleep-${Date.now()}`,
      date: todayDate,
      hoursSlept: hours,
      quality: sleepQuality,
      bedTime,
      wakeTime,
    };

    addSleepEntry(entry);
    setShowSleepTracker(false);
    toast.success(`Schlaf gespeichert: ${hours}h, Qualität ${sleepQuality}/5 😴`);
  };

  // Get sleep quality color
  const getSleepQualityColor = (quality: number) => {
    if (quality >= 4) return 'text-emerald-600 bg-emerald-50';
    if (quality >= 3) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  // Get sleep quality label
  const getSleepQualityLabel = (quality: number) => {
    const labels = ['', 'Sehr schlecht', 'Schlecht', 'Okay', 'Gut', 'Sehr gut'];
    return labels[quality];
  };

  const handleAddCustomMeal = () => {
    if (!customCalories || parseInt(customCalories) <= 0) {
      toast.error('Bitte gib eine gültige Kalorienzahl ein');
      return;
    }
    
    addTrackedMeal({
      name: customName || 'Eigene Mahlzeit',
      calories: parseInt(customCalories),
      protein: parseInt(customProtein) || 0,
      time: selectedMealTime,
    });
    setCustomCalories('');
    setCustomProtein('');
    setCustomName('');
    setShowQuickAdd(false);
    setShowDetailedAdd(false);
    toast.success(`Mahlzeit hinzugefügt (+${customCalories} kcal)`);
  };

  const handleRemoveMeal = (mealId: string) => {
    removeTrackedMeal(mealId);
    toast.success('Mahlzeit entfernt');
  };

  const handleAddWater = () => {
    updateWater((waterGlasses || 0) + 1);
    toast.success('💧 +1 Glas Wasser (250ml)');
  };

  const handleRemoveWater = () => {
    if (waterGlasses > 0) {
      updateWater(waterGlasses - 1);
      toast.success('💧 -1 Glas Wasser');
    }
  };

  const handleToggleSupplement = (suppId: string) => {
    setTrackedSupplements(prev => 
      prev.map(s => s.id === suppId ? { ...s, taken: !s.taken } : s)
    );
    const supp = trackedSupplements.find(s => s.id === suppId);
    if (supp && !supp.taken) {
      toast.success(`${supp.name} eingenommen ✓`);
    }
  };

  const handleAddNewSupplement = () => {
    if (!newSupplementName.trim()) {
      toast.error('Bitte Name eingeben');
      return;
    }
    const newSupp = {
      id: `supp-${Date.now()}`,
      userId: 'user-1',
      name: newSupplementName.trim(),
      dosage: newSupplementDosage.trim() || '-',
      timing: 'Täglich',
      isActive: true,
    };
    addSupplement(newSupp);
    setTrackedSupplements([...trackedSupplements, {
      id: newSupp.id,
      name: newSupp.name,
      dosage: newSupp.dosage,
      taken: false,
    }]);
    setNewSupplementName('');
    setNewSupplementDosage('');
    setShowAddSupplement(false);
    toast.success('Supplement hinzugefügt!');
  };

  const handleOpenGoalsSettings = () => {
    setShowNutritionSettings(true);
  };

  const getCalorieProgressColor = () => {
    if (calorieProgress < 70) return 'from-emerald-400 to-emerald-500';
    if (calorieProgress < 90) return 'from-amber-400 to-amber-500';
    if (calorieProgress < 100) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  const getMealTimeLabel = (timeId: string) => {
    return MEAL_TIMES.find(t => t.id === timeId)?.name || timeId;
  };

  const supplementsTaken = trackedSupplements.filter(s => s.taken).length;
  const supplementsTotal = trackedSupplements.length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Ernährung
            </h1>
            <p className="text-gray-600">
              Kalorien, Protein & Supplements tracken
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNutritionSettings(true)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-primary-600"
              title="Lebensmittel & Supplements verwalten"
              aria-label="Einstellungen"
            >
              <Utensils className="w-6 h-6" />
            </button>
            <button
              onClick={handleOpenGoalsSettings}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-primary-600"
              title="Ziele anpassen"
              aria-label="Ziele anpassen"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Calories Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Kalorien</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCalories.toLocaleString()} <span className="text-base font-normal text-gray-400">/ {dailyCalorieGoal}</span>
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${getCalorieProgressColor()} transition-all duration-500`}
                ref={(el) => { if (el) el.style.width = `${calorieProgress}%`; }}
              />
            </div>
            <p className={`text-sm mt-2 ${caloriesRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {caloriesRemaining >= 0 ? `Noch ${caloriesRemaining} kcal übrig` : `${Math.abs(caloriesRemaining)} kcal über Ziel`}
            </p>
          </div>

          {/* Protein Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Beef className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Protein</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalProtein}g <span className="text-base font-normal text-gray-400">/ {dailyProteinGoal}g</span>
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500`}
                ref={(el) => { if (el) el.style.width = `${proteinProgress}%`; }}
              />
            </div>
            <p className={`text-sm mt-2 ${proteinRemaining > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
              {proteinRemaining > 0 ? `Noch ${proteinRemaining}g übrig` : `Ziel erreicht! 💪`}
            </p>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => setShowQuickAdd(true)}
          className="w-full mb-6 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
        >
          <Plus className="w-6 h-6" />
          Mahlzeit hinzufügen
        </button>

        {/* Water & Supplements & Sleep Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Water Tracker */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-blue-500" />
                <div>
                  <span className="font-semibold text-gray-900">Wasser</span>
                  <p className="text-xs text-gray-500">{waterMl}ml / 2000ml</p>
                </div>
              </div>
              <button
                onClick={() => setShowWaterInfo(true)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                title="Info"
                aria-label="Wasser-Info"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: waterGoal }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-lg transition-all ${
                    i < waterGlasses 
                      ? 'bg-gradient-to-t from-blue-400 to-blue-500' 
                      : 'bg-gray-100'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleRemoveWater}
                disabled={waterGlasses === 0}
                className="flex-1 p-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title="Wasserglas entfernen"
                aria-label="Wasserglas entfernen"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={handleAddWater}
                className="flex-1 p-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>250ml</span>
              </button>
            </div>
          </div>

          {/* Sleep Tracker */}
          <button
            onClick={() => setShowSleepTracker(true)}
            className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Bed className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Schlaf</span>
                  {todaySleep ? (
                    <p className="text-sm text-gray-500">{todaySleep.hoursSlept}h • Qualität {todaySleep.quality}/5</p>
                  ) : (
                    <p className="text-sm text-gray-500">Noch nicht getrackt</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            
            {todaySleep ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((q) => (
                  <div
                    key={q}
                    className={`flex-1 h-3 rounded-full ${
                      q <= todaySleep.quality
                        ? 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                        : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full bg-gray-100 rounded-full h-3" />
            )}
          </button>

          {/* Supplements Summary */}
          <button
            onClick={() => setShowSupplements(true)}
            className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Supplements</span>
                  <p className="text-sm text-gray-500">{supplementsTaken} / {supplementsTotal} eingenommen</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                ref={(el) => { if (el) el.style.width = `${supplementsTotal > 0 ? (supplementsTaken / supplementsTotal) * 100 : 0}%`; }}
              />
            </div>
          </button>
        </div>

        {/* Today's Meals */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Heutige Mahlzeiten</h2>
          
          {todayMeals.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Noch keine Mahlzeiten heute</p>
              <p className="text-sm text-gray-400">Füge deine erste Mahlzeit hinzu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal) => (
                <div 
                  key={meal.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{meal.name}</p>
                      <p className="text-sm text-gray-500">{getMealTimeLabel(meal.time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="font-semibold text-gray-900">{meal.calories} kcal</p>
                      <p className="text-sm text-blue-600">{meal.protein}g Protein</p>
                    </div>
                    <button
                      onClick={() => handleOpenSaveMealModal(meal)}
                      className="p-2 hover:bg-amber-100 text-amber-500 rounded-lg transition-colors"
                      title="Als Vorlage speichern"
                      aria-label="Als Vorlage speichern"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                      title="Entfernen"
                      aria-label="Mahlzeit entfernen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7-Day Nutrition Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            📈 7-Tage Trend
          </h2>
          <NutritionTrend showGoals />
        </div>

        {/* Meal Timing Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            ⏰ Mahlzeiten-Timing
          </h2>
          <MealTimingAnalysis />
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Mahlzeit hinzufügen</h3>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Schließen"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Meal Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tageszeit</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TIMES.map((time) => {
                    const Icon = time.icon;
                    return (
                      <button
                        key={time.id}
                        onClick={() => setSelectedMealTime(time.id)}
                        className={`p-3 rounded-xl transition-all text-center ${
                          selectedMealTime === time.id
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${
                          selectedMealTime === time.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <p className="text-xs font-medium text-gray-700">{time.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Meals */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Schnellauswahl</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_MEALS.map((meal) => (
                    <button
                      key={meal.id}
                      onClick={() => handleAddQuickMeal(meal)}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{meal.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{meal.name}</p>
                          <p className="text-sm text-gray-500">~{meal.calories} kcal</p>
                          <p className="text-xs text-blue-600">~{meal.protein}g Protein</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Meal Templates */}
              {mealTemplates.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Meine gespeicherten Mahlzeiten
                  </label>
                  <div className="space-y-2">
                    {mealTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border-2 border-amber-200"
                      >
                        <button
                          onClick={() => handleAddSavedMeal(template)}
                          className="flex-1 text-left"
                        >
                          <p className="font-medium text-gray-900">{template.name}</p>
                          <p className="text-sm text-gray-500">
                            {template.calories} kcal • {template.protein}g Protein
                          </p>
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors ml-2"
                          title="Vorlage löschen"
                          aria-label="Vorlage löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Entry */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Eigene Eingabe</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Name (optional)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        placeholder="Kalorien"
                        className="w-full px-4 py-3 pr-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kcal</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        placeholder="Protein"
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">g</span>
                    </div>
                  </div>
                  <button
                    onClick={handleAddCustomMeal}
                    disabled={!customCalories}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>

              {/* Detailed Tracking Option */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    setShowDetailedAdd(true);
                  }}
                  className="w-full p-4 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Genaueres Tracking mit Lebensmittel-Suche</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Add Modal (for precise tracking) */}
      {showDetailedAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Genaues Tracking</h3>
                <button
                  onClick={() => setShowDetailedAdd(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Schließen"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Tipp:</strong> Für genaues Tracking kannst du die Nährwerte von der Verpackung ablesen oder eine App wie MyFitnessPal nutzen.
                </p>
              </div>

              {/* Meal Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tageszeit</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TIMES.map((time) => {
                    const Icon = time.icon;
                    return (
                      <button
                        key={time.id}
                        onClick={() => setSelectedMealTime(time.id)}
                        className={`p-3 rounded-xl transition-all text-center ${
                          selectedMealTime === time.id
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${
                          selectedMealTime === time.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <p className="text-xs font-medium text-gray-700">{time.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Entry Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mahlzeit / Lebensmittel</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="z.B. Hähnchenbrust mit Reis"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kalorien *</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 pr-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">kcal</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">g</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddCustomMeal}
                  disabled={!customCalories}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mahlzeit hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Water Info Modal */}
      {showWaterInfo && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-blue-500" />
                <h3 className="font-bold text-gray-900">Wasser trinken</h3>
              </div>
              <button
                onClick={() => setShowWaterInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Schließen"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>💧</span> 1 Glas = 250ml
                </h4>
                <p className="text-sm text-blue-700">
                  Das entspricht etwa einem normalen Trinkglas. Ziel sind 8 Gläser = 2 Liter pro Tag.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Warum ist Wasser so wichtig?</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Leistung:</strong> Schon 2% Dehydration reduziert die Trainingsleistung um bis zu 25%</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Muskelaufbau:</strong> Wasser transportiert Nährstoffe zu den Muskeln</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Regeneration:</strong> Beschleunigt die Erholung nach dem Training</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Fettverbrennung:</strong> Unterstützt den Stoffwechsel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Konzentration:</strong> Verhindert Müdigkeit und Kopfschmerzen</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-sm text-amber-700">
                  <strong>Tipp:</strong> An Trainingstagen solltest du 0,5-1L mehr trinken. Bei Kreatin-Einnahme ebenfalls mehr!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplements Modal */}
      {showSupplements && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">Supplements</h3>
                </div>
                <button
                  onClick={() => setShowSupplements(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Schließen"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Heute eingenommen</span>
                  <span className="font-semibold text-gray-900">{supplementsTaken} / {supplementsTotal}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                    ref={(el) => { if (el) el.style.width = `${supplementsTotal > 0 ? (supplementsTaken / supplementsTotal) * 100 : 0}%`; }}
                  />
                </div>
              </div>

              {/* Supplements List */}
              <div className="space-y-2 mb-6">
                {trackedSupplements.map((supp) => (
                  <button
                    key={supp.id}
                    onClick={() => handleToggleSupplement(supp.id)}
                    className={`w-full p-4 rounded-xl transition-all flex items-center justify-between ${
                      supp.taken 
                        ? 'bg-purple-100 border-2 border-purple-300' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        supp.taken ? 'bg-purple-500' : 'bg-gray-200'
                      }`}>
                        {supp.taken && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${supp.taken ? 'text-purple-900' : 'text-gray-900'}`}>
                          {supp.name}
                        </p>
                        <p className="text-sm text-gray-500">{supp.dosage}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Add Supplement */}
              {!showAddSupplement ? (
                <button
                  onClick={() => setShowAddSupplement(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Supplement hinzufügen
                </button>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={newSupplementName}
                    onChange={(e) => setNewSupplementName(e.target.value)}
                    placeholder="Name (z.B. Zink)"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newSupplementDosage}
                    onChange={(e) => setNewSupplementDosage(e.target.value)}
                    placeholder="Dosierung (z.B. 25mg)"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAddSupplement(false);
                        setNewSupplementName('');
                        setNewSupplementDosage('');
                      }}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleAddNewSupplement}
                      disabled={!newSupplementName.trim()}
                      className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Meal as Template Modal */}
      {showSaveMealModal && mealToSave && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-bold text-gray-900">Als Vorlage speichern</h3>
                </div>
                <button
                  onClick={() => setShowSaveMealModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Schließen"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>{mealToSave.calories} kcal</strong> • {mealToSave.protein}g Protein
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name der Vorlage
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="z.B. Mein Frühstück"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveMealModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveMealAsTemplate}
                  disabled={!templateName.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Tracker Modal */}
      {showSleepTracker && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bed className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-900">Schlaf tracken</h3>
                </div>
                <button
                  onClick={() => setShowSleepTracker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Schließen"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Sleep Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schlafdauer
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="7"
                    className="w-full px-4 py-3 pr-20 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-lg font-semibold"
                    min="0"
                    max="24"
                    step="0.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Stunden</span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schlafqualität
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      onClick={() => setSleepQuality(q as 1 | 2 | 3 | 4 | 5)}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                        sleepQuality === q
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {getSleepQualityLabel(sleepQuality)}
                </p>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Einschlafzeit
                  </label>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Aufwachzeit
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs text-indigo-700">
                  💡 <strong>Tipp:</strong> 7-9 Stunden Schlaf sind optimal für Muskelregeneration. 
                  Schlafqualität beeinflusst deine Recovery-Berechnung.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSleepTracker(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveSleep}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Settings Modal */}
      <NutritionSettingsModal 
        isOpen={showNutritionSettings} 
        onClose={() => setShowNutritionSettings(false)} 
      />
    </DashboardLayout>
  );
}
