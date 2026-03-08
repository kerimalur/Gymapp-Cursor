-- GymApp v1 schema migration for Supabase/Postgres
-- Principles:
-- 1) raw training/nutrition logs are the source of truth
-- 2) progress/recovery/recommendation tables are derived read models
-- 3) RLS is enabled on all user-owned tables

begin;

create extension if not exists pgcrypto;

-- =========================================================
-- Helper functions
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    training_experience_level,
    preferred_unit_system,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'user'),
    'beginner',
    'metric',
    false
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (
    user_id,
    available_training_days_per_week,
    reminder_enabled,
    recovery_inputs_enabled,
    nutrition_tracking_depth
  )
  values (
    new.id,
    3,
    true,
    false,
    'basic'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- =========================================================
-- Core user tables
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  age integer,
  sex text,
  height_cm numeric(5,2),
  start_weight_kg numeric(6,2),
  training_experience_level text not null default 'beginner',
  preferred_unit_system text not null default 'metric',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_age_check check (age is null or (age >= 13 and age <= 120)),
  constraint profiles_sex_check check (sex is null or sex in ('male', 'female', 'other', 'prefer_not_to_say')),
  constraint profiles_training_experience_level_check check (training_experience_level in ('beginner', 'intermediate', 'advanced')),
  constraint profiles_preferred_unit_system_check check (preferred_unit_system in ('metric', 'imperial'))
);

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_type text not null,
  custom_goal_text text,
  priority_upper_body smallint not null default 3,
  priority_lower_body smallint not null default 3,
  priority_strength smallint not null default 3,
  priority_hypertrophy smallint not null default 3,
  priority_health smallint not null default 3,
  target_weight_kg numeric(6,2),
  weekly_target_rate_kg numeric(5,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_goals_goal_type_check check (goal_type in ('build', 'cut', 'maintain', 'performance', 'custom')),
  constraint user_goals_priority_upper_body_check check (priority_upper_body between 1 and 5),
  constraint user_goals_priority_lower_body_check check (priority_lower_body between 1 and 5),
  constraint user_goals_priority_strength_check check (priority_strength between 1 and 5),
  constraint user_goals_priority_hypertrophy_check check (priority_hypertrophy between 1 and 5),
  constraint user_goals_priority_health_check check (priority_health between 1 and 5)
);

create unique index if not exists ux_user_goals_one_active_per_user
  on public.user_goals(user_id)
  where is_active = true;

create index if not exists idx_user_goals_user_id
  on public.user_goals(user_id);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  available_training_days_per_week smallint not null default 3,
  preferred_split_type text,
  workout_duration_target_min smallint,
  reminder_enabled boolean not null default true,
  recovery_inputs_enabled boolean not null default false,
  nutrition_tracking_depth text not null default 'basic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_available_training_days_check check (available_training_days_per_week between 1 and 7),
  constraint user_preferences_nutrition_tracking_depth_check check (nutrition_tracking_depth in ('basic', 'standard', 'advanced'))
);

-- =========================================================
-- Master data
-- =========================================================

create table if not exists public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  region text not null,
  is_primary_group boolean not null default true,
  created_at timestamptz not null default now(),
  constraint muscle_groups_region_check check (region in ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'neck'))
);

create index if not exists idx_muscle_groups_region
  on public.muscle_groups(region);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  equipment_type text,
  exercise_category text not null,
  movement_pattern text,
  is_unilateral boolean not null default false,
  is_custom boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_category_check check (exercise_category in ('compound', 'isolation', 'machine', 'bodyweight', 'cardio', 'mobility', 'other'))
);

create unique index if not exists ux_exercises_system_slug
  on public.exercises(slug)
  where created_by_user_id is null;

create unique index if not exists ux_exercises_user_slug
  on public.exercises(created_by_user_id, slug);

create index if not exists idx_exercises_is_active
  on public.exercises(is_active);

create index if not exists idx_exercises_category
  on public.exercises(exercise_category);

