import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  getDocs,
  deleteDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User, TrainingDay, TrainingPlan, WorkoutSession, Exercise } from '@/types';

// Helper function to safely convert Firestore Timestamp or string to Date
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value === 'object' && value.seconds) {
    // Firestore Timestamp as plain object
    return new Date(value.seconds * 1000);
  }
  return new Date();
}
import { MealTemplate, CustomFood, SupplementPreset, SleepEntry, TrackingSettings } from '@/store/useNutritionStore';
import { queueOperation } from './offlineQueue';

// Helper function to remove undefined values from objects (Firebase doesn't accept undefined)
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// ============ USER DATA ============

export async function saveUserData(userId: string, userData: Partial<User>) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    updatedAt: new Date(),
  }, { merge: true });
}

export async function getUserData(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as User;
  }
  return null;
}

// ============ CUSTOM EXERCISES ============

export async function saveCustomExercises(userId: string, exercises: Exercise[]) {
  // Get existing custom exercises to find items to delete
  const existingExercisesSnap = await getDocs(collection(db, 'users', userId, 'customExercises'));

  // Create set of current IDs
  const currentExerciseIds = new Set(exercises.map(e => e.id));

  // Collect all batch operations
  const operations: Array<{ type: 'delete' | 'set', ref: any, data?: any }> = [];

  // Delete exercises that no longer exist locally
  for (const docSnap of existingExercisesSnap.docs) {
    if (!currentExerciseIds.has(docSnap.id)) {
      operations.push({ type: 'delete', ref: docSnap.ref });
      console.log('Deleting custom exercise from Firebase:', docSnap.id);
    }
  }

  // Save custom exercises
  for (const exercise of exercises) {
    const exerciseRef = doc(db, 'users', userId, 'customExercises', exercise.id);
    operations.push({
      type: 'set',
      ref: exerciseRef,
      data: removeUndefined({
        ...exercise,
        createdAt: exercise.createdAt || new Date(),
        updatedAt: new Date(),
      })
    });
  }

  // Execute operations in chunks of 450
  const BATCH_LIMIT = 450;
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + BATCH_LIMIT);

    for (const operation of chunk) {
      if (operation.type === 'delete') {
        batch.delete(operation.ref);
      } else {
        batch.set(operation.ref, operation.data);
      }
    }

    await batch.commit();
  }
}

export async function getCustomExercises(userId: string): Promise<Exercise[]> {
  const customExercisesSnap = await getDocs(collection(db, 'users', userId, 'customExercises'));
  
  return customExercisesSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Exercise;
  });
}

// ============ WORKOUT DATA ============

export async function saveWorkoutData(userId: string, data: {
  trainingDays?: TrainingDay[];
  trainingPlans?: TrainingPlan[];
  workoutSessions?: WorkoutSession[];
}) {
  // Get existing data from Firebase to find items to delete
  const [existingDaysSnap, existingPlansSnap, existingSessionsSnap] = await Promise.all([
    getDocs(collection(db, 'users', userId, 'trainingDays')),
    getDocs(collection(db, 'users', userId, 'trainingPlans')),
    getDocs(collection(db, 'users', userId, 'workoutSessions')),
  ]);

  // Create sets of current IDs for quick lookup
  const currentDayIds = new Set(data.trainingDays?.map(d => d.id) || []);
  const currentPlanIds = new Set(data.trainingPlans?.map(p => p.id) || []);
  const currentSessionIds = new Set(data.workoutSessions?.map(s => s.id) || []);

  // Collect all batch operations
  const operations: Array<{ type: 'delete' | 'set', ref: any, data?: any }> = [];

  // Delete training days that no longer exist locally
  for (const docSnap of existingDaysSnap.docs) {
    if (!currentDayIds.has(docSnap.id)) {
      operations.push({ type: 'delete', ref: docSnap.ref });
      console.log('Deleting training day from Firebase:', docSnap.id);
    }
  }

  // Delete training plans that no longer exist locally
  for (const docSnap of existingPlansSnap.docs) {
    if (!currentPlanIds.has(docSnap.id)) {
      operations.push({ type: 'delete', ref: docSnap.ref });
      console.log('Deleting training plan from Firebase:', docSnap.id);
    }
  }

  // Delete workout sessions that no longer exist locally
  for (const docSnap of existingSessionsSnap.docs) {
    if (!currentSessionIds.has(docSnap.id)) {
      operations.push({ type: 'delete', ref: docSnap.ref });
      console.log('Deleting workout session from Firebase:', docSnap.id);
    }
  }

  // Save training days
  if (data.trainingDays) {
    for (const day of data.trainingDays) {
      const dayRef = doc(db, 'users', userId, 'trainingDays', day.id);
      operations.push({
        type: 'set',
        ref: dayRef,
        data: removeUndefined({
          ...day,
          createdAt: day.createdAt || new Date(),
          updatedAt: new Date(),
        })
      });
    }
  }

  // Save training plans
  if (data.trainingPlans) {
    for (const plan of data.trainingPlans) {
      const planRef = doc(db, 'users', userId, 'trainingPlans', plan.id);
      operations.push({
        type: 'set',
        ref: planRef,
        data: removeUndefined({
          ...plan,
          createdAt: plan.createdAt || new Date(),
          updatedAt: new Date(),
        })
      });
    }
  }

  // Save workout sessions
  if (data.workoutSessions) {
    for (const session of data.workoutSessions) {
      const sessionRef = doc(db, 'users', userId, 'workoutSessions', session.id);
      operations.push({
        type: 'set',
        ref: sessionRef,
        data: removeUndefined({
          ...session,
          startTime: session.startTime || new Date(),
          endTime: session.endTime || null,
        })
      });
    }
  }

  // Execute operations in chunks of 450 to avoid Firestore 500 operation limit
  const BATCH_LIMIT = 450;
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + BATCH_LIMIT);

    for (const operation of chunk) {
      if (operation.type === 'delete') {
        batch.delete(operation.ref);
      } else {
        batch.set(operation.ref, operation.data);
      }
    }

    await batch.commit();
    console.log(`Committed batch ${Math.floor(i / BATCH_LIMIT) + 1}/${Math.ceil(operations.length / BATCH_LIMIT)} (${chunk.length} operations)`);
  }
}

