# Firebase to Supabase Migration - Complete Checklist & Dependencies

---

## DEPENDENCY ANALYSIS

### Firebase Modules Used

```
firebase/app
├── imported by: lib/firebase.ts
├── functions: initializeApp, getApps
└── related to: App initialization

firebase/auth
├── imported by: lib/firebase.ts, store/useAuthStore.ts
├── functions: getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
└── related to: User authentication

firebase/firestore
├── imported by: lib/firestore.ts, lib/offlineQueue.ts (indirectly)
├── functions: doc, setDoc, getDoc, updateDoc, collection, query, getDocs, deleteDoc, writeBatch, Timestamp
└── related to: Database operations
```

### Import Chain Analysis

```
lib/firebase.ts (START HERE)
  ├─ exports: auth, db, googleProvider
  
store/useAuthStore.ts
  ├─ imports: auth, googleProvider from lib/firebase.ts
  ├─ imports: functions from lib/firestore.ts
  └─ dependent: Used by AuthProvider and most pages
  
lib/firestore.ts
  ├─ imports: db from lib/firebase.ts
  ├─ exports: saveCustomExercises, getCustomExercises, saveWorkoutData, etc.
  └─ dependent: Used by useAuthStore, AuthProvider, settings page
  
components/providers/AuthProvider.tsx
  ├─ imports: functions from lib/firestore.ts
  ├─ imports: useAuthStore
  └─ dependent: Wraps entire app
  
app/settings/page.tsx
  ├─ imports: functions from lib/firestore.ts
  └─ dependent: Settings/export features
```

---

## FILE-BY-FILE CHANGES REQUIRED

### Summary Table

| File | Type | Status | Changes | LOC Impact | Delete | Notes |
|------|------|--------|---------|-----------|--------|-------|
| package.json | Config | ✅ Ready | Dependencies | 2 | - | firebase → @supabase/supabase-js |
| lib/firebase.ts | Source | ❌ DELETE | Remove all | 0 | ✅ | Replaced by lib/supabase.ts enhancements |
| lib/firestore.ts | Source | ❌ DELETE | Remove all | 0 | ✅ | Replaced by lib/database.ts |
| lib/supabase.ts | Source | 🔄 Update | Add functions | +50 | - | Enhance with auth helpers |
| lib/database.ts | Source | ✅ CREATE | New file | ~450 | - | Replaces firestore.ts |
| lib/offlineQueue.ts | Source | ✅ Keep | No changes | 0 | - | Database-agnostic design |
| store/useAuthStore.ts | State | 🔄 Update | Rewrite functions | ~80% | - | Switch to Supabase auth |
| store/useWorkoutStore.ts | State | ✅ Keep | No changes | 0 | - | Zustand store only |
| store/useNutritionStore.ts | State | ✅ Keep | No changes | 0 | - | Zustand store only |
| store/useBodyWeightStore.ts | State | ✅ Keep | No changes | 0 | - | Zustand store only |
| components/providers/AuthProvider.tsx | Component | 🔄 Update | Update imports | 3-5 | - | Change import paths |
| app/settings/page.tsx | Page | 🔄 Update | Update imports | 2-3 | - | Change import paths |
| app/auth/callback/page.tsx | Page | ✅ CREATE | New file | ~30 | - | OAuth callback handler |
| types/index.ts | Types | ✅ Keep | No changes | 0 | - | Type definitions unchanged |
| All other files | - | ✅ Keep | No changes | 0 | - | Unaffected |

---

## PRE-MIGRATION SETUP

### ✅ Before You Start

```bash
# 1. Create feature branch
git checkout -b migration/firebase-to-supabase

# 2. Backup current state
git push origin migration/firebase-to-supabase

# 3. Export Firebase data (if needed)
# Use Firebase console Export functionality
# Save to:./backup/firebase-data.json

# 4. Verify Supabase setup
# - Project created
# - OAuth configured
# - lib/supabase.sql executed
# - Environment variables set in .env.local

# 5. Install new dependencies
npm uninstall firebase
npm install @supabase/supabase-js@^2.38.0
```

---

## ACTIONABLE CHECKLIST - DO IN THIS ORDER

### PHASE 1: SETUP (30 minutes)

- [ ] Create new database branch
- [ ] Backup existing code
  ```bash
  git stash
  git branch backup/firebase-$(date +%s)
  ```
