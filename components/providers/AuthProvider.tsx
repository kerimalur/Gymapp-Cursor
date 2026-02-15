'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import toast from 'react-hot-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, initializeAuth, syncData } = useAuthStore();
  const workoutStore = useWorkoutStore();
  const nutritionStore = useNutritionStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  // Handle data loading from Firebase
  const handleDataLoaded = useCallback((data: any) => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    console.log('Firebase data loaded:', data);
    
    const { workoutData, nutritionData } = data;
    
    // Load workout data - Firebase is the source of truth when user is logged in
    // If Firebase has data, use it completely (this ensures deleted items stay deleted)
    if (workoutData) {
      console.log('Loading workout data from Firebase:', workoutData);
      
      // Training days - Firebase is source of truth
      if (workoutData.trainingDays !== undefined) {
        workoutStore.setTrainingDays(workoutData.trainingDays || []);
        console.log('Set training days from Firebase:', workoutData.trainingDays?.length || 0);
      }
      
      // Training plans - Firebase is source of truth
      if (workoutData.trainingPlans !== undefined) {
        workoutStore.setTrainingPlans(workoutData.trainingPlans || []);
        console.log('Set training plans from Firebase:', workoutData.trainingPlans?.length || 0);
      }
      
      // Workout sessions - Firebase is source of truth
      if (workoutData.workoutSessions !== undefined) {
        workoutStore.setWorkoutSessions(workoutData.workoutSessions || []);
        console.log('Set workout sessions from Firebase:', workoutData.workoutSessions?.length || 0);
      }
      
      // Custom exercises - Firebase is source of truth
      if (workoutData.customExercises !== undefined) {
        workoutStore.setCustomExercises(workoutData.customExercises || []);
        console.log('Set custom exercises from Firebase:', workoutData.customExercises?.length || 0);
      }
    }
    
    // Load nutrition data
    if (nutritionData) {
      if (nutritionData.nutritionGoals) {
        nutritionStore.setNutritionGoals(nutritionData.nutritionGoals);
      }
      if (nutritionData.meals?.length > 0) {
        nutritionStore.setMeals(nutritionData.meals);
      }
      if (nutritionData.supplements?.length > 0) {
        nutritionStore.setSupplements(nutritionData.supplements);
      }
      if (nutritionData.mealTemplates?.length > 0) {
        nutritionData.mealTemplates.forEach((template: any) => {
          nutritionStore.addMealTemplate(template);
        });
      }
      if (nutritionData.customFoods?.length > 0) {
        nutritionData.customFoods.forEach((food: any) => {
          nutritionStore.addCustomFood(food);
        });
      }
      if (nutritionData.sleepEntries?.length > 0) {
        nutritionData.sleepEntries.forEach((entry: any) => {
          nutritionStore.addSleepEntry(entry);
        });
      }
      if (nutritionData.trackingSettings?.enabledMuscles) {
        nutritionStore.setEnabledMuscles(nutritionData.trackingSettings.enabledMuscles);
      }
      if (nutritionData.trackedMeals?.length > 0) {
        nutritionStore.setTrackedMeals(nutritionData.trackedMeals);
        console.log('Loaded tracked meals:', nutritionData.trackedMeals.length);
      }
    }
    
    toast.success('Daten geladen', { duration: 2000 });
  }, [workoutStore, nutritionStore]);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initializeAuth(handleDataLoaded);
    return () => unsubscribe();
  }, [initializeAuth, handleDataLoaded]);

  // Auto-sync data when stores change (debounced)
  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    
    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Debounce sync to avoid too many writes
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncData(
          {
            trainingDays: workoutStore.trainingDays,
            trainingPlans: workoutStore.trainingPlans,
            workoutSessions: workoutStore.workoutSessions,
            customExercises: workoutStore.customExercises,
          },
          {
            nutritionGoals: nutritionStore.nutritionGoals,
            meals: nutritionStore.meals,
            supplements: nutritionStore.supplements,
            mealTemplates: nutritionStore.mealTemplates,
            customFoods: nutritionStore.customFoods,
            supplementPresets: nutritionStore.supplementPresets,
            sleepEntries: nutritionStore.sleepEntries,
            trackingSettings: nutritionStore.trackingSettings,
            trackedMeals: nutritionStore.trackedMeals,
          }
        );
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, 3000); // 3 second debounce
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [
    user,
    syncData,
    workoutStore.trainingDays,
    workoutStore.trainingPlans,
    workoutStore.workoutSessions,
    workoutStore.customExercises,
    nutritionStore.nutritionGoals,
    nutritionStore.meals,
    nutritionStore.supplements,
    nutritionStore.mealTemplates,
    nutritionStore.customFoods,
    nutritionStore.supplementPresets,
    nutritionStore.sleepEntries,
    nutritionStore.trackingSettings,
    nutritionStore.trackedMeals,
  ]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // Show loading state
  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
