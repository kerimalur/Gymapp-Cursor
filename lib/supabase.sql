-- SQL Schemas für Supabase Migration von Gymapp

-- 1. Exercises (Standard Exercises)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  primary_muscles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  secondary_muscles TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Custom Exercises (User-defined exercises)
CREATE TABLE IF NOT EXISTS custom_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  primary_muscles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  secondary_muscles TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- 3. Training Days
CREATE TABLE IF NOT EXISTS training_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Training Day Exercises (Junction Table)
CREATE TABLE IF NOT EXISTS training_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
  exercise_id UUID,
  custom_exercise_id UUID,
  exercise_order INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_one_exercise CHECK (
    (exercise_id IS NOT NULL AND custom_exercise_id IS NULL) OR 
    (exercise_id IS NULL AND custom_exercise_id IS NOT NULL)
  ),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL,
  FOREIGN KEY (custom_exercise_id) REFERENCES custom_exercises(id) ON DELETE SET NULL
);

-- 5. Training Plans
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sessions_per_week INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  current_day_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, is_active) WHERE is_active = TRUE
);

-- 6. Training Plan Days (Junction Table for order)
CREATE TABLE IF NOT EXISTS training_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  training_day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(training_plan_id, sequence_order)
);

-- 7. Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_day_id UUID REFERENCES training_days(id) ON DELETE SET NULL,
  training_day_name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_volume_kg DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Workout Exercises (Exercises within a session)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID,
  custom_exercise_id UUID,
  exercise_order INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_one_workout_exercise CHECK (
    (exercise_id IS NOT NULL AND custom_exercise_id IS NULL) OR 
    (exercise_id IS NULL AND custom_exercise_id IS NOT NULL)
  ),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL,
  FOREIGN KEY (custom_exercise_id) REFERENCES custom_exercises(id) ON DELETE SET NULL
);

-- 9. Exercise Sets (Individual sets within a workout exercise)
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight_kg DECIMAL(10, 2) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  rir INTEGER, -- Reps in Reserve
  ghost_weight_kg DECIMAL(10, 2), -- Previous workout data
  ghost_reps INTEGER, -- Previous workout data
  is_warmup BOOLEAN DEFAULT FALSE,
  is_assisted BOOLEAN DEFAULT FALSE,
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Meals
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack
  total_calories DECIMAL(10, 2),
  total_protein DECIMAL(10, 2),
  total_carbs DECIMAL(10, 2),
  total_fats DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Meal Items
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  calories DECIMAL(10, 2),
  protein DECIMAL(10, 2),
  carbs DECIMAL(10, 2),
  fats DECIMAL(10, 2),
  item_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Body Weight Records
CREATE TABLE IF NOT EXISTS body_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(10, 2) NOT NULL,
  recorded_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recorded_date)
);

-- 13. Scheduled Workouts
CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  training_day_id UUID REFERENCES training_days(id) ON DELETE SET NULL,
  training_day_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_custom_exercises_user_id ON custom_exercises(user_id);
CREATE INDEX idx_training_days_user_id ON training_days(user_id);
CREATE INDEX idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(user_id, start_time);
CREATE INDEX idx_meals_user_id_date ON meals(user_id, meal_date);
CREATE INDEX idx_body_weight_user_id ON body_weight_records(user_id, recorded_date);
CREATE INDEX idx_scheduled_workouts_user_date ON scheduled_workouts(user_id, scheduled_date);

-- Row Level Security (RLS) Policies
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;

-- Policies for custom_exercises
CREATE POLICY "Users can view their own custom exercises"
  ON custom_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom exercises"
  ON custom_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom exercises"
  ON custom_exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom exercises"
  ON custom_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Similar patterns for other tables (training_days, training_plans, workout_sessions, meals, etc.)
-- Apply the same RLS pattern to all user-related tables

-- Policies for training_days
CREATE POLICY "Users can view their own training days"
  ON training_days FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training days"
  ON training_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training days"
  ON training_days FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training days"
  ON training_days FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for training_plans
CREATE POLICY "Users can view their own training plans"
  ON training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training plans"
  ON training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training plans"
  ON training_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training plans"
  ON training_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for workout_sessions
CREATE POLICY "Users can view their own workout sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions"
  ON workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions"
  ON workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for meals
CREATE POLICY "Users can view their own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON meals FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for body_weight_records
CREATE POLICY "Users can view their own body weight records"
  ON body_weight_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body weight records"
  ON body_weight_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body weight records"
  ON body_weight_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body weight records"
  ON body_weight_records FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for scheduled_workouts
CREATE POLICY "Users can view their own scheduled workouts"
  ON scheduled_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled workouts"
  ON scheduled_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled workouts"
  ON scheduled_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled workouts"
  ON scheduled_workouts FOR DELETE
  USING (auth.uid() = user_id);
