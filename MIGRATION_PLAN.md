# Firebase to Supabase Migration Plan - Gym App

**Status**: Complete Analysis & Plan
**Date**: February 15, 2026
**Target**: Full migration to Supabase PostgreSQL with Auth

---

## Executive Summary

This document outlines the complete migration from Firebase (Firestore + Auth) to Supabase (PostgreSQL + Auth) for the Gym App. The migration involves:
- Firebase Auth → Supabase Auth (Google OAuth)
- Firestore → Supabase PostgreSQL (with RLS policies)
- Real-time Firestore operations → Supabase real-time subscriptions
- Data transformation and schema mapping

---

## Current Firebase Architecture

### Dependencies
```
firebase: ^12.7.0
```

### Files Using Firebase
1. **lib/firebase.ts** - Firebase initialization
2. **lib/firestore.ts** - All Firestore read/write operations (519 lines)
3. **lib/offlineQueue.ts** - Offline sync queue
4. **store/useAuthStore.ts** - Firebase Auth integration
5. **components/providers/AuthProvider.tsx** - Auth state management
6. **app/settings/page.tsx** - Data sync operations

### Current Data Structure
```
Firestore Collections:
├── users/{uid}/
│   ├── users/{uid} - User document
│   ├── customExercises/{exerciseId} - User exercises
│   ├── trainingDays/{dayId} - Training days
│   ├── trainingPlans/{planId} - Training plans
│   ├── workoutSessions/{sessionId} - Workout history
│   ├── meals/{mealId} - Meal logs
│   ├── supplements/{supId} - Supplements
│   ├── sleepEntries/{sleepId} - Sleep tracking
│   └── trackedMeals/{mealId} - Daily meal tracking
```

---

## Target Supabase Architecture

### Database Tables (Already Defined in lib/supabase.sql)
```
PostgreSQL Tables:
├── auth.users - Supabase Auth (managed)
├── exercises - Standard exercises (public)
├── custom_exercises - User-defined exercises
├── training_days - Training days
├── training_day_exercises - Junction table
├── training_plans - Training plans
├── training_plan_days - Junction table
├── workout_sessions - Workout history
├── workout_exercises - Exercises in workouts
├── exercise_sets - Individual sets
├── meals - Meal logs
├── meal_items - Items in meals
├── body_weight_records - Weight tracking
└── scheduled_workouts - Scheduled training days
```

### Row Level Security (RLS) Policies
All user tables have RLS enabled with policies ensuring users can only access their own data.

---

## Migration Changes Required

### 1. **package.json** - Update Dependencies

**Remove:**
```
"firebase": "^12.7.0"
```

**Add:**
```
"@supabase/supabase-js": "^2.38.0"
```

---

### 2. **lib/firebase.ts** - REMOVE (Replace with Supabase)

**Current:** Firebase app initialization with Google Auth provider
**Action:** DELETE this file - functionality moved to lib/supabase.ts

---

### 3. **lib/supabase.ts** - ENHANCE (Already created, needs expansion)

**Current State:** Basic initialization
**Required Changes:**

```typescript
// Add Auth helper functions
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return error;
}

// User profile management
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function upsertUserProfile(userId: string, profile: any) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, ...profile })
    .select()
    .single();
  return { data, error };
}

// Auth state listener
export function onAuthStateChange(callback: (user: any) => void) {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return subscription;
}
```

---

### 4. **lib/firestore.ts** - REPLACE with lib/supabase.ts data functions

**Current:** 519 lines of Firestore operations
**Action:** Create new database operations file (lib/database.ts)

**Key Functions to Implement:**

#### Custom Exercises
```typescript
export async function saveCustomExercises(userId: string, exercises: Exercise[]) {
  const { error } = await supabase
    .from('custom_exercises')
    .upsert(exercises.map(e => ({
      id: e.id,
      user_id: userId,
      name: e.name,
      category: e.category,
      description: e.description,
      primary_muscles: e.primaryMuscles || [],
      secondary_muscles: e.secondaryMuscles || [],
      updated_at: new Date().toISOString(),
    })), {
      onConflict: 'id,user_id'
    });
  return error;
}

export async function getCustomExercises(userId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', userId);
  
  return data?.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    description: d.description,
    primaryMuscles: d.primary_muscles,
    secondaryMuscles: d.secondary_muscles,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  })) || [];
}

export async function deleteCustomExercise(userId: string, exerciseId: string) {
  const { error } = await supabase
    .from('custom_exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('user_id', userId);
  return error;
}
```

