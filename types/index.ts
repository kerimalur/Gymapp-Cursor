// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  hasCompletedOnboarding?: boolean;
  createdAt: Date;
}

// Muscle involvement types for exercises
export interface MuscleInvolvement {
  muscle: MuscleGroup;
  role: 'primary' | 'secondary';  // Primary = full recovery needed, Secondary = reduced recovery
}

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];  // Keep for backward compatibility
  muscles?: MuscleInvolvement[];  // New detailed muscle involvement
  category: ExerciseCategory;
  description?: string;
  isCustom?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'traps'
  | 'lats'
  | 'adductors'
  | 'abductors'
  | 'lower_back'
  | 'neck';

export type ExerciseCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'other';

// Workout Types
export interface WorkoutExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
  rir?: number; // Reps in Reserve
  ghostWeight?: number; // Previous workout data
  ghostReps?: number; // Previous workout data
  isWarmup?: boolean; // Warm-up set (not counted in volume)
  isAssisted?: boolean; // Assisted exercise (negative weight = assistance)
}

export interface TrainingDay {
  id: string;
  userId: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  sessionsPerWeek: number;
  trainingDays: string[]; // IDs of TrainingDay
  isActive: boolean;
  currentDayIndex: number; // Index des nächsten Trainingstags
  createdAt: Date;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  trainingDayId: string;
  trainingDayName: string;
  exercises: WorkoutExercise[];
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  totalVolume: number; // total kg lifted
  notes?: string;
}

// Recovery Types
export interface MuscleRecovery {
  muscleGroup: MuscleGroup;
  recoveryPercentage: number; // 0-100
  lastTrainedAt?: Date;
  expectedFullRecovery?: Date;
}

export interface TrainingDayRecovery {
  trainingDayId: string;
  trainingDayName: string;
  averageRecovery: number; // 0-100
  muscleRecoveries: MuscleRecovery[];
}

// Calendar Types
export interface ScheduledWorkout {
  id: string;
  userId: string;
  date: Date;
  trainingDayId?: string;
  trainingDayName?: string;
  type: 'planned';
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  type: 'planned' | 'completed';
  workoutSession?: WorkoutSession;
  scheduledWorkout?: ScheduledWorkout;
  notes?: string;
}

// Nutrition Types
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
  servingUnit: string;
  category: FoodCategory;
  isCustom?: boolean;
}

export type FoodCategory =
  | 'meat'
  | 'fish'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'dairy'
  | 'snacks'
  | 'drinks'
  | 'supplements'
  | 'other';

export interface MealItem {
  foodId: string;
  foodName: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  userId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  notes?: string;
}

export interface SavedMeal {
  id: string;
  userId: string;
  name: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface NutritionGoals {
  userId: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  waterGoal: number; // in ml
  caffeineGoal: number; // in mg
}

export interface DailyTracking {
  userId: string;
  date: Date;
  waterIntake: number; // in ml
  caffeineIntake: number; // in mg
  supplementsTaken: string[];
}

export interface Supplement {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  timing: string;
  isActive: boolean;
  taken?: boolean;
}

// Statistics Types
export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  sessions: {
    date: Date;
    maxWeight: number;
    totalVolume: number;
    bestSet: ExerciseSet;
  }[];
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  totalVolume: number;
  sessionCount: number;
  lastTrained?: Date;
}

// Settings Types
export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark';
  language: 'de' | 'en';
  notifications: boolean;
  recoveryTimeDefaults: {
    [key in MuscleGroup]: number; // recovery time in hours
  };
}
