# Firebase to Supabase Migration - Implementation Reference

## Critical Files & Specific Changes

---

## 1. `package.json` - Dependencies Update

### Current State
```json
{
  "dependencies": {
    "firebase": "^12.7.0"
  }
}
```

### Required Changes
**Remove:** Firebase packages
**Add:** Supabase client

```diff
{
  "dependencies": {
-   "firebase": "^12.7.0",
+   "@supabase/supabase-js": "^2.38.0",
    "date-fns": "^3.2.0",
    "framer-motion": "^11.0.3",
    ...
  }
}
```

**Command to apply:**
```bash
npm uninstall firebase
npm install @supabase/supabase-js@^2.38.0
```

---

## 2. `lib/supabase.ts` - Enhance (File already exists)

### Current State
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### Required Changes
**Add these functions:**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ Auth Helpers ============

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    }
  });
  return { data, error };
}

export function onAuthStateChange(callback: (user: any) => void) {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return subscription;
}

// ============ User Profile ============

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function upsertUserProfile(userId: string, profile: Partial<any>) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ 
      id: userId, 
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}
```

---

## 3. `lib/database.ts` - CREATE NEW FILE

**This completely replaces `lib/firestore.ts`**

### Purpose
Handle all Supabase database operations (no auth)

### File Size
Approximately 400-500 lines

### Key Functions Structure

```typescript
import { supabase } from './supabase';
import { User, TrainingDay, TrainingPlan, WorkoutSession, Exercise } from '@/types';
import { MealTemplate, CustomFood, SupplementPreset, SleepEntry, TrackingSettings } from '@/store/useNutritionStore';

// ============ CUSTOM EXERCISES ============

export async function saveCustomExercises(userId: string, exercises: Exercise[]) {
  // Implementation
}

export async function getCustomExercises(userId: string): Promise<Exercise[]> {
  // Implementation
}

export async function deleteCustomExercise(userId: string, exerciseId: string) {
  // Implementation
}

// ============ TRAINING DAYS ============

export async function saveTrainingDays(userId: string, days: TrainingDay[]) {
  // Implementation
}

export async function getTrainingDays(userId: string): Promise<TrainingDay[]> {
  // Implementation
}

export async function deleteTrainingDay(userId: string, dayId: string) {
  // Implementation
}

// ============ TRAINING PLANS ============

export async function saveTrainingPlans(userId: string, plans: TrainingPlan[]) {
  // Implementation
}

export async function getTrainingPlans(userId: string): Promise<TrainingPlan[]> {
  // Implementation
}

export async function deleteTrainingPlan(userId: string, planId: string) {
  // Implementation
}

// ============ WORKOUT SESSIONS ============

export async function saveWorkoutSessions(userId: string, sessions: WorkoutSession[]) {
  // Implementation
}

export async function getWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
  // Implementation
}

export async function deleteWorkoutSession(userId: string, sessionId: string) {
  // Implementation
}

// ============ MEALS & NUTRITION ============

export async function saveMeals(userId: string, meals: any[]) {
  // Implementation
}

export async function getMeals(userId: string): Promise<any[]> {
  // Implementation
}

export async function saveSleepEntries(userId: string, entries: SleepEntry[]) {
  // Implementation
}

export async function getSleepEntries(userId: string): Promise<SleepEntry[]> {
  // Implementation
}

// ============ BODY WEIGHT ============

export async function saveBodyWeightRecords(userId: string, records: any[]) {
  // Implementation
}

export async function getBodyWeightRecords(userId: string): Promise<any[]> {
  // Implementation
}

// ============ SYNC FUNCTIONS ============

export async function saveWorkoutData(userId: string, data: {
  trainingDays?: TrainingDay[];
  trainingPlans?: TrainingPlan[];
  workoutSessions?: WorkoutSession[];
}) {
  // Implementation
}

export async function getWorkoutData(userId: string) {
  // Implementation
}

export async function saveNutritionData(userId: string, data: {
  nutritionGoals?: any;
  meals?: any[];
  supplements?: any[];
  sleepEntries?: SleepEntry[];
  trackingSettings?: TrackingSettings;
  trackedMeals?: any[];
}) {
  // Implementation
}

export async function getNutritionData(userId: string) {
  // Implementation
}

export async function syncAllDataToSupabase(userId: string, workoutStore: any, nutritionStore: any) {
  // Implementation
}

