'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { useAppSettingsStore } from '@/store/useAppSettingsStore';
import { loadUserData, debouncedSync, cancelPendingSync } from '@/lib/supabaseSync';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, initializeAuth } = useAuthStore();
  const dataLoadedRef = useRef(false);

  // Initialize Supabase Auth
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      unsubscribe();
      cancelPendingSync();
    };
  }, [initializeAuth]);

  // Load data from Supabase when user logs in
  useEffect(() => {
    if (!user || dataLoadedRef.current) return;

    const loadData = async () => {
      try {
        const data = await loadUserData(user.uid);
        if (data) {
          // Hydrate workout store
          if (data.workout_data && Object.keys(data.workout_data).length > 0) {
            const wd = data.workout_data;
            if (wd.exercises) useWorkoutStore.getState().setExercises(wd.exercises);
            if (wd.customExercises) useWorkoutStore.getState().setCustomExercises(wd.customExercises);
            if (wd.trainingDays) useWorkoutStore.getState().setTrainingDays(wd.trainingDays);
            if (wd.trainingPlans) useWorkoutStore.getState().setTrainingPlans(wd.trainingPlans);
            if (wd.workoutSessions) useWorkoutStore.getState().setWorkoutSessions(wd.workoutSessions);
            if (wd.workoutSettings) useWorkoutStore.getState().updateWorkoutSettings(wd.workoutSettings);
          }

          // Hydrate nutrition store
          if (data.nutrition_data && Object.keys(data.nutrition_data).length > 0) {
            const nd = data.nutrition_data;
            if (nd.foodItems) useNutritionStore.getState().setFoodItems(nd.foodItems);
            if (nd.meals) useNutritionStore.getState().setMeals(nd.meals);
            if (nd.savedMeals) useNutritionStore.getState().setSavedMeals(nd.savedMeals);
            if (nd.nutritionGoals) useNutritionStore.getState().setNutritionGoals(nd.nutritionGoals);
            if (nd.dailyTracking) useNutritionStore.getState().setDailyTracking(nd.dailyTracking);
            if (nd.supplements) useNutritionStore.getState().setSupplements(nd.supplements);
            if (nd.trackedMeals) useNutritionStore.getState().setTrackedMeals(nd.trackedMeals);
            if (nd.mealTemplates) useNutritionStore.getState().setMealTemplates(nd.mealTemplates);
            if (nd.customFoods) useNutritionStore.getState().setCustomFoods(nd.customFoods);
            if (nd.supplementPresets) useNutritionStore.getState().setSupplementPresets(nd.supplementPresets);
            if (nd.sleepEntries) useNutritionStore.getState().setSleepEntries(nd.sleepEntries);
            if (nd.trackingSettings) useNutritionStore.getState().setTrackingSettings(nd.trackingSettings);
          }

          // Hydrate body weight store
          if (data.body_weight_data && Object.keys(data.body_weight_data).length > 0) {
            const bwd = data.body_weight_data;
            if (bwd.entries) {
              bwd.entries.forEach((entry: any) => {
                const existingEntries = useBodyWeightStore.getState().entries;
                if (!existingEntries.find((e: any) => e.id === entry.id)) {
                  useBodyWeightStore.getState().addEntry({
                    weight: entry.weight,
                    date: new Date(entry.date),
                    note: entry.note,
                  });
                }
              });
            }
            if (bwd.goal) useBodyWeightStore.getState().setGoal(bwd.goal);
          }

          // Hydrate app settings
          if (data.settings && Object.keys(data.settings).length > 0) {
            useAppSettingsStore.getState().setAllSettings(data.settings);

            if (data.settings.profileName?.trim()) {
              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                useAuthStore.getState().setUser({
                  ...currentUser,
                  displayName: data.settings.profileName.trim(),
                });
              }
            }
          }

          console.log('User data loaded from Supabase');
        }
        dataLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading user data:', error);
        dataLoadedRef.current = true;
      }
    };

    loadData();
  }, [user]);

  // Auto-sync to Supabase when store data changes
  useEffect(() => {
    if (!user) return;

    const handleSync = () => {
      debouncedSync(user.uid, () => ({
        workoutData: {
          exercises: useWorkoutStore.getState().exercises,
          customExercises: useWorkoutStore.getState().customExercises,
          trainingDays: useWorkoutStore.getState().trainingDays,
          trainingPlans: useWorkoutStore.getState().trainingPlans,
          workoutSessions: useWorkoutStore.getState().workoutSessions,
          workoutSettings: useWorkoutStore.getState().workoutSettings,
        },
        nutritionData: {
          foodItems: useNutritionStore.getState().foodItems,
          meals: useNutritionStore.getState().meals,
          savedMeals: useNutritionStore.getState().savedMeals,
          nutritionGoals: useNutritionStore.getState().nutritionGoals,
          dailyTracking: useNutritionStore.getState().dailyTracking,
          supplements: useNutritionStore.getState().supplements,
          trackedMeals: useNutritionStore.getState().trackedMeals,
          mealTemplates: useNutritionStore.getState().mealTemplates,
          customFoods: useNutritionStore.getState().customFoods,
          supplementPresets: useNutritionStore.getState().supplementPresets,
          sleepEntries: useNutritionStore.getState().sleepEntries,
          trackingSettings: useNutritionStore.getState().trackingSettings,
        },
        bodyWeightData: {
          entries: useBodyWeightStore.getState().entries,
          goal: useBodyWeightStore.getState().goal,
        },
        settingsData: {
          profileName: useAppSettingsStore.getState().profileName,
          profileBio: useAppSettingsStore.getState().profileBio,
          notifications: useAppSettingsStore.getState().notifications,
          preferences: useAppSettingsStore.getState().preferences,
        },
      }));
    };

    // Subscribe to store changes
    const unsubWorkout = useWorkoutStore.subscribe(handleSync);
    const unsubNutrition = useNutritionStore.subscribe(handleSync);
    const unsubBodyWeight = useBodyWeightStore.subscribe(handleSync);
    const unsubAppSettings = useAppSettingsStore.subscribe(handleSync);

    return () => {
      unsubWorkout();
      unsubNutrition();
      unsubBodyWeight();
      unsubAppSettings();
      cancelPendingSync();
    };
  }, [user]);

  // Reset data loaded ref when user logs out
  useEffect(() => {
    if (!user) {
      dataLoadedRef.current = false;
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/auth/callback') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // Show loading state
  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(225,12%,13%)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-[hsl(var(--fg-secondary))]">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