#### Training Days & Plans
```typescript
export async function saveWorkoutData(userId: string, data: {
  trainingDays?: TrainingDay[];
  trainingPlans?: TrainingPlan[];
  workoutSessions?: WorkoutSession[];
}) {
  const errors = [];

  if (data.trainingDays) {
    const { error } = await supabase
      .from('training_days')
      .upsert(data.trainingDays.map(d => ({
        id: d.id,
        user_id: userId,
        name: d.name,
        updated_at: new Date().toISOString(),
      })), { onConflict: 'id' });
    if (error) errors.push(error);
  }

  if (data.trainingPlans) {
    const { error } = await supabase
      .from('training_plans')
      .upsert(data.trainingPlans.map(p => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        sessions_per_week: p.sessionsPerWeek,
        is_active: p.isActive,
        current_day_index: p.currentDayIndex || 0,
        updated_at: new Date().toISOString(),
      })), { onConflict: 'id' });
    if (error) errors.push(error);
  }

  if (data.workoutSessions) {
    const { error } = await supabase
      .from('workout_sessions')
      .upsert(data.workoutSessions.map(s => ({
        id: s.id,
        user_id: userId,
        training_day_name: s.trainingDayName,
        start_time: new Date(s.startTime).toISOString(),
        end_time: s.endTime ? new Date(s.endTime).toISOString() : null,
        duration_minutes: s.durationMinutes,
        notes: s.notes,
        updated_at: new Date().toISOString(),
      })), { onConflict: 'id' });
    if (error) errors.push(error);
  }

  return errors.length > 0 ? errors[0] : null;
}

export async function getWorkoutData(userId: string) {
  const [trainingDaysRes, trainingPlansRes, workoutSessionsRes] = await Promise.all([
    supabase.from('training_days').select('*').eq('user_id', userId),
    supabase.from('training_plans').select('*').eq('user_id', userId),
    supabase.from('workout_sessions').select('*').eq('user_id', userId),
  ]);

  return {
    trainingDays: trainingDaysRes.data?.map(d => ({
      id: d.id,
      name: d.name,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    })) || [],
    trainingPlans: trainingPlansRes.data?.map(p => ({
      id: p.id,
      name: p.name,
      sessionsPerWeek: p.sessions_per_week,
      isActive: p.is_active,
      currentDayIndex: p.current_day_index,
      createdAt: new Date(p.created_at),
    })) || [],
    workoutSessions: workoutSessionsRes.data?.map(s => ({
      id: s.id,
      trainingDayName: s.training_day_name,
      startTime: new Date(s.start_time),
      endTime: s.end_time ? new Date(s.end_time) : undefined,
      durationMinutes: s.duration_minutes,
      notes: s.notes,
    })) || [],
  };
}
```

#### Nutrition Data
```typescript
export async function saveNutritionData(userId: string, data: {
  nutritionGoals?: any;
  meals?: any[];
  supplements?: any[];
  sleepEntries?: any[];
  trackedMeals?: any[];
}) {
  const errors = [];

  if (data.meals) {
    const { error } = await supabase
      .from('meals')
      .upsert(data.meals.map(m => ({
        id: m.id,
        user_id: userId,
        meal_date: m.date,
        meal_type: m.mealTime,
        total_calories: m.calories,
        total_protein: m.protein,
        total_carbs: m.carbs,
        total_fats: m.fats,
        notes: m.notes,
      })), { onConflict: 'id' });
    if (error) errors.push(error);
  }

  if (data.sleepEntries) {
    const { error } = await supabase
      .from('sleep_entries')
      .upsert(data.sleepEntries.map(s => ({
        id: s.id,
        user_id: userId,
        date: s.date,
        hours_slept: s.hoursSlept,
        quality: s.quality,
        notes: s.notes,
      })), { onConflict: 'id' });
    if (error) errors.push(error);
  }

  return errors.length > 0 ? errors[0] : null;
}

export async function getNutritionData(userId: string) {
  const [mealsRes, sleepRes, trackedMealsRes] = await Promise.all([
    supabase.from('meals').select('*').eq('user_id', userId),
    supabase.from('sleep_entries').select('*').eq('user_id', userId),
    supabase.from('tracked_meals').select('*').eq('user_id', userId),
  ]);

  return {
    meals: mealsRes.data || [],
    sleepEntries: sleepRes.data || [],
    trackedMeals: trackedMealsRes.data || [],
  };
}
```