create table if not exists public.exercise_muscle_maps (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups(id) on delete cascade,
  involvement_role text not null,
  contribution_weight numeric(5,4) not null,
  created_at timestamptz not null default now(),
  constraint exercise_muscle_maps_unique unique (exercise_id, muscle_group_id),
  constraint exercise_muscle_maps_involvement_role_check check (involvement_role in ('primary', 'secondary', 'stabilizer')),
  constraint exercise_muscle_maps_contribution_weight_check check (contribution_weight > 0 and contribution_weight <= 1)
);

create index if not exists idx_exercise_muscle_maps_muscle_group_id
  on public.exercise_muscle_maps(muscle_group_id);

-- =========================================================
-- Planning
-- =========================================================

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  goal_context text,
  split_type text,
  status text not null default 'draft',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_plans_status_check check (status in ('draft', 'active', 'archived'))
);

create index if not exists idx_workout_plans_user_id
  on public.workout_plans(user_id);

create index if not exists idx_workout_plans_user_status
  on public.workout_plans(user_id, status);

create unique index if not exists ux_workout_plans_one_active_per_user
  on public.workout_plans(user_id)
  where status = 'active';

create table if not exists public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  day_type_label text,
  order_index smallint not null,
  target_muscle_focus text[],
  is_rest_day boolean not null default false,
  created_at timestamptz not null default now(),
  constraint workout_plan_days_unique unique (workout_plan_id, order_index)
);

create index if not exists idx_workout_plan_days_plan_id
  on public.workout_plan_days(workout_plan_id);

create table if not exists public.workout_plan_day_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_day_id uuid not null references public.workout_plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index smallint not null,
  target_sets smallint not null default 2,
  rep_range_min smallint not null default 8,
  rep_range_max smallint not null default 12,
  target_rir_min smallint,
  target_rir_max smallint,
  notes text,
  created_at timestamptz not null default now(),
  constraint workout_plan_day_exercises_unique unique (workout_plan_day_id, order_index),
  constraint workout_plan_day_exercises_rep_range_check check (rep_range_min <= rep_range_max),
  constraint workout_plan_day_exercises_target_sets_check check (target_sets >= 0),
  constraint workout_plan_day_exercises_target_rir_min_check check (target_rir_min is null or (target_rir_min between 0 and 5)),
  constraint workout_plan_day_exercises_target_rir_max_check check (target_rir_max is null or (target_rir_max between 0 and 5)),
  constraint workout_plan_day_exercises_target_rir_order_check check (
    target_rir_min is null or target_rir_max is null or target_rir_min <= target_rir_max
  )
);

create index if not exists idx_workout_plan_day_exercises_exercise_id
  on public.workout_plan_day_exercises(exercise_id);

-- =========================================================
-- Execution & tracking
-- =========================================================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_plan_id uuid references public.workout_plans(id) on delete set null,
  workout_plan_day_id uuid references public.workout_plan_days(id) on delete set null,
  session_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_min integer,
  perceived_readiness smallint,
  perceived_fatigue smallint,
  session_status text not null default 'in_progress',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_perceived_readiness_check check (perceived_readiness is null or perceived_readiness between 1 and 5),
  constraint workout_sessions_perceived_fatigue_check check (perceived_fatigue is null or perceived_fatigue between 1 and 5),
  constraint workout_sessions_status_check check (session_status in ('planned', 'in_progress', 'completed', 'skipped')),
  constraint workout_sessions_duration_min_check check (duration_min is null or duration_min >= 0),
  constraint workout_sessions_ended_after_started_check check (ended_at is null or ended_at >= started_at)
);

create index if not exists idx_workout_sessions_user_started_at_desc
  on public.workout_sessions(user_id, started_at desc);

create index if not exists idx_workout_sessions_user_status
  on public.workout_sessions(user_id, session_status);

create index if not exists idx_workout_sessions_plan_day_id
  on public.workout_sessions(workout_plan_day_id);

create table if not exists public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  source_plan_exercise_id uuid references public.workout_plan_day_exercises(id) on delete set null,
  order_index smallint not null,
  exercise_notes text,
  created_at timestamptz not null default now(),
  constraint workout_session_exercises_unique unique (workout_session_id, order_index)
);

create index if not exists idx_workout_session_exercises_exercise_id
  on public.workout_session_exercises(exercise_id);

