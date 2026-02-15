# Firebase to Supabase Migration - Quick Start Guide

## Overview
Migrating Gym App from Firebase (authentication + Firestore) to Supabase (authentication + PostgreSQL).

**Timeline:** 1-2 days of implementation + 1 day testing
**Complexity:** Medium (auth changes mostly, data operations similar)
**Risk Level:** Medium (pre-launch migration, data-critical)

---

## Pre-Migration Checklist

- [ ] Backup Firebase data
- [ ] Create Supabase project
- [ ] Generate Google OAuth credentials for Supabase
- [ ] Run `lib/supabase.sql` in Supabase SQL editor
- [ ] Update `.env.local` with Supabase credentials
- [ ] Review all changes in IMPLEMENTATION_REFERENCE.md

---

## Implementation Order (Do in this order)

### Phase 1: Setup (30 min)
1. Update `package.json` - Remove Firebase, add Supabase
2. Create Supabase database schema by running `lib/supabase.sql`
3. Configure OAuth in Supabase console
4. Update `.env.local` with Supabase credentials

### Phase 2: Core Files (2-3 hours)
1. **Enhance `lib/supabase.ts`** - Add auth functions
2. **Create `lib/database.ts`** - Copy from IMPLEMENTATION_REFERENCE.md
3. **Rewrite `store/useAuthStore.ts`** - Update to Supabase
4. **Create `app/auth/callback/page.tsx`** - OAuth callback handler

### Phase 3: Integration (1 hour)
1. **Update `components/providers/AuthProvider.tsx`** - Change imports
2. **Update `app/settings/page.tsx`** - Change imports
3. **Verify no other files import Firebase** (use grep if unsure)

### Phase 4: Cleanup (15 min)
1. **Delete `lib/firebase.ts`**
2. **Delete `lib/firestore.ts`**
3. Verify no broken imports

### Phase 5: Testing (1-2 hours)
1. Test login flow
2. Test data loading
3. Test data syncing
4. Test logout/login cycle
5. Test on multiple devices

---

## File Checklist

### ✅ NO CHANGES NEEDED
- [x] `lib/offlineQueue.ts` - Database agnostic
- [x] `store/useWorkoutStore.ts` - Zustand store (no DB calls)
- [x] `store/useNutritionStore.ts` - Zustand store (no DB calls)
- [x] `store/useBodyWeightStore.ts` - Zustand store (no DB calls)
- [x] `types/index.ts` - Type definitions
- [x] All components in `components/` (except AuthProvider)
- [x] All pages in `app/` (except settings, auth/callback)

### 🔄 CHANGES REQUIRED
- [ ] `package.json` - Update dependencies
- [ ] `lib/supabase.ts` - Enhance with auth functions
- [ ] `lib/database.ts` - CREATE NEW (replaces firestore.ts)
- [ ] `store/useAuthStore.ts` - Rewrite auth logic
- [ ] `components/providers/AuthProvider.tsx` - Update imports
- [ ] `app/settings/page.tsx` - Update imports
- [ ] `app/auth/callback/page.tsx` - CREATE NEW

### 🗑️ DELETE
- [ ] `lib/firebase.ts`
- [ ] `lib/firestore.ts`

---

## Key Code Snippets

### Replace All Instances:
```
OLD → NEW

signInWithPopup(auth, googleProvider) 
→ supabase.auth.signInWithOAuth({ provider: 'google' })

onAuthStateChanged(auth, callback)
→ supabase.auth.onAuthStateChange((event, session) => ...)

loadAllDataFromFirebase(userId)
→ loadAllDataFromSupabase(userId)

syncAllDataToFirebase(userId, stores)
→ syncAllDataToSupabase(userId, stores)
```

---

## Command Checklist

```bash
# 1. Install new dependencies
npm uninstall firebase
npm install @supabase/supabase-js@^2.38.0

# 2. Start dev server
npm run dev

# 3. Test login flow
# - Navigate to /login
# - Click Google sign-in
# - Should redirect to /auth/callback
# - Then to /dashboard

# 4. Build for production
npm run build
```