#### Sync & Load All Data
```typescript
export async function syncAllDataToSupabase(userId: string, workoutStore: any, nutritionStore: any) {
  const errors = [];

  try {
    const workoutError = await saveWorkoutData(userId, {
      trainingDays: workoutStore.trainingDays,
      trainingPlans: workoutStore.trainingPlans,
      workoutSessions: workoutStore.workoutSessions,
    });
    if (workoutError) errors.push(workoutError);

    const customExercisesError = await saveCustomExercises(userId, workoutStore.customExercises);
    if (customExercisesError) errors.push(customExercisesError);

    const nutritionError = await saveNutritionData(userId, {
      meals: nutritionStore.meals,
      sleepEntries: nutritionStore.sleepEntries,
      trackedMeals: nutritionStore.trackedMeals,
    });
    if (nutritionError) errors.push(nutritionError);
  } catch (error) {
    console.error('[Supabase Sync] Error:', error);
    throw error;
  }

  if (errors.length > 0) {
    throw new Error(`Sync failed: ${errors.map(e => e.message).join(', ')}`);
  }
}

export async function loadAllDataFromSupabase(userId: string) {
  const [workoutData, customExercises, nutritionData] = await Promise.all([
    getWorkoutData(userId),
    getCustomExercises(userId),
    getNutritionData(userId),
  ]);

  return {
    workoutData: { ...workoutData, customExercises },
    nutritionData,
  };
}
```

---

### 5. **store/useAuthStore.ts** - Update to use Supabase Auth

**Changes:**
- Replace Firebase `signInWithPopup` with Supabase `signInWithOAuth`
- Replace Firebase `onAuthStateChanged` with Supabase `onAuthStateChange`
- Update user data loading to use Supabase database
- Replace `loadAllDataFromFirebase` with `loadAllDataFromSupabase`

```typescript
import { create } from 'zustand';
import { User } from '@/types';
import { supabase, signOut as supabaseSignOut, onAuthStateChange } from '@/lib/supabase';
import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';

interface AuthState {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: (onDataLoaded?: (data: any) => void) => () => void;
  syncData: (workoutStore: any, nutritionStore: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  syncing: false,

  setUser: (user) => {
    set({ user, loading: false });
  },

  setLoading: (loading) => set({ loading }),

  setSyncing: (syncing) => set({ syncing }),

  signInWithGoogle: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await supabaseSignOut();
      set({ user: null });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('workout-storage');
        localStorage.removeItem('nutrition-storage');
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  initializeAuth: (onDataLoaded) => {
    const subscription = onAuthStateChange(async (supabaseUser) => {
      if (supabaseUser) {
        const userData: User = {
          uid: supabaseUser.id,
          email: supabaseUser.email || '',
          displayName: supabaseUser.user_metadata?.full_name || 'User',
          photoURL: supabaseUser.user_metadata?.avatar_url,
          hasCompletedOnboarding: false,
          createdAt: new Date(supabaseUser.created_at),
        };

        set({ user: userData, loading: false });

        if (onDataLoaded) {
          try {
            const data = await loadAllDataFromSupabase(supabaseUser.id);
            onDataLoaded(data);
          } catch (error) {
            console.error('Error loading data from Supabase:', error);
          }
        }
      } else {
        set({ user: null, loading: false });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  },

  syncData: async (workoutStore, nutritionStore) => {
    const { user } = get();
    if (!user) return;

    try {
      set({ syncing: true });
      await syncAllDataToSupabase(user.uid, workoutStore, nutritionStore);
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    } finally {
      set({ syncing: false });
    }
  },
}));
```

---

### 6. **lib/offlineQueue.ts** - Update for Supabase