export async function getWorkoutData(userId: string) {
  const [trainingDaysSnap, trainingPlansSnap, workoutSessionsSnap] = await Promise.all([
    getDocs(collection(db, 'users', userId, 'trainingDays')),
    getDocs(collection(db, 'users', userId, 'trainingPlans')),
    getDocs(collection(db, 'users', userId, 'workoutSessions')),
  ]);
  
  const trainingDays: TrainingDay[] = trainingDaysSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as TrainingDay;
  });
  
  const trainingPlans: TrainingPlan[] = trainingPlansSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
    } as TrainingPlan;
  });
  
  const workoutSessions: WorkoutSession[] = workoutSessionsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      startTime: toDate(data.startTime),
      endTime: data.endTime ? toDate(data.endTime) : undefined,
    } as WorkoutSession;
  });
  
  return { trainingDays, trainingPlans, workoutSessions };
}

// ============ NUTRITION DATA ============

export async function saveNutritionData(userId: string, data: {
  nutritionGoals?: any;
  meals?: any[];
  supplements?: any[];
  mealTemplates?: MealTemplate[];
  customFoods?: CustomFood[];
  supplementPresets?: SupplementPreset[];
  sleepEntries?: SleepEntry[];
  trackingSettings?: TrackingSettings;
  trackedMeals?: any[];
}) {
  const userNutritionRef = doc(db, 'users', userId, 'nutrition', 'settings');
  
  await setDoc(userNutritionRef, {
    nutritionGoals: data.nutritionGoals || null,
    mealTemplates: data.mealTemplates || [],
    customFoods: data.customFoods || [],
    supplementPresets: data.supplementPresets || [],
    trackingSettings: data.trackingSettings || null,
    updatedAt: new Date(),
  }, { merge: true });
  
  // Save meals separately (they can be many) - use chunking
  if (data.meals && data.meals.length > 0) {
    const BATCH_LIMIT = 450;
    for (let i = 0; i < data.meals.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = data.meals.slice(i, i + BATCH_LIMIT);

      for (const meal of chunk) {
        const mealRef = doc(db, 'users', userId, 'meals', meal.id);
        batch.set(mealRef, meal);
      }

      await batch.commit();
      console.log(`Committed meals batch ${Math.floor(i / BATCH_LIMIT) + 1}/${Math.ceil(data.meals.length / BATCH_LIMIT)}`);
    }
  }

  // Save supplements separately - use chunking
  if (data.supplements && data.supplements.length > 0) {
    const BATCH_LIMIT = 450;
    for (let i = 0; i < data.supplements.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = data.supplements.slice(i, i + BATCH_LIMIT);

      for (const supplement of chunk) {
        const supRef = doc(db, 'users', userId, 'supplements', supplement.id);
        batch.set(supRef, supplement);
      }

      await batch.commit();
    }
  }

  // Save sleep entries separately - use chunking
  if (data.sleepEntries && data.sleepEntries.length > 0) {
    const BATCH_LIMIT = 450;
    for (let i = 0; i < data.sleepEntries.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = data.sleepEntries.slice(i, i + BATCH_LIMIT);

      for (const entry of chunk) {
        const entryRef = doc(db, 'users', userId, 'sleepEntries', entry.id);
        batch.set(entryRef, entry);
      }

      await batch.commit();
    }
  }

  // Save tracked meals separately - use chunking
  if (data.trackedMeals && data.trackedMeals.length > 0) {
    const BATCH_LIMIT = 450;
    for (let i = 0; i < data.trackedMeals.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = data.trackedMeals.slice(i, i + BATCH_LIMIT);

      for (const meal of chunk) {
        const mealRef = doc(db, 'users', userId, 'trackedMeals', meal.id);
        batch.set(mealRef, {
          ...meal,
          createdAt: meal.createdAt || new Date(),
        });
      }

      await batch.commit();
      console.log(`Committed trackedMeals batch ${Math.floor(i / BATCH_LIMIT) + 1}/${Math.ceil(data.trackedMeals.length / BATCH_LIMIT)}`);
    }
  }
}

