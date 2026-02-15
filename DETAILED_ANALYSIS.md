# Firebase to Supabase Migration - Detailed Analysis

**Analysis Date:** February 15, 2026
**App:** Gym App (Next.js 14)
**Status:** Ready for Migration
**Complexity Score:** 6/10 (Medium)

---

## Executive Summary

The Gym App is currently built on Firebase with two main dependencies:
1. **Firebase Authentication** (Google OAuth)
2. **Firestore** (Real-time document database)

This migration plan replaces both with:
1. **Supabase Authentication** (Google OAuth)
2. **Supabase PostgreSQL** (Relational database)

**Key Findings:**
- 2 core Firebase files used throughout system
- 5 files import Firebase indirectly
- Database schema already defined in SQL
- Supabase client already partially configured
- Minimal breaking changes needed
- Data structure transformation manageable

---

## Current Firebase Architecture

### Firebase Packages
```
firebase: ^12.7.0
```

### Firebase Modules Used
```
firebase/app        - initializeApp, getApps
firebase/auth       - getAuth, GoogleAuthProvider, signInWithPopup, 
                      signOut, onAuthStateChanged
firebase/firestore  - doc, setDoc, getDoc, updateDoc, collection,
                      query, getDocs, deleteDoc, writeBatch,
                      Timestamp
```

### Files Importing Firebase (5 total)
1. `lib/firebase.ts` - **Direct import** (initialization)
2. `lib/firestore.ts` - **Direct import** (Firestore operations, 519 lines)
3. `store/useAuthStore.ts` - **Import from firebase.ts**
4. `components/providers/AuthProvider.tsx` - Uses functions from firestore.ts
5. `app/settings/page.tsx` - Uses functions from firestore.ts

### Firestore Collections Structure
```
Collection: users/
  ├── Document: {uid}
  │   ├── Collection: customExercises
  │   │   └── Document: {exerciseId} - Exercise objects
  │   ├── Collection: trainingDays
  │   │   └── Document: {dayId} - TrainingDay objects
  │   ├── Collection: trainingPlans
  │   │   └── Document: {planId} - TrainingPlan objects
  │   ├── Collection: workoutSessions
  │   │   └── Document: {sessionId} - WorkoutSession objects
  │   ├── Collection: meals
  │   │   └── Document: {mealId} - Meal objects
  │   ├── Collection: supplements
  │   │   └── Document: {supId} - Supplement objects
  │   ├── Collection: sleepEntries
  │   │   └── Document: {sleepId} - SleepEntry objects
  │   └── Collection: trackedMeals
  │       └── Document: {mealId} - TrackedMeal objects
  └── Document: nutrition (settings)
      └── Contains: nutritionGoals, mealTemplates, etc.
```

---

## Target Supabase Architecture

### Supabase Library
```
@supabase/supabase-js: ^2.38.0
```

### Supabase Modules Used
```
supabase.auth.*           - signInWithOAuth, signOut, onAuthStateChange
supabase.from(table).*    - select, insert, update, upsert, delete
PostgreSQL RLS Policies   - Row Level Security for user isolation
```

### PostgreSQL Tables Structure
```
Table: auth.users (Supabase managed)
  ├── id (UUID)
  ├── email
  ├── user_metadata
  ├── created_at
  └── ...

Table: custom_exercises
  ├── id (UUID)
  ├── user_id (FK → auth.users)
  ├── name, category, description
  ├── primary_muscles (TEXT[])
  ├── secondary_muscles (TEXT[])
  ├── created_at, updated_at

Table: training_days
  ├── id (UUID)
  ├── user_id (FK → auth.users)
  ├── name
  ├── created_at, updated_at

Table: training_plans
  ├── id (UUID)
  ├── user_id (FK → auth.users)
  ├── name, sessions_per_week
  ├── is_active, current_day_index
  ├── created_at, updated_at

Table: workout_sessions
  ├── id (UUID)
  ├── user_id (FK → auth.users)
  ├── training_day_id (FK → training_days)
  ├── training_day_name
  ├── start_time, end_time
  ├── duration_minutes, total_volume_kg
  ├── notes
  ├── created_at, updated_at

Table: meals & meal_items
  ├── meals: id, user_id, meal_date, meal_type, totals
  └── meal_items: id, meal_id, food_name, quantity, macros

Table: body_weight_records
  ├── id, user_id, weight_kg, recorded_date, notes
  ├── Unique constraint: (user_id, recorded_date)

Table: scheduled_workouts
  └── id, user_id, scheduled_date, training_day_id, notes

All tables have RLS policies enabling user data isolation.
```

