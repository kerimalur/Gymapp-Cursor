import { create } from 'zustand';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { saveAllData } from '@/lib/supabaseSync';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => () => void;
  syncData: (workoutStore: any, nutritionStore: any, bodyWeightStore?: any) => Promise<void>;
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ user: null });
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('workout-storage');
        localStorage.removeItem('nutrition-storage');
        localStorage.removeItem('body-weight-storage');
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  initializeAuth: () => {
    let mounted = true;

    const initializeUser = async (session: Session | null) => {
      try {
        if (session?.user) {
          const user: User = {
            uid: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'User',
            photoURL: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            hasCompletedOnboarding: session.user.user_metadata?.hasCompletedOnboarding || false,
            createdAt: new Date(session.user.created_at),
          };

          if (mounted) {
            set({ user, loading: false });
          }
        } else {
          if (mounted) {
            set({ user: null, loading: false });
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        if (mounted) {
          set({ loading: false });
        }
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      initializeUser(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      initializeUser(session);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  },
  
  syncData: async (workoutStore, nutritionStore, bodyWeightStore) => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ syncing: true });
      
      await saveAllData(
        user.uid,
        {
          customExercises: workoutStore.customExercises || [],
          trainingDays: workoutStore.trainingDays || [],
          trainingPlans: workoutStore.trainingPlans || [],
          workoutSessions: workoutStore.workoutSessions || [],
        },
        {
          meals: nutritionStore.meals || [],
          nutritionGoals: nutritionStore.nutritionGoals,
          supplements: nutritionStore.supplements || [],
          trackedMeals: nutritionStore.trackedMeals || [],
          mealTemplates: nutritionStore.mealTemplates || [],
          customFoods: nutritionStore.customFoods || [],
          supplementPresets: nutritionStore.supplementPresets || [],
          sleepEntries: nutritionStore.sleepEntries || [],
          trackingSettings: nutritionStore.trackingSettings,
        },
        bodyWeightStore ? {
          entries: bodyWeightStore.entries || [],
          goal: bodyWeightStore.goal,
        } : {}
      );

      console.log('Data synced successfully');
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    } finally {
      set({ syncing: false });
    }
  },
}));