---

## Database Schema Summary

New Supabase tables:
- `users` - User profiles
- `custom_exercises` - User-defined exercises
- `training_days` - Training day templates
- `training_plans` - Multi-day training programs
- `workout_sessions` - Historical workouts
- `meals` - Meal logs
- `sleep_entries` - Sleep tracking
- `body_weight_records` - Weight tracking

All tables have RLS policies enabled (users can only see their own data).

---

## Authentication Flow (NEW)

```
1. User clicks "Sign in with Google"
   ↓
2. Supabase Auth redirects to Google OAuth
   ↓
3. User grants permissions
   ↓
4. Google redirects to: https://app.com/auth/callback
   ↓
5. Callback page verifies session
   ↓
6. Redirects to /dashboard
   ↓
7. AuthProvider initializes with Supabase session
   ↓
8. Data loads from Supabase
```

---

## Troubleshooting

### Problem: "Missing Supabase environment variables"
**Solution:** Check `.env.local` for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Problem: "Auth callback URL mismatch"
**Solution:** In Supabase console, add redirect URL:
- For dev: `http://localhost:3000/auth/callback`
- For prod: `https://yourdomain.com/auth/callback`

### Problem: Login redirects to infinite loop
**Solution:** Verify `app/auth/callback/page.tsx` exists and has correct logic

### Problem: Data doesn't load after login
**Solution:** Check browser DevTools → Network → see Supabase API calls
- Look for 401 errors (auth issue)
- Look for 403 errors (RLS permission issue)

### Problem: "Column does not exist" errors
**Solution:** Run `lib/supabase.sql` again in Supabase console

---

## Data Migration (If migrating existing data)

If you have existing Firebase data to migrate:

1. **Export from Firebase:**
   - Use Firebase Console or CLI
   - Get JSON exports of collections

2. **Transform data:**
   - Map Firestore structure to PostgreSQL schema
   - Convert IDs and timestamps

3. **Import to Supabase:**
   - Use Supabase UI for small datasets
   - Use SQL COPY command for large datasets

4. **Verify:**
   - Run SELECT queries to confirm data
   - Check record counts match

---

## Success Criteria

✅ **Login works:**
- User can sign in with Google
- Auth callback doesn't error
- User redirects to dashboard

✅ **Data works:**
- Custom exercises load/save
- Training days load/save
- Workouts load/save
- Logout clears data

✅ **No console errors:**
- No "firebase" references
- No "undefined" database calls
- No RLS permission errors

---

## Rollback Plan (If needed)

1. Keep `.env.local` backup with Firebase credentials
2. If migration fails:
   - Revert package.json to Firebase
   - Restore `.env.local` with Firebase keys
   - Revert code changes to last working commit
   - `npm install` to restore firebase package

---

## Performance Considerations

**Improvements:**
- PostgreSQL queries faster than Firestore for complex queries
- RLS handled at DB level (better security)
- Batch operations more efficient with Supabase

**Potential Issues:**
- Real-time subscriptions need to be re-implemented
- Offline sync queue behavior may differ
- Connection pooling might need tuning

---

## Post-Migration Tasks

- [ ] Monitor for errors in production
- [ ] Test on real user data
- [ ] Performance test with load testing
- [ ] Update documentation
- [ ] Train team on new architecture
- [ ] Schedule Firebase cleanup (if any data remains)

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Auth Docs:** https://supabase.com/docs/guides/auth
- **PostgreSQL Guide:** https://supabase.com/docs/guides/database
- **Migration Helper:** https://supabase.com/docs/guides/migrations

---

## Questions?

If you encounter issues during migration:
1. Check IMPLEMENTATION_REFERENCE.md for specific code changes
2. Review MIGRATION_PLAN.md for architecture details
3. Check Supabase documentation
4. Test in development before production

**Good luck with the migration!**