- [ ] Export Firebase data (if needed)
- [ ] Verify Supabase project exists
- [ ] Verify lib/supabase.sql has been run
- [ ] Update `.env.local` with Supabase credentials
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxx
  ```
- [ ] Update package.json dependencies
  ```bash
  npm uninstall firebase
  npm install @supabase/supabase-js@^2.38.0
  npm install
  ```

### PHASE 2: CORE LIB FILES (2-3 hours)

**2.1 Enhance lib/supabase.ts**
- [ ] Open lib/supabase.ts
- [ ] Add imports from IMPLEMENTATION_REFERENCE.md
- [ ] Add signInWithGoogle() function
- [ ] Add onAuthStateChange() function
- [ ] Add getUserProfile() function
- [ ] Add upsertUserProfile() function
- [ ] Test compile: `npm run build` (partial)

**2.2 Create lib/database.ts**
- [ ] Create new file: lib/database.ts
- [ ] Copy skeleton from MIGRATION_PLAN.md
- [ ] Implement saveCustomExercises()
- [ ] Implement getCustomExercises()
- [ ] Implement saveWorkoutData()
- [ ] Implement getWorkoutData()
- [ ] Implement saveNutritionData()
- [ ] Implement getNutritionData()
- [ ] Implement syncAllDataToSupabase()
- [ ] Implement loadAllDataFromSupabase()
- [ ] Test compile: `npm run build` (partial)

**2.3 Update lib/offlineQueue.ts**
- [ ] Verify no Firebase imports (it shouldn't have any)
- [ ] Check that sync function signatures match lib/database.ts
- [ ] No code changes needed, just verification

### PHASE 3: STATE MANAGEMENT (1 hour)

**3.1 Rewrite store/useAuthStore.ts**
- [ ] Open store/useAuthStore.ts
- [ ] Replace Firebase auth imports
  ```typescript
  // OLD
  import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
  import { auth, googleProvider } from '@/lib/firebase';
  
  // NEW
  import { supabase, signInWithGoogle } from '@/lib/supabase';
  ```
- [ ] Replace firestore imports
  ```typescript
  // OLD
  import { saveUserData, getUserData, loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
  
  // NEW
  import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
  ```
- [ ] Update signInWithGoogle() function (see IMPLEMENTATION_REFERENCE.md)
- [ ] Update logout() function
- [ ] Update initializeAuth() function
- [ ] Update syncData() function
- [ ] Test compile: `npm run build` (should pass)

### PHASE 4: INTEGRATION FILES (1 hour)

**4.1 Update components/providers/AuthProvider.tsx**
- [ ] Find and replace import on line ~11
  ```typescript
  // OLD
  import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
  
  // NEW
  import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
  ```
- [ ] Find and replace calls to loadAllDataFromFirebase
  - Search: `loadAllDataFromFirebase(`
  - Replace: `loadAllDataFromSupabase(`
- [ ] Update comments (Firebase → Supabase)
- [ ] Test compile: `npm run build`

**4.2 Update app/settings/page.tsx**
- [ ] Find and replace import on line ~11
  ```typescript
  // OLD
  import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
  
  // NEW
  import { loadAllDataFromSupabase, syncAllDataToSupabase } from '@/lib/database';
  ```
- [ ] Find and replace function calls
  - Search: `loadAllDataFromFirebase(`
  - Replace: `loadAllDataFromSupabase(`
  - Search: `syncAllDataToFirebase(`
  - Replace: `syncAllDataToSupabase(`
- [ ] Test compile: `npm run build`

**4.3 Create app/auth/callback/page.tsx**
- [ ] Create new file: app/auth/callback/page.tsx
- [ ] Copy content from IMPLEMENTATION_REFERENCE.md
- [ ] Verify syntax is correct
- [ ] Test compile: `npm run build`

### PHASE 5: CLEANUP (15 minutes)

**5.1 Verify all Firebase imports are removed**
- [ ] Search for "firebase" in ALL files
  ```bash
  grep -r "firebase" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next
  ```
- [ ] Should return NO results (except backup files)
- [ ] If results found, update those files

**5.2 Delete old Firebase files**
- [ ] Delete lib/firebase.ts
- [ ] Delete lib/firestore.ts
- [ ] Verify they're deleted: `git status`

**5.3 Verify all imports are correct**
- [ ] Search for "loadAllDataFromFirebase"
  - Should find: 0 results
- [ ] Search for "syncAllDataToFirebase"
  - Should find: 0 results
- [ ] Search for "lib/firestore"
  - Should find: 0 results

### PHASE 6: BUILD & TEST (30 minutes)

- [ ] Run full build: `npm run build`
  - Must succeed with no errors
  - Warnings acceptable but prefer none
- [ ] Start dev server: `npm run dev`
- [ ] Open browser: http://localhost:3000
- [ ] No console errors immediately
- [ ] Application loads without crashing

### PHASE 7: FUNCTIONALITY TESTING (1-2 hours)

**7.1 Authentication Tests**
- [ ] Navigate to /login page
- [ ] Click "Sign in with Google"
- [ ] Verify redirects to Google OAuth
- [ ] Complete Google OAuth flow
- [ ] Verify redirects to /auth/callback
- [ ] Verify redirects to /dashboard
- [ ] Verify user data appears in header
- [ ] No console errors during flow

**7.2 Data Loading Tests**
- [ ] After login, wait for data to load
- [ ] Check that custom exercises load
- [ ] Check that training days load
- [ ] Check that training plans load
- [ ] Verify workout sessions appear
- [ ] No console errors about missing data

**7.3 Data Modification Tests**
- [ ] Create new custom exercise
- [ ] Save and verify it persists on refresh
- [ ] Create new training day
- [ ] Save and verify it persists
- [ ] Delete an exercise
- [ ] Verify deletion persists
- [ ] Edit nutrition goals
- [ ] Verify changes persist

**7.4 Sync Tests**
- [ ] Check that workout data syncs to Supabase
- [ ] Logout
- [ ] Login again
- [ ] Verify all data reloads correctly
- [ ] Test in settings page data export
- [ ] Navigate between pages without data loss

**7.5 Offline Tests** (if implementing offline)
- [ ] Disconnect network (DevTools)
- [ ] Try to modify data
- [ ] Verify offline queue stores actions
- [ ] Reconnect network
- [ ] Verify data syncs automatically

---

## POST-MIGRATION VERIFICATION

### Security Checks

- [ ] Cannot access other user's data (RLS working)
  - Try modifying Supabase query in DevTools to another user_id
  - Should get 403 error
- [ ] API keys are not exposed in client
  - Check: no firebase config visible in network requests
  - Only Supabase keys should be in requests
- [ ] Auth tokens are secure
  - Check browser cookies/localStorage
  - Should see Supabase session, not Firebase
- [ ] No sensitive data in console.log

### Performance Check

- [ ] Login completes in < 3 seconds
- [ ] Data loads after login in < 2 seconds
- [ ] Custom exercise save in < 1 second
- [ ] Page navigation smooth and responsive
- [ ] No jank or freezing

### Error Scenarios

- [ ] Network error → app handles gracefully
- [ ] Database error → user sees error message
- [ ] Invalid session → redirect to login
- [ ] Unauthorized request → RLS blocks it

---

## TROUBLESHOOTING DURING MIGRATION

### Problem: "Cannot find module 'firebase'"

**Cause:** Firebase still imported somewhere
**Fix:**
```bash
# Find all firebase imports
grep -r "from.*firebase" . --include="*.ts" --include="*.tsx"

# Fix each file or delete it
```

### Problem: "Missing Supabase environment variables"

**Cause:** .env.local not set correctly
**Fix:**
```bash
# Check .env.local exists
ls -la .env.local

# Should contain:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Restart dev server after changing env
npm run dev
```

### Problem: Build fails with TypeScript errors

**Cause:** Type mismatches in Supabase functions
**Fix:**
```bash
# Check compile errors
npm run build

# Review IMPLEMENTATION_REFERENCE.md for correct types
# Ensure User, TrainingDay, etc. types match
```

### Problem: "Auth callback URL mismatch"

**Cause:** Supabase OAuth settings don't match callback URL
**Fix:**
1. Open Supabase console
2. Authentication → Providers → Google
3. Redirect URLs should include: `http://localhost:3000/auth/callback`
4. For production: `https://yourdomain.com/auth/callback`

### Problem: "Cannot find module './firestore'"

**Cause:** Code still imports old firestore.ts
**Fix:**
```bash
# Find the import
grep -r "firestore" . --include="*.ts" --include="*.tsx"

# Update to database.ts
```

### Problem: "RLS policy violation" on queries

**Cause:** User_id not matching auth.uid()
**Fix:**
1. Verify Supabase RLS policies in supabase.sql
2. Check that user_id column is populated correctly
3. Verify auth.uid() is returning correct value
4. Test with: SELECT auth.uid() in SQL editor

---

## ROLLBACK PROCEDURE

If migration fails critically:

```bash
# 1. Stop all services
npm run dev # (Ctrl+C)

# 2. Restore Firebase dependencies
npm install firebase@^12.7.0

# 3. Restore firebase files from backup
git checkout backup/firebase-$(date) -- lib/firebase.ts lib/firestore.ts

# 4. Revert current changes
git revert HEAD --no-edit

# 5. Restart with Firebase
npm run dev

# 6. Verify old system works
# Test login and data loading
```

---

## FILES TO KEEP/DELETE SUMMARY

### ✅ KEEP THESE FILES (No changes needed)
```
lib/offlineQueue.ts
store/useWorkoutStore.ts
store/useNutritionStore.ts
store/useBodyWeightStore.ts
types/index.ts
components/**/* (except AuthProvider.tsx)
app/**/* (except settings, auth/callback)
data/**/*
hooks/**/*
/public/
package.json (with updated deps)
.env.local (with Supabase vars)
```

### 🗑️ DELETE THESE FILES
```
lib/firebase.ts
lib/firestore.ts
```

### ✅ MODIFY THESE FILES
```
lib/supabase.ts (enhance)
store/useAuthStore.ts (rewrite)
components/providers/AuthProvider.tsx (update imports)
app/settings/page.tsx (update imports)
```

### ✅ CREATE NEW FILES
```
lib/database.ts
app/auth/callback/page.tsx
```

---

## VERIFICATION CHECKLIST AFTER MIGRATION

Complete all of these before considering migration done:

**Code Quality**
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] No Firebase imports remain
- [ ] TypeScript types all correct
- [ ] No console warnings in dev

**Functionality**
- [ ] Login with Google works
- [ ] Data loads after login
- [ ] Custom exercises CRUD works
- [ ] Training data CRUD works
- [ ] Workouts save/load correctly
- [ ] Nutrition data syncs
- [ ] Logout clears data
- [ ] Login again restores data

**Security**
- [ ] RLS policies block unauthorized access
- [ ] User cannot see other users' data
- [ ] Auth token properly managed
- [ ] API keys not exposed

**Performance**
- [ ] Login < 3 seconds
- [ ] Data load < 2 seconds
- [ ] No unnecessary re-renders
- [ ] Smooth page navigation

**Edge Cases**
- [ ] Network disconnect handled
- [ ] Database errors show graceful messages
- [ ] Invalid sessions redirect to login
- [ ] Offline queue processes on reconnect

---

## SUCCESS CRITERIA

Migration is successful when:

✅ All tests pass
✅ No Firebase references in code
✅ RLS security policies active
✅ User data loads correctly after login
✅ Data modifications sync to Supabase
✅ App builds without errors
✅ App runs without console errors
✅ All CRUD operations work
✅ User can logout and login again
✅ Offline queue functions (if needed)

---

## Time Breakdown

| Phase | Task | Est. Time |
|-------|------|-----------|
| 1 | Setup & Dependencies | 30 min |
| 2 | Core Files (lib/) | 2-3 hrs |
| 3 | State Management | 1 hr |
| 4 | Integration | 1 hr |
| 5 | Cleanup | 15 min |
| 6 | Build & Initial Test | 30 min |
| 7 | Functionality Testing | 1-2 hrs |
| **TOTAL** | | **6-9 hours** |

**Plus:** Data migration (if needed) → additional 2-4 hours

---

## Team Communication

### For the Team:

```markdown
## Firebase to Supabase Migration - Status Update

**Timeline:** [Date] - [Date]
**Owner:** [Your name]
**Status:** [In Progress / Testing / Complete]

**What's Completed:**
- [x] Backend database setup
- [x] Auth configuration
- [x] Code updated

**Current Focus:**
- [ ] Testing phase

**Known Issues:**
- None currently

**Blockers:**
- None currently

**Next Steps:**
- Continue testing
- Deploy to staging

**Questions / Concerns:**
- [Add any outstanding items]
```

---

## Documentation

After migration, update:
- [ ] README.md - Architecture section
- [ ] docs/ARCHITECTURE.md - Supabase instead of Firebase
- [ ] docs/DATABASE.md - PostgreSQL schema reference
- [ ] docs/SETUP.md - New environment variable requirements
- [ ] docs/DEPLOYMENT.md - Supabase configuration steps

---

## Final Validation

Before marking complete:

```bash
# 1. Full build test
npm run build

# 2. Start app
npm run dev

# 3. Open DevTools → Console
# Should see NO Firebase errors

# 4. DevTools → Network
# Should see Supabase API calls, not Firebase

# 5. Login flow test
# - Click login
# - Complete G# OAuth
# - Should see user data loaded

# 6. Check database
# - Supabase console
# - View tables have user's data
# - RLS policies working
```

**Once all verified: Migration Complete! 🎉**