export async function getNutritionData(userId: string) {
  const [settingsSnap, mealsSnap, supplementsSnap, sleepSnap, trackedMealsSnap] = await Promise.all([
    getDoc(doc(db, 'users', userId, 'nutrition', 'settings')),
    getDocs(collection(db, 'users', userId, 'meals')),
    getDocs(collection(db, 'users', userId, 'supplements')),
    getDocs(collection(db, 'users', userId, 'sleepEntries')),
    getDocs(collection(db, 'users', userId, 'trackedMeals')),
  ]);
  
  const settings = settingsSnap.exists() ? settingsSnap.data() : {};
  
  const meals = mealsSnap.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  }));
  
  const supplements = supplementsSnap.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  }));
  
  const sleepEntries = sleepSnap.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as SleepEntry[];
  
  const trackedMeals = trackedMealsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
    };
  });
  
  return {
    nutritionGoals: settings.nutritionGoals || null,
    mealTemplates: settings.mealTemplates || [],
    customFoods: settings.customFoods || [],
    supplementPresets: settings.supplementPresets || [],
    trackingSettings: settings.trackingSettings || null,
    meals,
    supplements,
    sleepEntries,
    trackedMeals,
  };
}

// ============ SYNC HELPERS ============

export async function syncAllDataToFirebase(userId: string, workoutStore: any, nutritionStore: any) {
  const workoutData = {
    trainingDays: workoutStore.trainingDays,
    trainingPlans: workoutStore.trainingPlans,
    workoutSessions: workoutStore.workoutSessions,
  };

  const nutritionData = {
    nutritionGoals: nutritionStore.nutritionGoals,
    meals: nutritionStore.meals,
    supplements: nutritionStore.supplements,
    mealTemplates: nutritionStore.mealTemplates,
    customFoods: nutritionStore.customFoods,
    supplementPresets: nutritionStore.supplementPresets,
    sleepEntries: nutritionStore.sleepEntries,
    trackingSettings: nutritionStore.trackingSettings,
    trackedMeals: nutritionStore.trackedMeals,
  };

  const customExercisesData = workoutStore.customExercises || [];

  try {
    await Promise.all([
      saveWorkoutData(userId, workoutData),
      saveCustomExercises(userId, customExercisesData),
      saveNutritionData(userId, nutritionData),
    ]);
  } catch (error) {
    // If sync fails, queue operations for later retry
    console.error('[Firebase Sync] Sync failed, adding to offline queue:', error);
    queueOperation('workout', { userId, data: workoutData });
    queueOperation('custom-exercises', { userId, data: customExercisesData });
    queueOperation('nutrition', { userId, data: nutritionData });
    throw error; // Re-throw to notify caller
  }
}

export async function loadAllDataFromFirebase(userId: string) {
  const [workoutData, nutritionData, customExercises] = await Promise.all([
    getWorkoutData(userId),
    getNutritionData(userId),
    getCustomExercises(userId),
  ]);
  
  return { 
    workoutData: { ...workoutData, customExercises }, 
    nutritionData 
  };
}

// Delete a specific document
export async function deleteDocument(userId: string, collection: string, docId: string) {
  await deleteDoc(doc(db, 'users', userId, collection, docId));
}

// ============ OFFLINE QUEUE PROCESSING ============

/**
 * Process the offline queue - retry all pending operations
 * Should be called when connection is restored or on app startup
 */
export async function processOfflineQueue(userId: string) {
  const { processQueue } = await import('./offlineQueue');

  return await processQueue(userId, {
    syncWorkout: async (payload: { userId: string; data: any }) => {
      await saveWorkoutData(payload.userId, payload.data);
    },
    syncNutrition: async (payload: { userId: string; data: any }) => {
      await saveNutritionData(payload.userId, payload.data);
    },
    syncCustomExercises: async (payload: { userId: string; data: any }) => {
      await saveCustomExercises(payload.userId, payload.data);
    },
  });
}