---

## Detailed File Analysis

### 1. `lib/firebase.ts` (24 lines)

**Purpose:** Firebase initialization
**Status:** ❌ DELETE

**Currently does:**
```
- initializeApp with config from env vars
- getAuth reference
- getFirestore reference
- GoogleAuthProvider setup
```

**Replaced by:**
- `lib/supabase.ts` (auth initialization)
- Supabase console (OAuth provider setup)

**Impact:** `useAuthStore.ts` depends on this

---

### 2. `lib/firestore.ts` (519 lines)

**Purpose:** All Firestore database operations
**Status:** ❌ DELETE → Replace with `lib/database.ts`

**Currently implements:**
```
Core Functions:
- saveUserData() / getUserData()
- saveCustomExercises() / getCustomExercises()
- saveWorkoutData() / getWorkoutData()
- saveNutritionData() / getNutritionData()
- syncAllDataToFirebase()
- loadAllDataFromFirebase()
- processOfflineQueue()
- deleteDocument()

Helper Functions:
- toDate() - Firestore Timestamp conversion
- removeUndefined() - object cleaning
```

**Data Operations:**
- User profiles (single document)
- Custom exercises (batch operations with delete detection)
- Training days/plans/sessions (batch operations)
- Meals and nutrition (chunked batch operations)
- Offline queue processing

**Challenges in this file:**
- Heavy use of `writeBatch` for atomic operations
- Manual subcollection querying
- Timestamp conversion logic
- Deletion detection for sync

**Replaced by:**
- `lib/database.ts` (new file with Supabase operations)

**Impact:** Used by `useAuthStore.ts`, `AuthProvider.tsx`, `settings/page.tsx`

---

### 3. `lib/offlineQueue.ts` (199 lines)

**Purpose:** Implement offline-first sync queue
**Status:** ✅ NO CHANGES NEEDED

**Why no changes:**
- Storage mechanism is database-agnostic (uses localStorage)
- Queue structure is database-agnostic
- Sync function signatures can adapt to any backend

**Minor verification:**
- Ensure `lib/database.ts` exports matching sync functions
- Test queue processing with Supabase

---

### 4. `store/useAuthStore.ts` (140 lines)

**Purpose:** Authentication state management with Zustand
**Status:** 🔄 COMPLETE REWRITE NEEDED

**Current imports to replace:**
```typescript
// OLD
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';

// NEW
import { supabase, signInWithGoogle as supabaseSignInGoogle } from '@/lib/supabase';
import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
```

**Functions to update:**
1. `signInWithGoogle` - Firebase popup → Supabase OAuth redirect
2. `logout` - Change auth client
3. `initializeAuth` - Replace event listener
4. `syncData` - Update function name

**Store state remains the same:**
- `user: User | null`
- `loading: boolean`
- `syncing: boolean`

**Impact:** Used by almost all components/pages

---

### 5. `components/providers/AuthProvider.tsx` (182 lines)

**Purpose:** Initialize auth and load user data on app start
**Status:** 🔄 MINOR UPDATES NEEDED

**Changes needed:**
1. Line ~11: Update import path
   ```typescript
   // OLD
   import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
   // NEW
   import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
   ```

2. Line ~19-30: Update comments (Firebase → Supabase)

3. Line ~106+: Update function calls
   ```typescript
   // OLD
   const data = await loadAllDataFromFirebase(firebaseUser.uid);
   // NEW
   const data = await loadAllDataFromSupabase(supabaseUser.id);
   ```

