import { create } from 'zustand';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
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
  
  initializeAuth: (onDataLoaded) => {
    let mounted = true;

    const initializeUser = async (session: Session | null) => {
      try {
        if (session?.user) {
          const user: User = {
            uid: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.name || 'User',
            photoURL: session.user.user_metadata?.avatar_url,
            hasCompletedOnboarding: session.user.user_metadata?.hasCompletedOnboarding || false,
            createdAt: new Date(session.user.created_at),
          };

          if (mounted) {
            set({ user, loading: false });
            
            // Load user data
            if (onDataLoaded) {
              try {
                // Fetch workout and nutrition data
                const [workoutData, nutritionData] = await Promise.all([
                  supabase.from('workout_sessions').select('*').eq('user_id', session.user.id),
                  supabase.from('meals').select('*').eq('user_id', session.user.id),
                ]);

                onDataLoaded({
                  workoutSessions: workoutData.data || [],
                  meals: nutritionData.data || [],
                });
              } catch (error) {
                console.error('Error loading user data:', error);
              }
            }
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
  
  syncData: async (workoutStore, nutritionStore) => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ syncing: true });
      
      // Sync would happen automatically through Zustand persistence
      // and direct Supabase updates, but you can add batch syncs here if needed
      
      console.log('Data synced successfully');
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    } finally {
      set({ syncing: false });
    }
  },
}));