create index if not exists idx_workout_session_exercises_session_id
  on public.workout_session_exercises(workout_session_id);

create table if not exists public.set_entries (
  id uuid primary key default gen_random_uuid(),
  workout_session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  set_number smallint not null,
  reps smallint not null,
  weight numeric(8,2),
  weight_unit text not null default 'kg',
  rir numeric(3,1),
  rpe numeric(3,1),
  tempo text,
  is_warmup boolean not null default false,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint set_entries_unique unique (workout_session_exercise_id, set_number),
  constraint set_entries_reps_check check (reps >= 0),
  constraint set_entries_weight_check check (weight is null or weight >= 0),
  constraint set_entries_weight_unit_check check (weight_unit in ('kg', 'lb')),
  constraint set_entries_rir_check check (rir is null or (rir >= 0 and rir <= 5)),
  constraint set_entries_rpe_check check (rpe is null or (rpe >= 1 and rpe <= 10))
);

create index if not exists idx_set_entries_completed_at
  on public.set_entries(completed_at);

create table if not exists public.session_notes (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  note_type text not null default 'general',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_session_notes_session_id
  on public.session_notes(workout_session_id);

-- =========================================================
-- Nutrition & body metrics
-- =========================================================

create table if not exists public.nutrition_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  calorie_target integer,
  calories_total integer not null default 0,
  protein_g numeric(7,2) not null default 0,
  carbs_g numeric(7,2) not null default 0,
  fat_g numeric(7,2) not null default 0,
  compliance_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_days_unique unique (user_id, entry_date),
  constraint nutrition_days_calorie_target_check check (calorie_target is null or calorie_target >= 0),
  constraint nutrition_days_calories_total_check check (calories_total >= 0),
  constraint nutrition_days_protein_check check (protein_g >= 0),
  constraint nutrition_days_carbs_check check (carbs_g >= 0),
  constraint nutrition_days_fat_check check (fat_g >= 0)
);

create index if not exists idx_nutrition_days_user_id
  on public.nutrition_days(user_id);

create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  nutrition_day_id uuid not null references public.nutrition_days(id) on delete cascade,
  name text not null,
  meal_type text,
  calories integer not null default 0,
  protein_g numeric(7,2) not null default 0,
  carbs_g numeric(7,2) not null default 0,
  fat_g numeric(7,2) not null default 0,
  source_type text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint meal_entries_calories_check check (calories >= 0),
  constraint meal_entries_protein_check check (protein_g >= 0),
  constraint meal_entries_carbs_check check (carbs_g >= 0),
  constraint meal_entries_fat_check check (fat_g >= 0),
  constraint meal_entries_source_type_check check (source_type in ('manual', 'template', 'import'))
);

create index if not exists idx_meal_entries_nutrition_day_id
  on public.meal_entries(nutrition_day_id);

create table if not exists public.body_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(6,2) not null,
  source text,
  created_at timestamptz not null default now(),
  constraint body_weight_entries_weight_check check (weight_kg > 0)
);

create index if not exists idx_body_weight_entries_user_entry_date_desc
  on public.body_weight_entries(user_id, entry_date desc);

create table if not exists public.hydration_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  water_ml integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hydration_entries_unique unique (user_id, entry_date),
  constraint hydration_entries_water_ml_check check (water_ml >= 0)
);

create table if not exists public.cardio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  cardio_type text not null,
  duration_min integer not null,
  intensity_level text,
  estimated_calories integer,
  notes text,
  created_at timestamptz not null default now(),
  constraint cardio_entries_duration_min_check check (duration_min >= 0),
  constraint cardio_entries_estimated_calories_check check (estimated_calories is null or estimated_calories >= 0),
  constraint cardio_entries_intensity_level_check check (intensity_level is null or intensity_level in ('low', 'moderate', 'high'))
);

create index if not exists idx_cardio_entries_user_entry_date_desc
  on public.cardio_entries(user_id, entry_date desc);

-- =========================================================
-- Derived read models / cache tables
-- =========================================================