**Logic remains identical:**
- Initialize auth
- Load workout data
- Load nutrition data
- Fire callbacks
- Handle errors

**Impact:** High (affects all pages, called during app initialization)

---

### 6. `app/settings/page.tsx` (692 lines)

**Purpose:** Settings page with data sync/export features
**Status:** 🔄 MINOR UPDATES NEEDED

**Changes needed:**
1. Line ~11: Update import
   ```typescript
   // OLD
   import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
   // NEW
   import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
   ```

2. Line ~618+: Update function calls
   ```typescript
   // OLD
   const data = await loadAllDataFromFirebase(user.uid);
   // NEW
   const data = await loadAllDataFromSupabase(user.uid);
   ```

**UI/Logic remains identical** - just backend calls change

**Impact:** Medium (only used by settings page)

---

### 7. `store/useWorkoutStore.ts` (240 lines)

**Purpose:** Zustand store for workout data (in-memory)
**Status:** ✅ NO CHANGES NEEDED

**Why:**
- Uses Zustand persist middleware (stores to localStorage)
- Never directly imports Firebase
- Data loading handled by AuthProvider & useAuthStore
- Data syncing handled by useAuthStore.syncData()

**Note:** Store actions remain the same. Backend loading/syncing is abstracted away.

---

### 8. `store/useNutritionStore.ts` (301 lines)

**Purpose:** Zustand store for nutrition data (in-memory)
**Status:** ✅ NO CHANGES NEEDED

**Same reasoning as useWorkoutStore**

---

### 9. `store/useBodyWeightStore.ts` (134 lines)

**Purpose:** Zustand store for body weight data (in-memory)
**Status:** ✅ NO CHANGES NEEDED

**Same reasoning as useWorkoutStore**

---

### 10. `lib/supabase.ts` (15 lines)

**Purpose:** Supabase client initialization
**Status:** 🔄 ENHANCE

**Currently:**
```typescript
- Initialize Supabase client
- getCurrentUser() helper
- signOut() helper
```

**To add:**
- `signInWithGoogle()` - OAuth redirect
- `onAuthStateChange()` - Event listener
- `getUserProfile()` - Get user data
- `upsertUserProfile()` - Save user data

---

### 11. `app/auth/callback/page.tsx`

**Purpose:** Handle OAuth callback after Google sign-in
**Status:** ✅ CREATE NEW

**Why needed:**
- Supabase OAuth requires redirect URL
- Must verify session and redirect to dashboard

**Implementation:** 30 lines TSX component

---

### 12. `lib/database.ts`

**Purpose:** All Supabase database operations (replaces firestore.ts)
**Status:** ✅ CREATE NEW

**Size:** ~450-500 lines

**Implements all functions from firestore.ts:**
- Custom exercise operations
- Training day operations
- Training plan operations
- Workout session operations
- Meal & nutrition operations
- Body weight operations
- Sync & load functions

---

## Dependency Map

```
┌─────────────────────────────────────────┐
│         useAuthStore (core)             │
├─────────────────────────────────────────┤
│ Dependencies:                           │
│ - lib/supabase (auth)                   │
│ - lib/database (data load/sync)         │
│ - lib/offlineQueue (offline sync)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      AuthProvider (initialization)      │
├─────────────────────────────────────────┤
│ - useAuthStore                          │
│ - useWorkoutStore                       │
│ - useNutritionStore                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        All Pages & Components           │
├─────────────────────────────────────────┤
│ - useAuthStore (for user state)         │
│ - useWorkoutStore (for workout data)    │
│ - useNutritionStore (for nutrition)     │
│ - useBodyWeightStore (for weight)       │
└─────────────────────────────────────────┘
```

---

## Data Transformation Map

### Firebase Firestore → Supabase PostgreSQL

#### User Document
```
Firebase:  users/{uid}
Supabase:  auth.users (auto-managed)
           users table (custom profile fields - NOT YET IN SCHEMA)

Status: Create a `users` table in supabase.sql for custom profiles
```

