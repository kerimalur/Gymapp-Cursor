import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FoodItem, Meal, SavedMeal, NutritionGoals, DailyTracking, Supplement, MuscleGroup } from '@/types';

// Type for saved meal templates
export interface MealTemplate {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fats?: number;
  mealTime: string;
  createdAt: Date;
}

// Type for custom food items
export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
  servingUnit: string;
  category: 'meal' | 'snack' | 'supplement' | 'drink';
}

// Type for supplement presets
export interface SupplementPreset {
  id: string;
  name: string;
  dosage: string;
  timing: string; // e.g., "morning", "pre-workout", "evening"
  notes?: string;
}

// Type for sleep tracking
export interface SleepEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  hoursSlept: number;
  quality: 1 | 2 | 3 | 4 | 5; // 1 = very poor, 5 = excellent
  bedTime?: string; // HH:MM format
  wakeTime?: string; // HH:MM format
  notes?: string;
}

// Type for tracking settings
export interface TrackingSettings {
  enabledMuscles: MuscleGroup[];
  plannedWorkoutDays?: Record<string, number[]>; // weekKey -> array of day indexes (0=Mo, 6=So)
}

// Type for tracked meals (daily logging)
export interface TrackedMeal {
  id: string;
  date: string; // YYYY-MM-DD format
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fats?: number;
  time: string; // breakfast, lunch, dinner, snacks
  createdAt: Date;
}

interface NutritionState {
  foodItems: FoodItem[];
  meals: Meal[];
  savedMeals: SavedMeal[];
  mealTemplates: MealTemplate[];
  customFoods: CustomFood[];
  supplementPresets: SupplementPreset[];
  nutritionGoals: NutritionGoals | null;
  dailyTracking: DailyTracking | null;
  supplements: Supplement[];
  sleepEntries: SleepEntry[];
  trackingSettings: TrackingSettings;
  trackedMeals: TrackedMeal[];
  setFoodItems: (items: FoodItem[]) => void;
  setMeals: (meals: Meal[]) => void;
  setMealTemplates: (templates: MealTemplate[]) => void;
  setCustomFoods: (foods: CustomFood[]) => void;
  setSupplementPresets: (presets: SupplementPreset[]) => void;
  setSleepEntries: (entries: SleepEntry[]) => void;
  setTrackingSettings: (settings: TrackingSettings) => void;
  addMeal: (meal: Meal) => void;
  setSavedMeals: (meals: SavedMeal[]) => void;
  setNutritionGoals: (goals: NutritionGoals) => void;
  setDailyTracking: (tracking: DailyTracking) => void;
  resetDailyTrackingIfNeeded: () => void;
  updateWater: (milliliters: number) => void;
  setSupplements: (supplements: Supplement[]) => void;
  addSupplement: (supplement: Supplement) => void;
  removeSupplement: (id: string) => void;
  toggleSupplementTaken: (id: string) => void;
  // Meal Templates
  addMealTemplate: (template: MealTemplate) => void;
  removeMealTemplate: (id: string) => void;
  // Custom Foods
  addCustomFood: (food: CustomFood) => void;
  updateCustomFood: (food: CustomFood) => void;
  removeCustomFood: (id: string) => void;
  // Supplement Presets
  addSupplementPreset: (preset: SupplementPreset) => void;
  removeSupplementPreset: (id: string) => void;
  // Sleep Tracking
  addSleepEntry: (entry: SleepEntry) => void;
  updateSleepEntry: (entry: SleepEntry) => void;
  removeSleepEntry: (id: string) => void;
  getSleepForDate: (date: string) => SleepEntry | undefined;
  // Tracking Settings
  setEnabledMuscles: (muscles: MuscleGroup[]) => void;
  toggleMuscle: (muscle: MuscleGroup) => void;
  setPlannedWorkoutDays: (weekKey: string, days: number[]) => void;
  getPlannedWorkoutDays: (weekKey: string) => number[];
  // Tracked Meals (daily logging)
  setTrackedMeals: (meals: TrackedMeal[]) => void;
  addTrackedMeal: (meal: Omit<TrackedMeal, 'id' | 'date' | 'createdAt'>) => void;
  removeTrackedMeal: (id: string) => void;
  getTrackedMealsForDate: (date: string) => TrackedMeal[];
  // Auto-cleanup old data
  cleanupOldMeals: (daysToKeep?: number) => number;
  // 7-day nutrition trend
  get7DayNutritionTrend: () => { date: string; calories: number; protein: number; carbs: number; fats: number; }[];
}

