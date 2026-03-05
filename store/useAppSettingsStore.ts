import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotificationSettings {
  workoutReminders: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  weeklyReport: boolean;
  recoveryAlerts: boolean;
  syncAlerts: boolean;
}

export interface AppPreferenceSettings {
  language: 'de' | 'en';
  compactMode: boolean;
  dashboardAccent: 'blue' | 'violet' | 'teal';
  calendarView: 'month' | 'week' | 'year';
  showAdvancedStats: boolean;
  showMuscleBalance: boolean;
  startPage: 'dashboard' | 'tracker' | 'calendar';
}

export interface AppSettingsPayload {
  profileName: string;
  profileBio: string;
  age: number | null;
  heightCm: number | null;
  trainingExperience: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: string;
  notifications: AppNotificationSettings;
  preferences: AppPreferenceSettings;
}

interface AppSettingsState extends AppSettingsPayload {
  setProfileName: (name: string) => void;
  setProfileBio: (bio: string) => void;
  setAge: (age: number | null) => void;
  setHeightCm: (height: number | null) => void;
  setTrainingExperience: (level: AppSettingsPayload['trainingExperience']) => void;
  setPrimaryGoal: (goal: string) => void;
  setNotifications: (settings: AppNotificationSettings) => void;
  updateNotifications: (partial: Partial<AppNotificationSettings>) => void;
  setPreferences: (settings: AppPreferenceSettings) => void;
  updatePreferences: (partial: Partial<AppPreferenceSettings>) => void;
  setAllSettings: (settings: Partial<AppSettingsPayload>) => void;
  resetSettings: () => void;
}

export const DEFAULT_APP_SETTINGS: AppSettingsPayload = {
  profileName: '',
  profileBio: '',
  age: null,
  heightCm: null,
  trainingExperience: 'beginner',
  primaryGoal: '',
  notifications: {
    workoutReminders: true,
    mealReminders: true,
    waterReminders: true,
    weeklyReport: true,
    recoveryAlerts: true,
    syncAlerts: true,
  },
  preferences: {
    language: 'de',
    compactMode: false,
    dashboardAccent: 'blue',
    calendarView: 'month',
    showAdvancedStats: true,
    showMuscleBalance: true,
    startPage: 'dashboard',
  },
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_APP_SETTINGS,

      setProfileName: (profileName) => set({ profileName }),
      setProfileBio: (profileBio) => set({ profileBio }),
      setAge: (age) => set({ age }),
      setHeightCm: (heightCm) => set({ heightCm }),
      setTrainingExperience: (trainingExperience) => set({ trainingExperience }),
      setPrimaryGoal: (primaryGoal) => set({ primaryGoal }),

      setNotifications: (notifications) => set({ notifications }),
      updateNotifications: (partial) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            ...partial,
          },
        })),

      setPreferences: (preferences) => set({ preferences }),
      updatePreferences: (partial) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...partial,
          },
        })),

      setAllSettings: (settings) =>
        set((state) => ({
          profileName: settings.profileName ?? state.profileName,
          profileBio: settings.profileBio ?? state.profileBio,
          age: settings.age ?? state.age,
          heightCm: settings.heightCm ?? state.heightCm,
          trainingExperience: settings.trainingExperience ?? state.trainingExperience,
          primaryGoal: settings.primaryGoal ?? state.primaryGoal,
          notifications: settings.notifications
            ? { ...state.notifications, ...settings.notifications }
            : state.notifications,
          preferences: settings.preferences
            ? { ...state.preferences, ...settings.preferences }
            : state.preferences,
        })),

      resetSettings: () => set({ ...DEFAULT_APP_SETTINGS }),
    }),
    {
      name: 'app-settings-storage',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);