#### Custom Exercises
```
Firebase:  users/{uid}/customExercises/{id}
           └─ {exercise object}

Supabase:  custom_exercises table
           ├─ id: exercise.id
           ├─ user_id: {uid}
           ├─ name: exercise.name
           ├─ category: exercise.category
           ├─ primary_muscles: exercise.primaryMuscles[]
           └─ secondary_muscles: exercise.secondaryMuscles[]
```

#### Training Days
```
Firebase:  users/{uid}/trainingDays/{id}
           └─ {day object}

Supabase:  training_days
           ├─ id: day.id
           ├─ user_id: {uid}
           ├─ name: day.name
           └─ timestamps
```

#### Training Plans
```
Firebase:  users/{uid}/trainingPlans/{id}
           └─ {plan object with trainingDays array}

Supabase:  training_plans (main)
           ├─ id: plan.id
           ├─ user_id: {uid}
           ├─ name: plan.name
           ├─ sessions_per_week: plan.sessionsPerWeek
           ├─ is_active: plan.isActive
           ├─ current_day_index: plan.currentDayIndex
           
           training_plan_days (junction)
           ├─ training_plan_id
           ├─ training_day_id
           └─ sequence_order

Note: Denormalization in Firestore requires normalization in Supabase
```

#### Workout Sessions
```
Firebase:  users/{uid}/workoutSessions/{id}
           └─ {session object with exercises array}

Supabase:  workout_sessions
           ├─ id: session.id
           ├─ user_id: {uid}
           ├─ start_time: session.startTime
           ├─ end_time: session.endTime
           ├─ duration_minutes: calculated
           
           workout_exercises (junction)
           └─ Array items become separate records
```

#### Meals
```
Firebase:  users/{uid}/meals/{id}
           └─ {meal object}

Supabase:  meals
           ├─ id: meal.id
           ├─ user_id: {uid}
           ├─ meal_date: meal.date
           ├─ meal_type: meal.mealTime
           ├─ total_calories: meal.calories
           
           meal_items (if needed)
           └─ Items stored separately
```

#### Sleep Entries
```
Firebase:  users/{uid}/sleepEntries/{id}
           └─ {entry object}

Supabase:  sleep_entries (table to be added)
           ├─ id: entry.id
           ├─ user_id: {uid}
           ├─ date: entry.date
           ├─ hours_slept: entry.hoursSlept
           ├─ quality: entry.quality
           └─ notes: entry.notes
```

#### Body Weight
```
Firebase:  Stored in localStorage with zustand persist

Supabase:  body_weight_records
           ├─ id
           ├─ user_id
           ├─ weight_kg
           ├─ recorded_date
           └─ notes
```

---

## Missing Schema Tables

Current `lib/supabase.sql` is complete but verify these exist:
- [ ] `users` - For custom user profile fields
- [ ] `sleep_entries` - For sleep tracking
- [ ] `tracked_meals` - For daily meal tracking logs

**Action:** Review if these need to be added to supabase.sql

---

## Authentication Flow Comparison

### Firebase Flow (Current)
```
1. User clicks "Sign in with Google"
   ↓
2. signInWithPopup() opens OAuth popup
   ↓
3. User auth with Google
   ↓
4. Firebase returns user object
   ↓
5. Create Firestore user document
   ↓
6. Store user in Zustand state
```

### Supabase Flow (New)
```
1. User clicks "Sign in with Google"
   ↓
2. signInWithOAuth() redirects to Google
   ↓
3. User auths with Google
   ↓
4. Google redirects to: /auth/callback
   ↓
5. Callback validates session
   ↓
6. Redirects to /dashboard
   ↓
7. AuthProvider reads auth state
   ↓
8. Loads user profile from DB
   ↓
9. Store user in Zustand state
```

**Key difference:** Supabase uses server-side redirect instead of popup

---

## Implementation Complexity Analysis

### Simple (0-2 hours each)
- ✅ Update imports in AuthProvider.tsx
- ✅ Update imports in settings/page.tsx
- ✅ Update package.json
- ✅ Create app/auth/callback/page.tsx

### Medium (1-3 hours each)
- 🔄 Enhance lib/supabase.ts with auth functions
- 🔄 Rewrite useAuthStore.ts (need to understand Zustand patterns)