create table if not exists public.exercise_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  snapshot_date date not null,
  best_weight numeric(8,2),
  best_reps smallint,
  estimated_1rm numeric(8,2),
  volume_load numeric(12,2),
  progression_status text not null,
  recommendation_summary text,
  created_at timestamptz not null default now(),
  constraint exercise_progress_snapshots_unique unique (user_id, exercise_id, snapshot_date),
  constraint exercise_progress_snapshots_best_weight_check check (best_weight is null or best_weight >= 0),
  constraint exercise_progress_snapshots_best_reps_check check (best_reps is null or best_reps >= 0),
  constraint exercise_progress_snapshots_estimated_1rm_check check (estimated_1rm is null or estimated_1rm >= 0),
  constraint exercise_progress_snapshots_volume_load_check check (volume_load is null or volume_load >= 0),
  constraint exercise_progress_snapshots_progression_status_check check (progression_status in ('progressing', 'stable', 'stalled', 'regressing'))
);

create index if not exists idx_exercise_progress_snapshots_user_id
  on public.exercise_progress_snapshots(user_id);

create table if not exists public.muscle_recovery_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups(id) on delete cascade,
  status_label text not null,
  readiness_score_internal numeric(6,2) not null,
  fatigue_score_internal numeric(6,2) not null,
  last_updated_at timestamptz not null default now(),
  expected_ready_at timestamptz,
  source_session_id uuid references public.workout_sessions(id) on delete set null,
  constraint muscle_recovery_states_unique unique (user_id, muscle_group_id),
  constraint muscle_recovery_states_status_label_check check (status_label in ('highly_fatigued', 'recovering', 'almost_ready', 'ready'))
);

create index if not exists idx_muscle_recovery_states_user_id
  on public.muscle_recovery_states(user_id);

create table if not exists public.split_recovery_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  split_label text not null,
  status_label text not null,
  readiness_score_internal numeric(6,2) not null,
  last_updated_at timestamptz not null default now(),
  expected_ready_at timestamptz,
  constraint split_recovery_states_unique unique (user_id, split_label),
  constraint split_recovery_states_status_label_check check (status_label in ('highly_fatigued', 'recovering', 'almost_ready', 'ready'))
);

create table if not exists public.system_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recommendation_type text not null,
  context_entity_type text not null,
  context_entity_id uuid,
  title text not null,
  message text not null,
  severity text not null default 'info',
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  acted_on_at timestamptz,
  constraint system_recommendations_severity_check check (severity in ('info', 'warning', 'critical'))
);

create index if not exists idx_system_recommendations_user_created_at_desc
  on public.system_recommendations(user_id, created_at desc);

create index if not exists idx_system_recommendations_user_type
  on public.system_recommendations(user_id, recommendation_type);

create index if not exists idx_system_recommendations_context
  on public.system_recommendations(context_entity_type, context_entity_id);

-- =========================================================
-- updated_at triggers
-- =========================================================

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_goals_set_updated_at on public.user_goals;
create trigger trg_user_goals_set_updated_at
before update on public.user_goals
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_preferences_set_updated_at on public.user_preferences;
create trigger trg_user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

drop trigger if exists trg_exercises_set_updated_at on public.exercises;
create trigger trg_exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

drop trigger if exists trg_workout_plans_set_updated_at on public.workout_plans;
create trigger trg_workout_plans_set_updated_at
before update on public.workout_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_workout_sessions_set_updated_at on public.workout_sessions;
create trigger trg_workout_sessions_set_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

drop trigger if exists trg_nutrition_days_set_updated_at on public.nutrition_days;
create trigger trg_nutrition_days_set_updated_at
before update on public.nutrition_days
for each row execute function public.set_updated_at();

drop trigger if exists trg_hydration_entries_set_updated_at on public.hydration_entries;
create trigger trg_hydration_entries_set_updated_at
before update on public.hydration_entries
for each row execute function public.set_updated_at();

-- =========================================================
-- Auto-create profile/preferences after signup
-- =========================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_preferences enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_days enable row level security;
alter table public.workout_plan_day_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.set_entries enable row level security;
alter table public.session_notes enable row level security;
alter table public.nutrition_days enable row level security;
alter table public.meal_entries enable row level security;
alter table public.body_weight_entries enable row level security;
alter table public.hydration_entries enable row level security;
alter table public.cardio_entries enable row level security;
alter table public.exercise_progress_snapshots enable row level security;
alter table public.muscle_recovery_states enable row level security;
alter table public.split_recovery_states enable row level security;
alter table public.system_recommendations enable row level security;