export async function loadAllDataFromSupabase(userId: string) {
  // Implementation
}
```

---

## 4. `store/useAuthStore.ts` - Completely Rewrite

### Current Imports (TO REMOVE)
```typescript
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { saveUserData, getUserData, loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
```

### New Imports (TO ADD)
```typescript
import { supabase, signInWithGoogle as supabaseSignInWithGoogle, onAuthStateChange } from '@/lib/supabase';
import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
```

### Current Function (signInWithGoogle)
```typescript
signInWithGoogle: async () => {
  try {
    set({ loading: true });
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    // Check if user exists in Firestore
    let userData = await getUserData(firebaseUser.uid);
    
    if (!userData) {
      // New user - create profile
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        hasCompletedOnboarding: false,
        createdAt: new Date(),
      };
      await saveUserData(firebaseUser.uid, userData);
    }
    
    set({ user: userData, loading: false });
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    set({ loading: false });
    throw error;
  }
},
```

### New Function (signInWithGoogle) - Using Supabase
```typescript
signInWithGoogle: async () => {
  try {
    set({ loading: true });
    const { data, error } = await supabaseSignInWithGoogle();
    if (error) throw error;
    // OAuth flow will redirect, user state handled by initializeAuth
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    set({ loading: false });
    throw error;
  }
},
```

### Current initializeAuth (signInWithPopup version)
Replace the entire `onAuthStateChanged` section with:

```typescript
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
```

### logout function (minimal changes)
```typescript
logout: async () => {
  try {
    await supabase.auth.signOut();
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
```

### syncData function (change method name)
```typescript
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
```

---

## 5. `components/providers/AuthProvider.tsx` - Update Imports

### Current Import
```typescript
import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
```

### New Import
```typescript
import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
```

### Current Usage
```typescript
const data = await loadAllDataFromFirebase(firebaseUser.uid);
```

### New Usage
```typescript
const data = await loadAllDataFromSupabase(supabaseUser.id);
```

### Comment Updates
- Change: `// Handle data loading from Firebase`
- To: `// Handle data loading from Supabase`
- Change: `console.log('Loading workout data from Firebase:', data);`
- To: `console.log('Loading workout data from Supabase:', data);`
- Change: `console.log('Set training days from Firebase:', ...)`
- To: `console.log('Set training days from Supabase:', ...)`

---

## 6. `app/settings/page.tsx` - Update Imports

### Line 11 - Current
```typescript
import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
```

### Line 11 - New
```typescript
import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
```

### Around Line 618 - Current
```typescript
const data = await loadAllDataFromFirebase(user.uid);
console.log('Loaded from Firebase:', data);
```

### Around Line 618 - New
```typescript
const data = await loadAllDataFromSupabase(user.uid);
console.log('Loaded from Supabase:', data);
```

---

## 7. `lib/offlineQueue.ts` - Minor Updates

### No Major Changes Needed!
The offline queue implementation is database-agnostic and can work with both Firebase and Supabase.

### Only change: Ensure sync function signatures match `lib/database.ts`

Current function signature:
```typescript
export async function processQueue(
  userId: string,
  syncFunctions: {
    syncWorkout: (data: any) => Promise<void>;
    syncNutrition: (data: any) => Promise<void>;
    syncCustomExercises: (data: any) => Promise<void>;
  }
): Promise<{ success: number; failed: number; skipped: number }>
```

This can remain the same - just ensure `lib/database.ts` exports matching functions and the offline queue calls them correctly.

---

## 8. `lib/firebase.ts` - DELETE

**Action: Delete this file completely**

It's no longer needed. All Firebase functionality is replaced by:
- `lib/supabase.ts` - Auth and user profile
- `lib/database.ts` - Data operations

---

## 9. `lib/firestore.ts` - DELETE

**Action: Delete this file completely**

All functionality is replaced by `lib/database.ts`

---

## 10. `app/auth/callback/page.tsx` - CREATE NEW FILE

### Purpose
Handle OAuth callback from Supabase

### Content
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verify the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          // Redirect back to login if no session
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentifizierung...</h1>
        <p className="text-gray-600">Bitte warten Sie...</p>
      </div>
    </div>
  );
}
```

---

## 11. `.env.local` - Add Environment Variables

### Remove these Firebase variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Add these Supabase variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

---

## Summary of Changes by File

| File | Action | Severity | Lines Changed | Impact |
|------|--------|----------|---------------|--------|
| package.json | Update deps | Critical | 2 | Build setup |
| lib/supabase.ts | Enhance | Critical | +50 | Auth foundation |
| lib/database.ts | Create | Critical | ~450 | Data operations |
| store/useAuthStore.ts | Rewrite | Critical | ~80% | Auth state |
| components/providers/AuthProvider.tsx | Update imports | High | 3-5 | Data loading |
| app/settings/page.tsx | Update imports | High | 2-3 | Data sync UI |
| app/auth/callback/page.tsx | Create | High | ~30 | Auth flow |
| lib/offlineQueue.ts | No change | Low | 0 | Queue still works |
| lib/firebase.ts | Delete | Medium | - | Cleanup |
| lib/firestore.ts | Delete | Medium | - | Cleanup |

---

## Dependency Graph

```
useAuthStore ← supabase.ts
            ← database.ts
            ← offlineQueue.ts (unchanged)
            
AuthProvider → useAuthStore
             → useWorkoutStore
             → useNutritionStore
             
Components ← AuthProvider
           ← useAuthStore
           ← useWorkoutStore
           ← useNutritionStore
```

---

## Testing Priority

1. **Critical Path Tests**
   - [ ] Google OAuth sign-in
   - [ ] Auth callback redirect
   - [ ] User data loads after login
   - [ ] User can logout
   - [ ] Auth state persists on refresh

2. **Data Sync Tests**
   - [ ] Custom exercises save/load
   - [ ] Training days save/load
   - [ ] Workout sessions save/load
   - [ ] Meals and nutrition data sync
   - [ ] Multiple device sync

3. **Edge Cases**
   - [ ] Offline sync queue works
   - [ ] Network error handling
   - [ ] RLS policies block unauthorized access
   - [ ] Data consistency after sync

---

## Potential Issues & Solutions

### Issue 1: OAuth callback loop
**Cause:** Callback URL mismatch
**Solution:** Ensure `.env.local` callback matches Supabase OAuth settings

### Issue 2: RLS policy blocks all queries
**Cause:** RLS policies too restrictive
**Solution:** Verify `auth.uid()` returns correct user ID

### Issue 3: Data doesn't load after login
**Cause:** `loadAllDataFromSupabase` failing silently
**Solution:** Check browser console for errors, verify database queries

### Issue 4: Offline queue not syncing
**Cause:** sync functions signatures don't match
**Solution:** Verify `processQueue` callbacks match `database.ts` exports