**Changes:**
- Keep the queuing mechanism (it's database-agnostic)
- Update sync function signatures to use Supabase methods
- Replace Firebase batch operations with Supabase upsert

```typescript
export async function processQueue(
  userId: string,
  syncFunctions: {
    syncWorkout: (data: any) => Promise<void>;
    syncNutrition: (data: any) => Promise<void>;
    syncCustomExercises: (data: any) => Promise<void>;
  }
): Promise<{ success: number; failed: number; skipped: number }> {
  // Keep existing logic, only function implementations change
  // The queueing mechanism remains identical
}
```

---

### 7. **components/providers/AuthProvider.tsx** - Update imports and functions

**Changes:**
- Replace `loadAllDataFromFirebase` with `loadAllDataFromSupabase`
- Update comments (Firebase → Supabase)
- Functionality remains the same

```typescript
import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';

// ... rest of the code remains the same
// just update the import paths and function names
```

---

### 8. **app/settings/page.tsx** - Update imports

**Changes:**
- Replace: `import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';`
- With: `import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';`
- Update function calls accordingly

```typescript
const data = await loadAllDataFromSupabase(user.uid);
```

---

## Step-by-Step Implementation Plan

### Phase 1: Preparation
1. ✅ Analyze current Firebase setup
2. ✅ Review Supabase schema (lib/supabase.sql)
3. ⏳ Update package.json
4. ⏳ Set up Supabase project with environment variables

### Phase 2: Core Backend Migration
1. ⏳ Enhance lib/supabase.ts with auth functions
2. ⏳ Create lib/database.ts with all data operations
3. ⏳ Update lib/offlineQueue.ts for Supabase
4. ⏳ Update store/useAuthStore.ts

### Phase 3: Frontend Integration
1. ⏳ Update components/providers/AuthProvider.tsx
2. ⏳ Update app/settings/page.tsx
3. ⏳ Update other components importing Firebase

### Phase 4: Testing & Cleanup
1. ⏳ Test all authentication flows
2. ⏳ Test data syncing
3. ⏳ Test offline queue
4. ⏳ Delete lib/firebase.ts
5. ⏳ Delete old firestore.ts references

---

## Environment Variables Required

```env
# Existing Firebase (to remove)
# NEXT_PUBLIC_FIREBASE_API_KEY
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# NEXT_PUBLIC_FIREBASE_PROJECT_ID
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# NEXT_PUBLIC_FIREBASE_APP_ID

# New Supabase (to add)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Data Migration Considerations

### UUID vs Auto-ID
- Current: Firebase generates Firestore document IDs
- Target: Supabase uses UUID (already defined in schema)
- Action: Preserve existing IDs by mapping them to UUIDs, OR regenerate with Supabase UUIDs

### Timestamp Handling
- Current: Firebase Timestamp objects (seconds + nanoseconds)
- Target: Supabase TIMESTAMP WITH TIME ZONE
- Action: Convert using `.toISOString()`

### Nested Collections
- Current: Firestore subcollections (users/{uid}/customExercises/{id})
- Target: Supabase flat structure with foreign keys
- Action: Add user_id to all tables, use JOIN queries

### Real-Time Subscriptions
- Current: Firestore `.onSnapshot()` listeners
- Target: Supabase `.on('postgres_changes')` subscriptions
- Action: Update components using real-time features

---

## Key API Changes

### Authentication
```typescript
// Firebase
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Supabase
const { data, error } = await supabase.auth.signInWithOAuth({...});
const { error } = await supabase.auth.signOut();
const subscription = supabase.auth.onAuthStateChange((event, session) => {...});
```

### Database Operations
```typescript
// Firebase
const userRef = doc(db, 'users', userId, 'customExercises', exerciseId);
await setDoc(userRef, data);

// Supabase
const { error } = await supabase
  .from('custom_exercises')
  .upsert({ id: exerciseId, user_id: userId, ...data });
```

### Data Querying
```typescript
// Firebase
const snapshot = await getDocs(collection(db, 'users', userId, 'meals'));

// Supabase
const { data, error } = await supabase
  .from('meals')
  .select('*')
  .eq('user_id', userId);
```

---

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Data loss during migration | High | Backup Firebase data before migration |
| User authentication issues | High | Test OAuth flows thoroughly |
| Performance differences | Medium | Load test with production-like data |
| Offline sync differences | Medium | Implement retry logic in offline queue |
| Schema compatibility | Medium | Map all Firebase fields to Supabase columns |

---

## Testing Checklist

- [ ] User can sign in with Google
- [ ] User data loads on app open
- [ ] Custom exercises sync correctly
- [ ] Training days/plans save and load
- [ ] Workout sessions persist
- [ ] Meals and nutrition data syncs
- [ ] Offline queue works with Supabase
- [ ] Logout clears all data
- [ ] Re-login restores all data
- [ ] Multiple device sync works
- [ ] No console errors during auth flow
- [ ] RLS policies prevent unauthorized access

---

## Files to Create/Modify

### Create:
- `lib/database.ts` - All Supabase data operations (replaces firestore.ts)
- `app/auth/callback/page.tsx` - OAuth callback handler for Supabase

### Modify:
- `package.json` - Update dependencies
- `lib/supabase.ts` - Enhance with auth/profile functions
- `lib/offlineQueue.ts` - Update sync function signatures
- `store/useAuthStore.ts` - Switch to Supabase auth
- `components/providers/AuthProvider.tsx` - Update imports
- `app/settings/page.tsx` - Update imports
- `.env.local` - Add Supabase variables

### Delete:
- `lib/firebase.ts` - No longer needed
- `lib/firestore.ts` - Replaced by lib/database.ts

---

## Notes

1. **Auth Callback**: Supabase OAuth requires a callback URL. Create `app/auth/callback/page.tsx` to handle the redirect.

2. **RLS Policies**: Already defined in supabase.sql. Verify they're properly configured after deployment.

3. **Real-Time Updates**: If real-time features were used, update to Supabase subscriptions format.

4. **Storage**: If Firebase Storage was used, configure Supabase Storage separately.

5. **Offline Sync**: Current offline queue implementation is database-agnostic, but test thoroughly.

---

## Next Steps

1. Review this plan with team
2. Create Supabase project and configure OAuth
3. Run lib/supabase.sql to create schema
4. Implement changes in Phase order
5. Test thoroughly before deploying
6. Monitor for data sync issues post-launch

