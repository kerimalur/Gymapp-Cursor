import { create } from 'zustand';
import { User } from '@/types';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { saveUserData, getUserData, loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';

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
  
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
      // Clear local storage
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        let userData = await getUserData(firebaseUser.uid);
        
        if (!userData) {
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
        
        // Load user data from Firestore
        if (onDataLoaded) {
          try {
            const data = await loadAllDataFromFirebase(firebaseUser.uid);
            onDataLoaded(data);
          } catch (error) {
            console.error('Error loading data from Firebase:', error);
          }
        }
      } else {
        set({ user: null, loading: false });
      }
    });
    
    return unsubscribe;
  },
  
  syncData: async (workoutStore, nutritionStore) => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ syncing: true });
      await syncAllDataToFirebase(user.uid, workoutStore, nutritionStore);
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    } finally {
      set({ syncing: false });
    }
  },
}));
