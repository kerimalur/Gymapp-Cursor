import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Exercise, ExerciseCategory, MuscleGroup, MuscleInvolvement } from '@/types';

export interface ExerciseMuscleMap {
  id: string;
  exercise_id: string;
  muscle_group_id: string;
  role: 'primary' | 'secondary' | string | null;
  sort_order: number | null;
  muscle_group: {
    id: string;
    name?: string | null;
    key?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface ExerciseWithMuscleMaps {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
  is_custom: boolean;
  created_by_user_id: string | null;
  muscle_maps: ExerciseMuscleMap[];
  [key: string]: unknown;
}

export interface CreateCustomExerciseInput {
  name: string;
  category: string;
  description?: string;
  createdByUserId: string;
  muscleMaps: Array<{
    muscleGroupId: string;
    role?: 'primary' | 'secondary' | string;
    sortOrder?: number;
  }>;
}

const MUSCLE_GROUP_VALUES: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quadriceps',
  'hamstrings',
  'calves',
  'glutes',
  'traps',
  'lats',
  'adductors',
  'abductors',
  'lower_back',
  'neck',
];

const EXERCISE_CATEGORY_VALUES: ExerciseCategory[] = [
  'push',
  'pull',
  'legs',
  'core',
  'cardio',
  'other',
];

function throwSupabaseError(error: PostgrestError | null, fallback: string): never {
  throw new Error(error?.message ?? fallback);
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function toMuscleGroup(value: unknown): MuscleGroup | null {
  if (typeof value !== 'string') return null;
  const normalized = normalizeKey(value);
  if (MUSCLE_GROUP_VALUES.includes(normalized as MuscleGroup)) {
    return normalized as MuscleGroup;
  }
  return null;
}

function toExerciseCategory(value: unknown): ExerciseCategory {
  if (typeof value !== 'string') return 'other';
  const normalized = normalizeKey(value);
  if (EXERCISE_CATEGORY_VALUES.includes(normalized as ExerciseCategory)) {
    return normalized as ExerciseCategory;
  }
  return 'other';
}

export function mapDbExerciseToExercise(exercise: ExerciseWithMuscleMaps): Exercise {
  const sortedMaps = [...(exercise.muscle_maps ?? [])].sort((a, b) => {
    const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  const muscles: MuscleInvolvement[] = [];
  for (const map of sortedMaps) {
    const rawMuscle =
      map.muscle_group?.key ??
      map.muscle_group?.name ??
      map.muscle_group_id;
    const muscle = toMuscleGroup(rawMuscle);
    if (!muscle) continue;

    const role = `${map.role ?? ''}`.toLowerCase() === 'secondary' ? 'secondary' : 'primary';
    muscles.push({ muscle, role });
  }

  const muscleGroups = [...new Set(muscles.map((muscle) => muscle.muscle))];

  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroups,
    muscles: muscles.length > 0 ? muscles : undefined,
    category: toExerciseCategory(exercise.category),
    description: exercise.description ?? undefined,
    isCustom: !!exercise.is_custom,
  };
}

export function mapDbExercisesToExercises(exercises: ExerciseWithMuscleMaps[]): Exercise[] {
  return exercises.map(mapDbExerciseToExercise);
}

export async function getExercises(): Promise<ExerciseWithMuscleMaps[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      muscle_maps:exercise_muscle_maps(
        *,
        muscle_group:muscle_groups(*)
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throwSupabaseError(error, 'Failed to fetch exercises');
  }

  return (data ?? []) as ExerciseWithMuscleMaps[];
}

export async function getExercisesForApp(): Promise<Exercise[]> {
  const exercises = await getExercises();
  return mapDbExercisesToExercises(exercises);
}

export async function getExerciseById(id: string): Promise<ExerciseWithMuscleMaps | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      muscle_maps:exercise_muscle_maps(
        *,
        muscle_group:muscle_groups(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throwSupabaseError(error, `Failed to fetch exercise ${id}`);
  }

  return data as ExerciseWithMuscleMaps;
}

export async function createCustomExercise(input: CreateCustomExerciseInput): Promise<ExerciseWithMuscleMaps> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Exercise name is required');
  }
  if (!input.createdByUserId) {
    throw new Error('createdByUserId is required');
  }
  if (input.muscleMaps.length === 0) {
    throw new Error('At least one muscle map is required');
  }

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .insert({
      name,
      category: input.category,
      description: input.description?.trim() || null,
      created_by_user_id: input.createdByUserId,
      is_custom: true,
      is_active: true,
    })
    .select('*')
    .single();

  if (exerciseError) {
    throwSupabaseError(exerciseError, 'Failed to create custom exercise');
  }

  const exerciseId = (exercise as { id?: string } | null)?.id;
  if (!exerciseId) {
    throw new Error('Failed to create custom exercise: missing id');
  }

  const mapRows = input.muscleMaps.map((map, index) => ({
    exercise_id: exerciseId,
    muscle_group_id: map.muscleGroupId,
    role: map.role ?? null,
    sort_order: map.sortOrder ?? index,
  }));

  const { error: mapError } = await supabase
    .from('exercise_muscle_maps')
    .insert(mapRows);

  if (mapError) {
    throwSupabaseError(mapError, 'Failed to create exercise muscle mappings');
  }

  const createdExercise = await getExerciseById(exerciseId);
  if (!createdExercise) {
    throw new Error('Exercise created but could not be reloaded');
  }

  return createdExercise;
}
