import { supabase, isSupabaseReady } from './supabase';

// Debounce timer for auto-sync
let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 2000; // 2 seconds after last change

/**
 * Load all user data from Supabase
 * Returns the stored JSONB data for each store
 */
export async function loadUserData(userId: string): Promise<{
  workout_data: any;
  nutrition_data: any;
  body_weight_data: any;
  settings: any;
} | null> {
  if (!isSupabaseReady) {
    console.warn('Supabase not ready, skipping data load');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = no rows found = new user
      if (error.code === 'PGRST116') {
        console.log('No existing data found, creating new user data record');
        // Create a new record for this user
        const { error: insertError } = await supabase
          .from('user_data')
          .insert({ user_id: userId });
        
        if (insertError) {
          console.error('Error creating user data record:', insertError);
        }
        return null;
      }
      console.error('Error loading user data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
}

/**
 * Save workout data to Supabase
 */
export async function saveWorkoutData(userId: string, workoutData: any): Promise<boolean> {
  if (!isSupabaseReady) return false;

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        workout_data: workoutData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving workout data:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving workout data:', error);
    return false;
  }
}

/**
 * Save nutrition data to Supabase
 */
export async function saveNutritionData(userId: string, nutritionData: any): Promise<boolean> {
  if (!isSupabaseReady) return false;

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        nutrition_data: nutritionData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving nutrition data:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving nutrition data:', error);
    return false;
  }
}

/**
 * Save body weight data to Supabase
 */
export async function saveBodyWeightData(userId: string, bodyWeightData: any): Promise<boolean> {
  if (!isSupabaseReady) return false;

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        body_weight_data: bodyWeightData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving body weight data:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving body weight data:', error);
    return false;
  }
}

/**
 * Save all store data to Supabase at once
 */
export async function saveAllData(
  userId: string,
  workoutData: any,
  nutritionData: any,
  bodyWeightData: any
): Promise<boolean> {
  if (!isSupabaseReady) return false;

  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        workout_data: workoutData,
        nutrition_data: nutritionData,
        body_weight_data: bodyWeightData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving all data:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving all data:', error);
    return false;
  }
}

/**
 * Debounced sync - call this whenever store data changes
 * Waits for 2 seconds of inactivity before syncing
 */
export function debouncedSync(
  userId: string,
  getStoreData: () => {
    workoutData: any;
    nutritionData: any;
    bodyWeightData: any;
  }
) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    const { workoutData, nutritionData, bodyWeightData } = getStoreData();
    const success = await saveAllData(userId, workoutData, nutritionData, bodyWeightData);
    if (success) {
      console.log('Auto-sync to Supabase completed');
    }
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Cancel any pending sync
 */
export function cancelPendingSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}