-- master data readable by authenticated users
alter table public.muscle_groups enable row level security;
alter table public.exercise_muscle_maps enable row level security;

-- profiles
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- user_goals
create policy "user_goals_all_own"
on public.user_goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- user_preferences
create policy "user_preferences_all_own"
on public.user_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- muscle_groups
create policy "muscle_groups_read_authenticated"
on public.muscle_groups
for select
using (auth.role() = 'authenticated');

-- exercises
create policy "exercises_read_system_or_own"
on public.exercises
for select
using (
  auth.role() = 'authenticated'
  and (created_by_user_id is null or created_by_user_id = auth.uid())
);

create policy "exercises_insert_own"
on public.exercises
for insert
with check (
  auth.uid() = created_by_user_id
  and is_custom = true
);

create policy "exercises_update_own_custom"
on public.exercises
for update
using (created_by_user_id = auth.uid())
with check (created_by_user_id = auth.uid());

create policy "exercises_delete_own_custom"
on public.exercises
for delete
using (created_by_user_id = auth.uid());

-- exercise_muscle_maps
create policy "exercise_muscle_maps_read_authenticated"
on public.exercise_muscle_maps
for select
using (auth.role() = 'authenticated');

-- workout_plans
create policy "workout_plans_all_own"
on public.workout_plans
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- workout_plan_days
create policy "workout_plan_days_all_via_plan"
on public.workout_plan_days
for all
using (
  exists (
    select 1
    from public.workout_plans wp
    where wp.id = workout_plan_id
      and wp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_plans wp
    where wp.id = workout_plan_id
      and wp.user_id = auth.uid()
  )
);

-- workout_plan_day_exercises
create policy "workout_plan_day_exercises_all_via_plan_day"
on public.workout_plan_day_exercises
for all
using (
  exists (
    select 1
    from public.workout_plan_days wpd
    join public.workout_plans wp on wp.id = wpd.workout_plan_id
    where wpd.id = workout_plan_day_id
      and wp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_plan_days wpd
    join public.workout_plans wp on wp.id = wpd.workout_plan_id
    where wpd.id = workout_plan_day_id
      and wp.user_id = auth.uid()
  )
);

-- workout_sessions
create policy "workout_sessions_all_own"
on public.workout_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- workout_session_exercises
create policy "workout_session_exercises_all_via_session"
on public.workout_session_exercises
for all
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
);

-- set_entries
create policy "set_entries_all_via_session_exercise"
on public.set_entries
for all
using (
  exists (
    select 1
    from public.workout_session_exercises wse
    join public.workout_sessions ws on ws.id = wse.workout_session_id
    where wse.id = workout_session_exercise_id
      and ws.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_session_exercises wse
    join public.workout_sessions ws on ws.id = wse.workout_session_id
    where wse.id = workout_session_exercise_id
      and ws.user_id = auth.uid()
  )
);

-- session_notes
create policy "session_notes_all_via_session"
on public.session_notes
for all
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
);

-- nutrition_days
create policy "nutrition_days_all_own"
on public.nutrition_days
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- meal_entries
create policy "meal_entries_all_via_nutrition_day"
on public.meal_entries
for all
using (
  exists (
    select 1
    from public.nutrition_days nd
    where nd.id = nutrition_day_id
      and nd.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.nutrition_days nd
    where nd.id = nutrition_day_id
      and nd.user_id = auth.uid()
  )
);

-- body_weight_entries
create policy "body_weight_entries_all_own"
on public.body_weight_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- hydration_entries
create policy "hydration_entries_all_own"
on public.hydration_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- cardio_entries
create policy "cardio_entries_all_own"
on public.cardio_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- derived tables
create policy "exercise_progress_snapshots_all_own"
on public.exercise_progress_snapshots
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "muscle_recovery_states_all_own"
on public.muscle_recovery_states
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "split_recovery_states_all_own"
on public.split_recovery_states
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "system_recommendations_all_own"
on public.system_recommendations
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;