### Complex (2-4 hours each)
- 🔧 Create lib/database.ts (need to map all operations)

### Time Estimate
```
Phase 1 (Setup):          0.5 hours
Phase 2 (Core Files):     3-4 hours
  - lib/supabase.ts:      0.5 hours
  - lib/database.ts:      2 hours
  - useAuthStore.ts:      1 hour
Phase 3 (Integration):    1 hour
Phase 4 (Cleanup):        0.25 hours
Phase 5 (Testing):        2 hours
────────────────────────────────────
TOTAL:                    6-8 hours
```

---

## Risk Assessment

### Critical Risks (Severity: HIGH)

1. **User Authentication Breaks**
   - Impact: App completely unusable
   - Mitigation: Test OAuth flow before production
   - Rollback: 15 minutes

2. **Data Loss During Migration**
   - Impact: User data permanently lost
   - Mitigation: Backup Firebase before starting
   - Rollback: Restore from backup

3. **RLS Policies Misconfigured**
   - Impact: Users see each others' data
   - Mitigation: Test RLS restrictions thoroughly
   - Rollback: Update policy definitions

### High Risks (Severity: MEDIUM)

4. **Offline Queue Stops Working**
   - Impact: Data not synced when offline
   - Mitigation: Test queue with network disconnect
   - Recovery: Manual sync available

5. **Performance Degradation**
   - Impact: App slower than Firebase
   - Mitigation: Optimize DB queries, add indexes
   - Recovery: Rollback or optimize

6. **Real-time Updates Lost**
   - Impact: Multiple devices not synced live
   - Mitigation: Document limitation, implement polling if needed
   - Recovery: Implement Supabase subscriptions

### Medium Risks (Severity: LOW)

7. **Import/Reference Errors**
   - Impact: Build fails or runtime errors
   - Mitigation: Careful find/replace, use TypeScript
   - Recovery: 30 minutes to fix

---

## Success Metrics

After migration:
- [ ] All users can login with Google
- [ ] Custom exercises load within 500ms
- [ ] Training data syncs automatically
- [ ] No browser console errors
- [ ] All CRUD operations work correctly
- [ ] RLS policies working (unauthorized access blocked)
- [ ] App builds without warnings
- [ ] No references to Firebase in codebase

---

## Assumptions & Constraints

### Assumptions
- All Firebase data will be migrated (assumed yes in plan)
- Google OAuth will be re-configured in Supabase
- PostgreSQL schema in supabase.sql is final
- No real-time subscriptions currently implemented

### Constraints
- Must maintain backward compatibility with Zustand stores
- Must not break existing UI components
- Authentication must be seamless for users
- Offline functionality must be preserved
- Data privacy (RLS) must be maintained

---

## Recommendations

1. **Before starting:** Export and backup all Firebase data
2. **During implementation:** Use feature branches, test continuously
3. **For testing:** Set up staging environment with real data
4. **For deployment:** Plan downtime or gradual rollout
5. **Post-migration:** Monitor error rates and performance
6. **Documentation:** Update README and architecture docs

---

## Questions to Resolve

- [ ] Is `sleep_entries` table already in Supabase?
- [ ] Is there a `users` table in Supabase for custom profile fields?
- [ ] Are real-time subscriptions needed for any features?
- [ ] Is existing Firebase data being migrated or starting fresh?
- [ ] What's the Supabase project URL and credentials?
- [ ] Has Google OAuth been configured in Supabase console?

---

## Next Steps

1. **Confirm Supabase setup** - Verify schema and OAuth config
2. **Review code changes** - Present IMPLEMENTATION_REFERENCE.md to team
3. **Create branch** - `migration/firebase-to-supabase`
4. **Implement Phase 1** - Setup and dependencies
5. **Implement Phase 2** - Core Firebase files
6. **Implement Phase 3** - Integration and cleanup
7. **Test Phase 5** - Comprehensive testing
8. **Deploy** - Merge to main after verification

**Estimated completion:** 1-2 days including testing

