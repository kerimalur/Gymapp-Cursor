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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  updateProfile: (updates: { displayName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => () => void;
  syncData: (workoutStore: any, nutritionStore: any, bodyWeightStore?: any, settingsData?: any) => Promise<void>;
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
  
  signInWithEmail: async (email, password) => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      set({ loading: false });
      throw error;
    }
  },

  signUpWithEmail: async (email, password) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (!data.session) {
        set({ loading: false });
      }

      return {
        needsEmailConfirmation: !data.session,
      };
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      set({ loading: false });
      throw error;
    }
  },

  updateProfile: async ({ displayName }) => {
    try {
      const metadata: Record<string, any> = {};
      if (displayName !== undefined) {
        metadata.name = displayName;
        metadata.full_name = displayName;
      }

      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (error) throw error;

      if (displayName !== undefined) {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              displayName: displayName || currentUser.displayName,
            },
          });
        } else if (data.user) {
          set({
            user: {
              uid: data.user.id,
              email: data.user.email || '',
              displayName:
                data.user.user_metadata?.name ||
                data.user.user_metadata?.full_name ||
                'User',
              photoURL: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
              hasCompletedOnboarding: data.user.user_metadata?.hasCompletedOnboarding || false,
              createdAt: new Date(data.user.created_at),
            },
            loading: false,
          });
        }
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
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
        localStorage.removeItem('app-settings-storage');
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
  
  syncData: async (workoutStore, nutritionStore, bodyWeightStore, settingsData) => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ syncing: true });
      
      await saveAllData(
        user.uid,
        {
          exercises: workoutStore.exercises || [],
          customExercises: workoutStore.customExercises || [],
          trainingDays: workoutStore.trainingDays || [],
          trainingPlans: workoutStore.trainingPlans || [],
          workoutSessions: workoutStore.workoutSessions || [],
          workoutSettings: workoutStore.workoutSettings,
        },
        {
          foodItems: nutritionStore.foodItems || [],
          meals: nutritionStore.meals || [],
          savedMeals: nutritionStore.savedMeals || [],
          nutritionGoals: nutritionStore.nutritionGoals,
          dailyTracking: nutritionStore.dailyTracking,
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
        } : {},
        settingsData || {}
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
