'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Check,
  X,
  Flame,
  Info,
  Minus,
  Pill,
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

type TabId = 'mahlzeiten' | 'wasser-schlaf' | 'supplements' | 'analyse';

export default function NutritionPage() {
  const searchParams = useSearchParams();
  const {
    nutritionGoals, dailyTracking, updateWater, supplements, addSupplement, removeSupplement,
    toggleSupplementTaken, mealTemplates, addMealTemplate, removeMealTemplate,
    sleepEntries, addSleepEntry, trackedMeals, addTrackedMeal, removeTrackedMeal,
    cleanupOldMeals, resetDailyTrackingIfNeeded
  } = useNutritionStore();

  // Get today's date for filtering
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  // Get today's meals from store (persisted)
  const todayMeals = trackedMeals.filter(m => m.date === todayDate);

  const [activeTab, setActiveTab] = useState<TabId>('mahlzeiten');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDetailedAdd, setShowDetailedAdd] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<string>('lunch');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customName, setCustomName] = useState('');
  const [showWaterInfo, setShowWaterInfo] = useState(false);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState('');
  const [newSupplementDosage, setNewSupplementDosage] = useState('');
  // New state for saved meals
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
  const quickAddModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetDailyTrackingIfNeeded();
  }, [resetDailyTrackingIfNeeded]);

  // Get today's sleep entry (reuse todayDate from above)
  const todaySleep = sleepEntries.find(e => e.date === todayDate);

  useEffect(() => {
    const shouldOpenQuickAdd = searchParams.get('quickAdd') === '1';
    if (shouldOpenQuickAdd) {
      setShowQuickAdd(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenQuickMealModal = () => {
      setShowQuickAdd(true);
    };

    window.addEventListener('open-quick-meal-modal', handleOpenQuickMealModal);
    return () => window.removeEventListener('open-quick-meal-modal', handleOpenQuickMealModal);
  }, []);

  useEffect(() => {
    if (showQuickAdd) {
      document.body.style.overflow = 'hidden';
      quickAddModalRef.current?.focus();
      quickAddModalRef.current?.scrollIntoView({ block: 'center' });
      return;
    }

    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showQuickAdd]);

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

  // Calculate today's totals
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = todayMeals.reduce((sum, meal) => sum + (('carbs' in meal ? (meal as { carbs?: number }).carbs : undefined) || 0), 0);
  const totalFat = todayMeals.reduce((sum, meal) => sum + (('fat' in meal ? (meal as { fat?: number }).fat : undefined) || 0), 0);
  const dailyCalorieGoal = nutritionGoals?.dailyCalories || 2500;
  const dailyProteinGoal = nutritionGoals?.dailyProtein || 150;
  const caloriesRemaining = dailyCalorieGoal - totalCalories;
  const calorieProgress = Math.min((totalCalories / dailyCalorieGoal) * 100, 100);
  const proteinProgress = Math.min((totalProtein / dailyProteinGoal) * 100, 100);

  // Water tracking
  const waterMl = dailyTracking?.waterIntake || 0;
  const waterGoalMl = nutritionGoals?.waterGoal || 2000;
  const waterSegmentCount = Math.max(6, Math.ceil(waterGoalMl / 250));
  const takenSupplementIds = dailyTracking?.supplementsTaken || [];
  const activeSupplements = supplements.filter((supplement) => supplement.isActive !== false);

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
    toast.success(`"${template.name}" als Vorlage gespeichert`);
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
    toast.success(`Schlaf gespeichert: ${hours}h, Qualität ${sleepQuality}/5`);
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
    updateWater(waterMl + 250);
    toast.success('+250ml Wasser');
  };

  const handleRemoveWater = () => {
    if (waterMl > 0) {
      updateWater(Math.max(0, waterMl - 250));
      toast.success('-250ml Wasser');
    }
  };

  const handleToggleSupplement = (suppId: string) => {
    const supplement = activeSupplements.find((entry) => entry.id === suppId);
    const wasTaken = takenSupplementIds.includes(suppId);
    toggleSupplementTaken(suppId);

    if (supplement && !wasTaken) {
      toast.success(`${supplement.name} eingenommen`);
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

  const supplementsTaken = activeSupplements.filter((supplement) =>
    takenSupplementIds.includes(supplement.id)
  ).length;
  const supplementsTotal = activeSupplements.length;

  // ── Tab definitions ──────────────────────────────────────────────────────
  const TABS: { id: TabId; label: string }[] = [
    { id: 'mahlzeiten', label: 'Mahlzeiten' },
    { id: 'wasser-schlaf', label: 'Wasser & Schlaf' },
    { id: 'supplements', label: 'Supplements' },
    { id: 'analyse', label: 'Analyse' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">

        {/* ── Sticky top bar: daily macro summary ─────────────────────────── */}
        <div className="sticky top-0 z-10 bg-[hsl(225,14%,10%)]/95 backdrop-blur-sm border-b border-[hsl(225,10%,16%)] -mx-4 px-4 py-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            {/* Title + settings */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Ernährung</h1>
              <button
                onClick={handleOpenGoalsSettings}
                className="p-1.5 hover:bg-[hsl(225,12%,13%)] rounded-lg transition-colors text-[hsl(var(--fg-subtle))]"
                title="Ziele anpassen"
                aria-label="Ziele anpassen"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Macro pill badges */}
            <div className="flex items-center gap-2 overflow-x-auto flex-shrink-0">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                calorieProgress >= 100 ? 'bg-red-100 text-red-700' : calorieProgress >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'
              }`}>
                <Flame className="w-3 h-3" />
                {totalCalories} / {dailyCalorieGoal} kcal
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                proteinProgress >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Beef className="w-3 h-3" />
                {totalProtein}g P
              </span>
              {totalCarbs > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 whitespace-nowrap">
                  {totalCarbs}g K
                </span>
              )}
              {totalFat > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 whitespace-nowrap">
                  {totalFat}g F
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab navigation ───────────────────────────────────────────────── */}
        <div className="flex bg-[hsl(225,12%,13%)] rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[hsl(225,14%,10%)] text-[hsl(var(--fg-primary))] shadow-sm'
                  : 'text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg-secondary))]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Mahlzeiten
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'mahlzeiten' && (
          <div className="space-y-5">
            {/* Quick-add templates – horizontal scroll */}
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wide mb-3">Schnell hinzufügen</p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {/* Saved templates first */}
                {mealTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleAddSavedMeal(template)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 bg-amber-50 border-2 border-amber-200 hover:border-amber-400 rounded-2xl transition-all w-24 text-center"
                  >
                    <Star className="w-5 h-5 text-amber-500" />
                    <p className="text-xs font-semibold text-[hsl(var(--fg-primary))] leading-tight line-clamp-2">{template.name}</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">{template.calories} kcal</p>
                  </button>
                ))}
                {/* Preset quick meals */}
                {QUICK_MEALS.map(meal => (
                  <button
                    key={meal.id}
                    onClick={() => {
                      addTrackedMeal({ name: meal.name, calories: meal.calories, protein: meal.protein, time: 'snacks' });
                      toast.success(`${meal.name} hinzugefügt`);
                    }}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 bg-[hsl(225,14%,10%)] border-2 border-[hsl(225,10%,16%)] hover:border-primary-400 hover:bg-primary-50 rounded-2xl transition-all w-24 text-center"
                  >
                    <span className="text-2xl">{meal.icon}</span>
                    <p className="text-xs font-semibold text-[hsl(var(--fg-primary))] leading-tight line-clamp-2">{meal.name}</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">{meal.calories} kcal</p>
                  </button>
                ))}
                {/* Custom add */}
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 p-3 bg-[hsl(225,14%,10%)] border-2 border-dashed border-[hsl(225,10%,16%)] hover:border-primary-400 rounded-2xl transition-all w-24 text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary-600" />
                  </div>
                  <p className="text-xs font-semibold text-[hsl(var(--fg-secondary))]">Eigene</p>
                </button>
              </div>
            </div>

            {/* Main add button */}
            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-full p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" />
              Mahlzeit hinzufügen
            </button>

            {/* Calorie progress bar */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-sm border border-[hsl(225,10%,16%)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Kalorien heute</p>
                    <p className="text-lg font-bold text-[hsl(var(--fg-primary))]">
                      {totalCalories.toLocaleString()} <span className="text-sm font-normal text-[hsl(var(--fg-subtle))]">/ {dailyCalorieGoal}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Protein</p>
                    <p className="text-lg font-bold text-cyan-400">{totalProtein}g</p>
                  </div>
                  <div className={`text-right px-3 py-1 rounded-xl ${caloriesRemaining >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Verbleibend</p>
                    <p className={`text-sm font-bold ${caloriesRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {caloriesRemaining >= 0 ? `${caloriesRemaining}` : `+${Math.abs(caloriesRemaining)}`} kcal
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-[hsl(225,12%,13%)] rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getCalorieProgressColor()} transition-all duration-500`}
                  style={{ width: `${calorieProgress}%` }}
                />
              </div>
            </div>

            {/* Meals grouped by time */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(225,10%,16%)]">
                <h2 className="font-semibold text-[hsl(var(--fg-primary))]">Heutige Mahlzeiten</h2>
                <span className="text-xs text-[hsl(var(--fg-subtle))]">{todayMeals.length} Einträge</span>
              </div>

              {todayMeals.length === 0 ? (
                <div className="text-center py-10 px-5">
                  <Utensils className="w-10 h-10 text-[hsl(var(--fg-subtle))] mx-auto mb-3" />
                  <p className="text-[hsl(var(--fg-muted))] font-medium">Noch keine Mahlzeiten heute</p>
                  <p className="text-sm text-[hsl(var(--fg-subtle))] mt-1">Füge deine erste Mahlzeit hinzu</p>
                </div>
              ) : (
                <div>
                  {MEAL_TIMES.map(mealTime => {
                    const mealsForTime = todayMeals.filter(m => m.time === mealTime.id);
                    if (mealsForTime.length === 0) return null;
                    const MealIcon = mealTime.icon;
                    return (
                      <div key={mealTime.id} className="border-b border-[hsl(225,10%,16%)] last:border-0">
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(225,12%,13%)]">
                          <MealIcon className="w-3.5 h-3.5 text-[hsl(var(--fg-subtle))]" />
                          <span className="text-xs font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wide">{mealTime.name}</span>
                          <span className="text-xs text-[hsl(var(--fg-subtle))]">{mealTime.time}</span>
                        </div>
                        <div className="divide-y divide-[hsl(225,10%,16%)]">
                          {mealsForTime.map(meal => (
                            <div key={meal.id} className="flex items-center justify-between px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-[hsl(var(--fg-primary))] text-sm">{meal.name}</p>
                                  <p className="text-xs text-cyan-400">{meal.protein}g Protein</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-[hsl(var(--fg-primary))] mr-2">{meal.calories} kcal</span>
                                <button
                                  onClick={() => handleOpenSaveMealModal(meal)}
                                  className="p-1.5 hover:bg-amber-100 text-amber-400 rounded-lg transition-colors"
                                  title="Als Vorlage speichern"
                                  aria-label="Als Vorlage speichern"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMeal(meal.id)}
                                  className="p-1.5 hover:bg-red-100 text-red-400 rounded-lg transition-colors"
                                  title="Entfernen"
                                  aria-label="Mahlzeit entfernen"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Meals without a matching time slot */}
                  {(() => {
                    const knownTimeIds = MEAL_TIMES.map(t => t.id);
                    const otherMeals = todayMeals.filter(m => !knownTimeIds.includes(m.time));
                    if (otherMeals.length === 0) return null;
                    return (
                      <div className="border-t border-[hsl(225,10%,16%)]">
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(225,12%,13%)]">
                          <Clock className="w-3.5 h-3.5 text-[hsl(var(--fg-subtle))]" />
                          <span className="text-xs font-semibold text-[hsl(var(--fg-muted))] uppercase tracking-wide">Sonstige</span>
                        </div>
                        <div className="divide-y divide-[hsl(225,10%,16%)]">
                          {otherMeals.map(meal => (
                            <div key={meal.id} className="flex items-center justify-between px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-[hsl(var(--fg-primary))] text-sm">{meal.name}</p>
                                  <p className="text-xs text-[hsl(var(--fg-subtle))]">{getMealTimeLabel(meal.time)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-[hsl(var(--fg-primary))] mr-2">{meal.calories} kcal</span>
                                <button
                                  onClick={() => handleRemoveMeal(meal.id)}
                                  className="p-1.5 hover:bg-red-100 text-red-400 rounded-lg transition-colors"
                                  aria-label="Mahlzeit entfernen"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Wasser & Schlaf
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'wasser-schlaf' && (
          <div className="space-y-5">
            {/* Water Tracker */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-sm border border-[hsl(225,10%,16%)] p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[hsl(var(--fg-primary))]">Wasserzufuhr</h2>
                    <p className="text-sm text-[hsl(var(--fg-muted))]">{waterMl}ml / {waterGoalMl}ml</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWaterInfo(true)}
                  className="p-2 hover:bg-[hsl(225,12%,13%)] rounded-lg text-[hsl(var(--fg-subtle))] hover:text-blue-500 transition-colors"
                  title="Info"
                  aria-label="Wasser-Info"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-blue-50 rounded-full h-4 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min((waterMl / waterGoalMl) * 100, 100)}%` }}
                />
              </div>

              {/* Segment dots */}
              <div className="flex items-center gap-1.5 mb-5">
                {Array.from({ length: waterSegmentCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-7 rounded-lg transition-all ${
                      i * 250 < waterMl
                        ? 'bg-gradient-to-t from-blue-400 to-blue-500'
                        : 'bg-[hsl(225,12%,13%)]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRemoveWater}
                  disabled={waterMl === 0}
                  className="flex-1 p-3 border-2 border-[hsl(225,10%,16%)] text-[hsl(var(--fg-secondary))] rounded-xl font-medium hover:bg-[hsl(225,12%,13%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label="Wasserglas entfernen"
                >
                  <Minus className="w-5 h-5" />
                  <span>–250ml</span>
                </button>
                <button
                  onClick={handleAddWater}
                  className="flex-1 p-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>+250ml</span>
                </button>
              </div>
            </div>

            {/* Sleep Tracker */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-sm border border-[hsl(225,10%,16%)] p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Bed className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[hsl(var(--fg-primary))]">Schlaf</h2>
                    {todaySleep ? (
                      <p className="text-sm text-[hsl(var(--fg-muted))]">{todaySleep.hoursSlept}h · Qualität {todaySleep.quality}/5</p>
                    ) : (
                      <p className="text-sm text-[hsl(var(--fg-muted))]">Noch nicht getrackt</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowSleepTracker(true)}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
                >
                  {todaySleep ? 'Bearbeiten' : 'Eintragen'}
                </button>
              </div>

              {todaySleep ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((q) => (
                      <div
                        key={q}
                        className={`flex-1 h-3 rounded-full ${
                          q <= todaySleep.quality
                            ? 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                            : 'bg-[hsl(225,12%,13%)]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{todaySleep.hoursSlept}h</p>
                      <p className="text-xs text-indigo-500">Schlafdauer</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${getSleepQualityColor(todaySleep.quality)}`}>
                      <p className="text-2xl font-bold">{todaySleep.quality}/5</p>
                      <p className="text-xs opacity-70">Qualität</p>
                    </div>
                    <div className="bg-[hsl(225,12%,13%)] rounded-xl p-3 text-center">
                      <p className="text-sm font-bold text-[hsl(var(--fg-secondary))]">{todaySleep.bedTime}</p>
                      <p className="text-xs text-[hsl(var(--fg-muted))]">Einschlaf</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSleepTracker(true)}
                  className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-medium"
                >
                  Schlaf für heute eintragen
                </button>
              )}
            </div>

            {/* Recent sleep history */}
            {sleepEntries.length > 1 && (
              <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-5">
                <h3 className="font-semibold text-[hsl(var(--fg-primary))] mb-3">Letzte Einträge</h3>
                <div className="space-y-2">
                  {sleepEntries
                    .filter(e => e.date !== todayDate)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5)
                    .map(entry => (
                      <div key={entry.id} className="flex items-center justify-between py-2 border-b border-[hsl(225,10%,16%)] last:border-0">
                        <span className="text-sm text-[hsl(var(--fg-secondary))]">{entry.date}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[hsl(var(--fg-primary))]">{entry.hoursSlept}h</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getSleepQualityColor(entry.quality)}`}>
                            {getSleepQualityLabel(entry.quality)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Supplements
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'supplements' && (
          <div className="space-y-5">
            {/* Progress header */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-[hsl(var(--fg-primary))]">Heutige Supplements</h2>
                  <p className="text-sm text-[hsl(var(--fg-muted))]">{supplementsTaken} von {supplementsTotal} eingenommen</p>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-purple-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-700">
                    {supplementsTotal > 0 ? Math.round((supplementsTaken / supplementsTotal) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-[hsl(225,12%,13%)] rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                  style={{ width: `${supplementsTotal > 0 ? (supplementsTaken / supplementsTotal) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Supplements list */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] overflow-hidden">
              <div className="divide-y divide-[hsl(225,10%,16%)]">
                {activeSupplements.map(supplement => {
                  const isTaken = takenSupplementIds.includes(supplement.id);
                  return (
                    <div
                      key={supplement.id}
                      className={`flex items-center gap-3 px-5 py-4 transition-all ${
                        isTaken ? 'bg-purple-50' : 'bg-[hsl(225,14%,10%)] hover:bg-[hsl(225,12%,13%)]'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleSupplement(supplement.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isTaken ? 'bg-purple-500' : 'bg-[hsl(225,12%,20%)] hover:bg-[hsl(225,12%,25%)]'
                        }`}
                        aria-label={isTaken ? 'Als nicht eingenommen markieren' : 'Als eingenommen markieren'}
                      >
                        {isTaken && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isTaken ? 'text-purple-900' : 'text-[hsl(var(--fg-primary))]'}`}>
                          {supplement.name}
                        </p>
                        <p className="text-xs text-[hsl(var(--fg-muted))]">{supplement.dosage} · {supplement.timing}</p>
                      </div>
                      <button
                        onClick={() => {
                          removeSupplement(supplement.id);
                          toast.success('Supplement gelöscht');
                        }}
                        className="p-1.5 text-[hsl(var(--fg-subtle))] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        aria-label="Supplement löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {activeSupplements.length === 0 && (
                <div className="text-center py-10">
                  <Pill className="w-10 h-10 text-[hsl(var(--fg-subtle))] mx-auto mb-3" />
                  <p className="text-[hsl(var(--fg-muted))] font-medium">Keine Supplements</p>
                </div>
              )}
            </div>

            {/* Add supplement */}
            {!showAddSupplement ? (
              <button
                onClick={() => setShowAddSupplement(true)}
                className="w-full p-4 border-2 border-dashed border-[hsl(225,10%,16%)] rounded-2xl text-[hsl(var(--fg-muted))] hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 bg-[hsl(225,14%,10%)]"
              >
                <Plus className="w-5 h-5" />
                Supplement hinzufügen
              </button>
            ) : (
              <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-5 space-y-3">
                <h3 className="font-semibold text-[hsl(var(--fg-primary))]">Neues Supplement</h3>
                <input
                  type="text"
                  value={newSupplementName}
                  onChange={(e) => setNewSupplementName(e.target.value)}
                  placeholder="Name (z.B. Zink)"
                  className="w-full px-4 py-2.5 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-purple-500 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                />
                <input
                  type="text"
                  value={newSupplementDosage}
                  onChange={(e) => setNewSupplementDosage(e.target.value)}
                  placeholder="Dosierung (z.B. 25mg)"
                  className="w-full px-4 py-2.5 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-purple-500 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAddSupplement(false); setNewSupplementName(''); setNewSupplementDosage(''); }}
                    className="flex-1 py-2.5 bg-[hsl(225,12%,13%)] text-[hsl(var(--fg-secondary))] rounded-xl font-medium hover:bg-[hsl(225,12%,20%)] transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleAddNewSupplement}
                    disabled={!newSupplementName.trim()}
                    className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Analyse
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analyse' && (
          <div className="space-y-5">
            {/* 7-day macro trend */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-sm border border-[hsl(225,10%,16%)] p-6">
              <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))] mb-1">7-Tage Trend</h2>
              <p className="text-sm text-[hsl(var(--fg-muted))] mb-5">Kalorien- und Proteinverlauf der letzten Woche</p>
              <NutritionTrend showGoals />
            </div>

            {/* Meal timing */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl shadow-sm border border-[hsl(225,10%,16%)] p-6">
              <h2 className="text-lg font-bold text-[hsl(var(--fg-primary))] mb-1">Mahlzeiten-Timing</h2>
              <p className="text-sm text-[hsl(var(--fg-muted))] mb-5">Wann isst du am meisten?</p>
              <MealTimingAnalysis />
            </div>

            {/* Protein progress */}
            <div className="bg-[hsl(225,14%,10%)] rounded-2xl border border-[hsl(225,10%,16%)] p-5">
              <h3 className="font-semibold text-[hsl(var(--fg-primary))] mb-4">Heutige Ziele</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[hsl(var(--fg-secondary))] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" /> Kalorien
                    </span>
                    <span className="text-sm text-[hsl(var(--fg-muted))]">{totalCalories} / {dailyCalorieGoal} kcal</span>
                  </div>
                  <div className="w-full bg-[hsl(225,12%,13%)] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getCalorieProgressColor()} transition-all`}
                      style={{ width: `${calorieProgress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[hsl(var(--fg-secondary))] flex items-center gap-1.5">
                      <Beef className="w-3.5 h-3.5 text-blue-500" /> Protein
                    </span>
                    <span className="text-sm text-[hsl(var(--fg-muted))]">{totalProtein}g / {dailyProteinGoal}g</span>
                  </div>
                  <div className="w-full bg-[hsl(225,12%,13%)] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                      style={{ width: `${proteinProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODALS (unchanged logic – only clean up broken characters)
      ════════════════════════════════════════════════════════════════════ */}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div
            ref={quickAddModalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-meal-title"
            className="bg-[hsl(225,14%,10%)] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex-shrink-0 bg-[hsl(225,14%,10%)] border-b border-[hsl(225,10%,16%)] px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 id="quick-add-meal-title" className="text-xl font-bold text-[hsl(var(--fg-primary))]">Mahlzeit hinzufügen</h3>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="p-2 hover:bg-[hsl(225,12%,13%)] rounded-lg transition-colors"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-[hsl(var(--fg-muted))]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Meal Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-2">Tageszeit</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TIMES.map((time) => {
                    const Icon = time.icon;
                    return (
                      <button
                        key={time.id}
                        onClick={() => setSelectedMealTime(time.id)}
                        className={`p-3 rounded-xl transition-all text-center ${
                          selectedMealTime === time.id
                            ? 'bg-cyan-500/20 border-2 border-cyan-500'
                            : 'bg-[hsl(225,12%,13%)] border-2 border-transparent hover:bg-[hsl(225,12%,20%)]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${selectedMealTime === time.id ? 'text-cyan-400' : 'text-[hsl(var(--fg-subtle))]'}`} />
                        <p className="text-xs font-medium text-[hsl(var(--fg-secondary))]">{time.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Meals */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-2">Schnellauswahl</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_MEALS.map((meal) => (
                    <button
                      key={meal.id}
                      onClick={() => handleAddQuickMeal(meal)}
                      className="p-4 bg-[hsl(225,12%,13%)] rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 border-2 border-transparent transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{meal.icon}</span>
                        <div>
                          <p className="font-medium text-[hsl(var(--fg-primary))]">{meal.name}</p>
                          <p className="text-sm text-[hsl(var(--fg-muted))]">~{meal.calories} kcal</p>
                          <p className="text-xs text-cyan-400">~{meal.protein}g Protein</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Meal Templates */}
              {mealTemplates.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-2 flex items-center gap-2">
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
                          <p className="font-medium text-[hsl(var(--fg-primary))]">{template.name}</p>
                          <p className="text-sm text-[hsl(var(--fg-muted))]">
                            {template.calories} kcal · {template.protein}g Protein
                          </p>
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors ml-2"
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
              <div className="border-t border-[hsl(225,10%,16%)] pt-6">
                <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-2">Eigene Eingabe</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Name (optional)"
                    className="w-full px-4 py-3 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-cyan-400/50 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        placeholder="Kalorien"
                        className="w-full px-4 py-3 pr-14 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-cyan-400/50 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))] text-sm">kcal</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        placeholder="Protein"
                        className="w-full px-4 py-3 pr-10 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-cyan-400/50 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))] text-sm">g</span>
                    </div>
                  </div>
                  <button
                    onClick={handleAddCustomMeal}
                    disabled={!customCalories}
                    className="w-full py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>

              {/* Detailed Tracking Option */}
              <div className="mt-6 pt-6 border-t border-[hsl(225,10%,16%)]">
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    setShowDetailedAdd(true);
                  }}
                  className="w-full p-4 bg-[hsl(225,12%,13%)] rounded-xl text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,20%)] transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Genaueres Tracking mit Lebensmittel-Suche</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Add Modal */}
      {showDetailedAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[hsl(225,14%,10%)] rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-shrink-0 bg-[hsl(225,14%,10%)] border-b border-[hsl(225,10%,16%)] px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Genaues Tracking</h3>
                <button
                  onClick={() => setShowDetailedAdd(false)}
                  className="p-2 hover:bg-[hsl(225,12%,13%)] rounded-lg transition-colors"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-[hsl(var(--fg-muted))]" />
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
                <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-2">Tageszeit</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TIMES.map((time) => {
                    const Icon = time.icon;
                    return (
                      <button
                        key={time.id}
                        onClick={() => setSelectedMealTime(time.id)}
                        className={`p-3 rounded-xl transition-all text-center ${
                          selectedMealTime === time.id
                            ? 'bg-cyan-500/20 border-2 border-cyan-500'
                            : 'bg-[hsl(225,12%,13%)] border-2 border-transparent hover:bg-[hsl(225,12%,20%)]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${selectedMealTime === time.id ? 'text-cyan-400' : 'text-[hsl(var(--fg-subtle))]'}`} />
                        <p className="text-xs font-medium text-[hsl(var(--fg-secondary))]">{time.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Entry Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-1">Mahlzeit / Lebensmittel</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="z.B. Hähnchenbrust mit Reis"
                    className="w-full px-4 py-3 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-cyan-400/50 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-1">Kalorien *</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 pr-14 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-cyan-400/50 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))]">kcal</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--fg-secondary))] mb-1">Protein</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 pr-10 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-cyan-400/50 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))]">g</span>
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
          <div className="bg-[hsl(225,14%,10%)] rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(225,10%,16%)]">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-blue-500" />
                <h3 className="font-bold text-[hsl(var(--fg-primary))]">Wasser trinken</h3>
              </div>
              <button
                onClick={() => setShowWaterInfo(false)}
                className="p-2 hover:bg-[hsl(225,12%,13%)] rounded-lg transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-[hsl(var(--fg-muted))]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">1 Glas = 250ml</h4>
                <p className="text-sm text-blue-700">
                  Das entspricht etwa einem normalen Trinkglas. Ziel sind 8 Gläser = 2 Liter pro Tag.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[hsl(var(--fg-primary))]">Warum ist Wasser so wichtig?</h4>
                <div className="space-y-2 text-sm text-[hsl(var(--fg-secondary))]">
                  {[
                    ['Leistung', 'Schon 2% Dehydration reduziert die Trainingsleistung um bis zu 25%'],
                    ['Muskelaufbau', 'Wasser transportiert Nährstoffe zu den Muskeln'],
                    ['Regeneration', 'Beschleunigt die Erholung nach dem Training'],
                    ['Fettverbrennung', 'Unterstützt den Stoffwechsel'],
                    ['Konzentration', 'Verhindert Müdigkeit und Kopfschmerzen'],
                  ].map(([title, text]) => (
                    <div key={title} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span><strong>{title}:</strong> {text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-sm text-amber-700">
                  <strong>Tipp:</strong> An Trainingstagen solltest du 0,5–1L mehr trinken. Bei Kreatin-Einnahme ebenfalls mehr!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Meal as Template Modal */}
      {showSaveMealModal && mealToSave && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[hsl(225,14%,10%)] rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex-shrink-0 bg-[hsl(225,14%,10%)] border-b border-[hsl(225,10%,16%)] px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Als Vorlage speichern</h3>
                </div>
                <button
                  onClick={() => setShowSaveMealModal(false)}
                  className="p-2 hover:bg-[hsl(225,12%,13%)] rounded-lg transition-colors"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-[hsl(var(--fg-muted))]" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>{mealToSave.calories} kcal</strong> · {mealToSave.protein}g Protein
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">Name der Vorlage</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="z.B. Mein Frühstück"
                  className="w-full px-4 py-3 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-amber-500 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveMealModal(false)}
                  className="flex-1 py-3 bg-[hsl(225,12%,13%)] text-[hsl(var(--fg-secondary))] rounded-xl font-semibold hover:bg-[hsl(225,12%,20%)] transition-colors"
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
          <div className="bg-[hsl(225,14%,10%)] rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex-shrink-0 bg-[hsl(225,14%,10%)] border-b border-[hsl(225,10%,16%)] px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bed className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Schlaf tracken</h3>
                </div>
                <button
                  onClick={() => setShowSleepTracker(false)}
                  className="p-2 hover:bg-[hsl(225,12%,13%)] rounded-lg transition-colors"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5 text-[hsl(var(--fg-muted))]" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Sleep Duration */}
              <div>
                <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">Schlafdauer</label>
                <div className="relative">
                  <input
                    type="number"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="7"
                    className="w-full px-4 py-3 pr-20 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-indigo-500 focus:outline-none text-lg font-semibold bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))]"
                    min="0"
                    max="24"
                    step="0.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))] font-medium">Stunden</span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">Schlafqualität</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      onClick={() => setSleepQuality(q as 1 | 2 | 3 | 4 | 5)}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                        sleepQuality === q
                          ? 'bg-indigo-500 text-white'
                          : 'bg-[hsl(225,12%,13%)] text-[hsl(var(--fg-secondary))] hover:bg-[hsl(225,12%,20%)]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-[hsl(var(--fg-muted))] mt-2">{getSleepQualityLabel(sleepQuality)}</p>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">Einschlafzeit</label>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-indigo-500 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--fg-secondary))] mb-2">Aufwachzeit</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[hsl(225,10%,16%)] rounded-xl focus:border-indigo-500 focus:outline-none bg-[hsl(225,14%,8%)] text-[hsl(var(--fg-primary))]"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs text-indigo-700">
                  <strong>Tipp:</strong> 7–9 Stunden Schlaf sind optimal für Muskelregeneration.
                  Schlafqualität beeinflusst deine Recovery-Berechnung.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSleepTracker(false)}
                  className="flex-1 py-3 bg-[hsl(225,12%,13%)] text-[hsl(var(--fg-secondary))] rounded-xl font-semibold hover:bg-[hsl(225,12%,20%)] transition-colors"
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