const DEFAULT_ENABLED_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'abs', 'quadriceps', 'hamstrings', 'glutes', 'lats'
];

function getTodayKey(date: Date = new Date()) {
  return date.toISOString().split('T')[0];
}

function parseTrackingDate(date: Date | string | undefined) {
  return date ? new Date(date) : new Date();
}

function normalizeDailyTracking(tracking: DailyTracking | null): DailyTracking {
  const baseDate = parseTrackingDate(tracking?.date);
  const isToday = getTodayKey(baseDate) === getTodayKey();
  const rawWaterIntake = tracking?.waterIntake || 0;
  const migratedWaterIntake =
    rawWaterIntake > 0 && rawWaterIntake <= 20 ? rawWaterIntake * 250 : rawWaterIntake;

  if (!isToday) {
    return {
      userId: tracking?.userId || '',
      date: new Date(),
      waterIntake: 0,
      caffeineIntake: 0,
      supplementsTaken: [],
    };
  }

  return {
    userId: tracking?.userId || '',
    date: baseDate,
    waterIntake: Math.max(0, migratedWaterIntake),
    caffeineIntake: Math.max(0, tracking?.caffeineIntake || 0),
    supplementsTaken: tracking?.supplementsTaken || [],
  };
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      foodItems: [],
      meals: [],
      savedMeals: [],
      mealTemplates: [],
      customFoods: [],
      supplementPresets: [],
      nutritionGoals: null,
      dailyTracking: null,
      supplements: [],
      sleepEntries: [],
      trackingSettings: {
        enabledMuscles: DEFAULT_ENABLED_MUSCLES,
      },
      setFoodItems: (foodItems) => set({ foodItems }),
      setMeals: (meals) => set({ meals }),
      setMealTemplates: (mealTemplates) => set({ mealTemplates }),
      setCustomFoods: (customFoods) => set({ customFoods }),
      setSupplementPresets: (supplementPresets) => set({ supplementPresets }),
      setSleepEntries: (sleepEntries) => set({ sleepEntries }),
      setTrackingSettings: (trackingSettings) => set({ trackingSettings }),
      addMeal: (meal) => set((state) => ({ meals: [...state.meals, meal] })),
      setSavedMeals: (savedMeals) => set({ savedMeals }),
      setNutritionGoals: (nutritionGoals) => set({ nutritionGoals }),
      setDailyTracking: (dailyTracking) => set({ dailyTracking: normalizeDailyTracking(dailyTracking) }),
      resetDailyTrackingIfNeeded: () => set((state) => ({
        dailyTracking: normalizeDailyTracking(state.dailyTracking),
      })),
      updateWater: (milliliters) => set((state) => {
        const dailyTracking = normalizeDailyTracking(state.dailyTracking);
        return {
          dailyTracking: {
            ...dailyTracking,
            waterIntake: Math.max(0, milliliters),
          },
        };
      }),
      setSupplements: (supplements) => set((state) => {
        const validSupplementIds = new Set(supplements.map((supplement) => supplement.id));
        const dailyTracking = normalizeDailyTracking(state.dailyTracking);

        return {
          supplements,
          dailyTracking: {
            ...dailyTracking,
            supplementsTaken: dailyTracking.supplementsTaken.filter((id) => validSupplementIds.has(id)),
          },
        };
      }),
      addSupplement: (supplement) => set((state) => ({ supplements: [...state.supplements, supplement] })),
      removeSupplement: (id) => set((state) => {
        const filtered = state.supplements.filter(s => s.id !== id);
        const dailyTracking = normalizeDailyTracking(state.dailyTracking);
        return {
          supplements: [...filtered],
          dailyTracking: {
            ...dailyTracking,
            supplementsTaken: dailyTracking.supplementsTaken.filter((supplementId) => supplementId !== id),
          },
        };
      }),
      toggleSupplementTaken: (id) => set((state) => {
        const dailyTracking = normalizeDailyTracking(state.dailyTracking);
        const isTaken = dailyTracking.supplementsTaken.includes(id);

        return {
          dailyTracking: {
            ...dailyTracking,
            supplementsTaken: isTaken
              ? dailyTracking.supplementsTaken.filter((supplementId) => supplementId !== id)
              : [...dailyTracking.supplementsTaken, id],
          },
        };
      }),
      // Meal Templates
      addMealTemplate: (template) => set((state) => ({ 
        mealTemplates: [...state.mealTemplates, template] 
      })),
      removeMealTemplate: (id) => set((state) => ({ 
        mealTemplates: state.mealTemplates.filter(t => t.id !== id) 
      })),
      // Custom Foods
      addCustomFood: (food) => set((state) => ({
        customFoods: [...state.customFoods, food]
      })),
      updateCustomFood: (food) => set((state) => ({
        customFoods: state.customFoods.map(f => f.id === food.id ? food : f)
      })),
      removeCustomFood: (id) => set((state) => ({
        customFoods: state.customFoods.filter(f => f.id !== id)
      })),
      // Supplement Presets
      addSupplementPreset: (preset) => set((state) => ({
        supplementPresets: [...state.supplementPresets, preset]
      })),
      removeSupplementPreset: (id) => set((state) => ({
        supplementPresets: state.supplementPresets.filter(p => p.id !== id)
      })),
      // Sleep Tracking
      addSleepEntry: (entry) => set((state) => ({ 
        sleepEntries: [...state.sleepEntries, entry] 
      })),
      updateSleepEntry: (entry) => set((state) => ({
        sleepEntries: state.sleepEntries.map(e => e.id === entry.id ? entry : e)
      })),
      removeSleepEntry: (id) => set((state) => ({ 
        sleepEntries: state.sleepEntries.filter(e => e.id !== id) 
      })),
      getSleepForDate: (date) => get().sleepEntries.find(e => e.date === date),
      // Tracking Settings
      setEnabledMuscles: (muscles) => set((state) => ({
        trackingSettings: { ...state.trackingSettings, enabledMuscles: muscles }
      })),
      toggleMuscle: (muscle) => set((state) => {
        const current = state.trackingSettings.enabledMuscles;
        const newMuscles = current.includes(muscle)
          ? current.filter(m => m !== muscle)
          : [...current, muscle];
        return { trackingSettings: { ...state.trackingSettings, enabledMuscles: newMuscles } };
      }),
      setPlannedWorkoutDays: (weekKey, days) => set((state) => ({
        trackingSettings: { 
          ...state.trackingSettings, 
          plannedWorkoutDays: { 
            ...state.trackingSettings.plannedWorkoutDays, 
            [weekKey]: days 
          } 
        }
      })),
      getPlannedWorkoutDays: (weekKey) => {
        const settings = get().trackingSettings;
        return settings.plannedWorkoutDays?.[weekKey] || [];
      },
      // Tracked Meals (daily logging)
      trackedMeals: [],
      setTrackedMeals: (trackedMeals) => set({ trackedMeals }),
      addTrackedMeal: (meal) => set((state) => ({
        trackedMeals: [...state.trackedMeals, {
          ...meal,
          id: `meal-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
        }]
      })),
      removeTrackedMeal: (id) => set((state) => ({
        trackedMeals: state.trackedMeals.filter(m => m.id !== id)
      })),
      getTrackedMealsForDate: (date) => get().trackedMeals.filter(m => m.date === date),
      // Auto-cleanup old meals (default: 30 days)
      cleanupOldMeals: (daysToKeep = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
        
        const currentMeals = get().trackedMeals;
        const newMeals = currentMeals.filter(m => m.date >= cutoffDateStr);
        const removedCount = currentMeals.length - newMeals.length;
        
        if (removedCount > 0) {
          set({ trackedMeals: newMeals });
        }
        
        return removedCount;
      },
      // 7-day nutrition trend
      get7DayNutritionTrend: () => {
        const meals = get().trackedMeals;
        const trend: { date: string; calories: number; protein: number; carbs: number; fats: number; }[] = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayMeals = meals.filter(m => m.date === dateStr);
          trend.push({
            date: dateStr,
            calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
            protein: dayMeals.reduce((sum, m) => sum + m.protein, 0),
            carbs: dayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
            fats: dayMeals.reduce((sum, m) => sum + (m.fats || 0), 0),
          });
        }
        
        return trend;
      },
    }),
    {
      name: 'nutrition-storage',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const str = localStorage.getItem(name);
          if (!str) return null;

          const parsed = JSON.parse(str);

          if (parsed.state.dailyTracking) {
            parsed.state.dailyTracking = normalizeDailyTracking(parsed.state.dailyTracking);
          }

          return parsed;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);
