import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { Exercise, TrainingDay, WorkoutSession, TrainingPlan } from '@/types';

interface RestTimer {
  isActive: boolean;
  seconds: number;
  targetSeconds: number;
  startedAt: number | null;
}

interface WorkoutSettings {
  defaultRestTime: number; // in seconds (default: 90)
  autoStartRestTimer: boolean; // auto-start after completing set
  restTimerSound: boolean; // play sound when timer ends
}

interface WorkoutState {
  exercises: Exercise[];
  customExercises: Exercise[];
  trainingDays: TrainingDay[];
  trainingPlans: TrainingPlan[];
  workoutSessions: WorkoutSession[];
  currentWorkout: WorkoutSession | null;

  // Rest Timer State
  restTimer: RestTimer;
  workoutSettings: WorkoutSettings;

  setExercises: (exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  setCustomExercises: (exercises: Exercise[]) => void;
  addCustomExercise: (exercise: Exercise) => void;
  updateCustomExercise: (exercise: Exercise) => void;
  deleteCustomExercise: (exerciseId: string) => void;
  setTrainingDays: (days: TrainingDay[]) => void;
  addTrainingDay: (day: TrainingDay) => void;
  updateTrainingDay: (day: TrainingDay) => void;
  deleteTrainingDay: (dayId: string) => void;
  setTrainingPlans: (plans: TrainingPlan[]) => void;
  addTrainingPlan: (plan: TrainingPlan) => void;
  updateTrainingPlan: (plan: TrainingPlan) => void;
  deleteTrainingPlan: (planId: string) => void;
  setActiveTrainingPlan: (planId: string) => void;
  advanceToNextDay: (planId: string) => void;
  setWorkoutSessions: (sessions: WorkoutSession[]) => void;
  addWorkoutSession: (session: WorkoutSession) => void;
  updateWorkoutSession: (session: WorkoutSession) => void;
  deleteWorkoutSession: (sessionId: string) => void;
  setCurrentWorkout: (workout: WorkoutSession | null) => void;

  // Rest Timer Actions
  startRestTimer: (seconds?: number) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
  updateWorkoutSettings: (settings: Partial<WorkoutSettings>) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      exercises: [],
      customExercises: [],
      trainingDays: [],
      trainingPlans: [],
      workoutSessions: [],
      currentWorkout: null,

      // Rest Timer Initial State
      restTimer: {
        isActive: false,
        seconds: 0,
        targetSeconds: 90,
        startedAt: null,
      },

      // Workout Settings Initial State
      workoutSettings: {
        defaultRestTime: 90,
        autoStartRestTimer: true,
        restTimerSound: true,
      },
      setExercises: (exercises) => set({ exercises }),
      addExercise: (exercise) => set((state) => ({ exercises: [...state.exercises, exercise] })),
      setCustomExercises: (customExercises) => set({ customExercises }),
      addCustomExercise: (exercise) => set((state) => ({ 
        customExercises: [...state.customExercises, { ...exercise, isCustom: true }] 
      })),
      updateCustomExercise: (exercise) => set((state) => ({
        customExercises: state.customExercises.map(e => e.id === exercise.id ? exercise : e)
      })),
      deleteCustomExercise: (exerciseId) => set((state) => ({
        customExercises: state.customExercises.filter(e => e.id !== exerciseId)
      })),
      setTrainingDays: (trainingDays) => set({ trainingDays }),
      addTrainingDay: (day) => set((state) => ({ trainingDays: [...state.trainingDays, day] })),
      updateTrainingDay: (day) => set((state) => ({
        trainingDays: state.trainingDays.map(d => d.id === day.id ? day : d)
      })),
      deleteTrainingDay: (dayId) => set((state) => ({
        trainingDays: state.trainingDays.filter(d => d.id !== dayId)
      })),
      setTrainingPlans: (trainingPlans) => set({ trainingPlans }),
      addTrainingPlan: (plan) => set((state) => ({ 
        trainingPlans: [...state.trainingPlans, plan] 
      })),
      updateTrainingPlan: (plan) => set((state) => ({
        trainingPlans: state.trainingPlans.map(p => p.id === plan.id ? plan : p)
      })),
      deleteTrainingPlan: (planId) => set((state) => ({
        trainingPlans: state.trainingPlans.filter(p => p.id !== planId)
      })),
      setActiveTrainingPlan: (planId) => set((state) => ({
        trainingPlans: state.trainingPlans.map(p => ({
          ...p,
          isActive: p.id === planId
        }))
      })),
      advanceToNextDay: (planId) => set((state) => ({
        trainingPlans: state.trainingPlans.map(p => {
          if (p.id !== planId) return p;
          const nextIndex = (p.currentDayIndex + 1) % p.trainingDays.length;
          return { ...p, currentDayIndex: nextIndex };
        })
      })),
      setWorkoutSessions: (workoutSessions) => set({ workoutSessions }),
      addWorkoutSession: (session) => set((state) => ({ workoutSessions: [...state.workoutSessions, session] })),
      updateWorkoutSession: (session) => set((state) => ({
        workoutSessions: state.workoutSessions.map(s => s.id === session.id ? session : s)
      })),
      deleteWorkoutSession: (sessionId) => set((state) => ({
        workoutSessions: state.workoutSessions.filter(s => s.id !== sessionId)
      })),
      setCurrentWorkout: (currentWorkout) => set({ currentWorkout }),

      // Rest Timer Actions
      startRestTimer: (seconds) => set((state) => ({
        restTimer: {
          isActive: true,
          seconds: seconds ?? state.workoutSettings.defaultRestTime,
          targetSeconds: seconds ?? state.workoutSettings.defaultRestTime,
          startedAt: Date.now(),
        }
      })),

      pauseRestTimer: () => set((state) => ({
        restTimer: {
          ...state.restTimer,
          isActive: false,
        }
      })),

      resumeRestTimer: () => set((state) => ({
        restTimer: {
          ...state.restTimer,
          isActive: true,
          startedAt: Date.now(),
        }
      })),

      stopRestTimer: () => set({
        restTimer: {
          isActive: false,
          seconds: 0,
          targetSeconds: 90,
          startedAt: null,
        }
      }),

      tickRestTimer: () => set((state) => {
        if (!state.restTimer.isActive || state.restTimer.seconds <= 0) {
          return state;
        }

        const newSeconds = state.restTimer.seconds - 1;

        // Play sound when timer reaches 0
        if (newSeconds === 0 && state.workoutSettings.restTimerSound) {
          // Sound will be played in the component
        }

        return {
          restTimer: {
            ...state.restTimer,
            seconds: newSeconds,
            isActive: newSeconds > 0,
          }
        };
      }),

      updateWorkoutSettings: (settings) => set((state) => ({
        workoutSettings: {
          ...state.workoutSettings,
          ...settings,
        }
      })),
    }),
    {
      name: 'workout-storage',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Convert date strings back to Date objects
          if (parsed.state.workoutSessions) {
            parsed.state.workoutSessions = parsed.state.workoutSessions.map((session: any) => ({
              ...session,
              startTime: session.startTime ? new Date(session.startTime) : new Date(),
              endTime: session.endTime ? new Date(session.endTime) : undefined,
            }));
          }
          if (parsed.state.trainingDays) {
            parsed.state.trainingDays = parsed.state.trainingDays.map((day: any) => ({
              ...day,
              createdAt: day.createdAt ? new Date(day.createdAt) : new Date(),
              updatedAt: day.updatedAt ? new Date(day.updatedAt) : new Date(),
            }));
          }
          return parsed;
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
