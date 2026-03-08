begin;

-- =========================================================
-- muscle_groups
-- =========================================================

insert into public.muscle_groups (slug, display_name, region, is_primary_group)
values
  ('chest', 'Chest', 'chest', true),
  ('front_delts', 'Front Delts', 'shoulders', true),
  ('side_delts', 'Side Delts', 'shoulders', true),
  ('rear_delts', 'Rear Delts', 'shoulders', true),

  ('lats', 'Lats', 'back', true),
  ('upper_back', 'Upper Back', 'back', true),
  ('lower_back', 'Lower Back', 'back', true),

  ('biceps', 'Biceps', 'arms', true),
  ('triceps', 'Triceps', 'arms', true),
  ('forearms', 'Forearms', 'arms', true),

  ('abs', 'Abs', 'core', true),
  ('obliques', 'Obliques', 'core', true),

  ('quads', 'Quads', 'legs', true),
  ('hamstrings', 'Hamstrings', 'legs', true),
  ('glutes', 'Glutes', 'legs', true),
  ('calves', 'Calves', 'legs', true),

  ('traps', 'Traps', 'neck', true)
on conflict (slug) do update
set
  display_name = excluded.display_name,
  region = excluded.region,
  is_primary_group = excluded.is_primary_group;

-- =========================================================
-- exercises (system exercises)
-- =========================================================

insert into public.exercises (
  created_by_user_id,
  name,
  slug,
  description,
  equipment_type,
  exercise_category,
  movement_pattern,
  is_unilateral,
  is_custom,
  is_active
)
values

-- Chest / Push
(null,'Barbell Bench Press','barbell-bench-press','Flat barbell chest press','barbell','compound','horizontal_push',false,false,true),
(null,'Incline Dumbbell Press','incline-dumbbell-press','Incline press for upper chest','dumbbell','compound','incline_push',false,false,true),
(null,'Cable Fly','cable-fly','Chest fly isolation','cable','isolation','chest_fly',false,false,true),

-- Shoulders
(null,'Overhead Press','overhead-press','Barbell overhead press','barbell','compound','vertical_push',false,false,true),
(null,'Dumbbell Lateral Raise','dumbbell-lateral-raise','Side delt isolation','dumbbell','isolation','lateral_raise',false,false,true),
(null,'Face Pull','face-pull','Rear delt cable pull','cable','isolation','rear_delt_pull',false,false,true),

-- Back
(null,'Pull Up','pull-up','Bodyweight vertical pull','bodyweight','compound','vertical_pull',false,false,true),
(null,'Lat Pulldown','lat-pulldown','Cable vertical pull','cable','compound','vertical_pull',false,false,true),
(null,'Barbell Row','barbell-row','Bent over barbell row','barbell','compound','horizontal_pull',false,false,true),
(null,'Seated Cable Row','seated-cable-row','Cable row','cable','compound','horizontal_pull',false,false,true),

-- Arms
(null,'Barbell Curl','barbell-curl','Biceps curl','barbell','isolation','elbow_flexion',false,false,true),
(null,'Hammer Curl','hammer-curl','Neutral grip curl','dumbbell','isolation','elbow_flexion',false,false,true),
(null,'Triceps Pushdown','triceps-pushdown','Cable triceps pushdown','cable','isolation','elbow_extension',false,false,true),
(null,'Overhead Triceps Extension','overhead-triceps-extension','Overhead triceps extension','cable','isolation','elbow_extension',false,false,true),

-- Legs
(null,'Back Squat','back-squat','Barbell back squat','barbell','compound','squat',false,false,true),
(null,'Leg Press','leg-press','Machine leg press','machine','compound','squat',false,false,true),
(null,'Romanian Deadlift','romanian-deadlift','Hip hinge for hamstrings','barbell','compound','hinge',false,false,true),
(null,'Leg Curl','leg-curl','Hamstring curl','machine','isolation','knee_flexion',false,false,true),
(null,'Leg Extension','leg-extension','Quad extension','machine','isolation','knee_extension',false,false,true),
(null,'Walking Lunge','walking-lunge','Unilateral leg movement','dumbbell','compound','lunge',true,false,true),
(null,'Standing Calf Raise','standing-calf-raise','Calf isolation','machine','isolation','ankle_plantarflexion',false,false,true),

-- Core
(null,'Crunch','crunch','Abdominal crunch','bodyweight','isolation','trunk_flexion',false,false,true),
(null,'Hanging Leg Raise','hanging-leg-raise','Hanging abs movement','bodyweight','isolation','hip_flexion_core',false,false,true),
(null,'Plank','plank','Core stability exercise','bodyweight','isolation','anti_extension',false,false,true),

-- Traps
(null,'Barbell Shrug','barbell-shrug','Upper trap shrug','barbell','isolation','scapular_elevation',false,false,true)

on conflict do nothing;

-- =========================================================
-- exercise_muscle_maps
-- =========================================================

insert into public.exercise_muscle_maps (exercise_id, muscle_group_id, involvement_role, contribution_weight)
select e.id, m.id, x.role, x.weight
from (
values

('barbell-bench-press','chest','primary',0.7),
('barbell-bench-press','front_delts','secondary',0.2),
('barbell-bench-press','triceps','secondary',0.1),

('incline-dumbbell-press','chest','primary',0.55),
('incline-dumbbell-press','front_delts','secondary',0.30),
('incline-dumbbell-press','triceps','secondary',0.15),

('cable-fly','chest','primary',0.9),
('cable-fly','front_delts','secondary',0.1),

('overhead-press','front_delts','primary',0.5),
('overhead-press','triceps','secondary',0.3),
('overhead-press','side_delts','secondary',0.2),

('pull-up','lats','primary',0.5),
('pull-up','upper_back','secondary',0.25),
('pull-up','biceps','secondary',0.20),
('pull-up','forearms','stabilizer',0.05),

('barbell-row','upper_back','primary',0.40),
('barbell-row','lats','secondary',0.25),
('barbell-row','rear_delts','secondary',0.15),
('barbell-row','biceps','secondary',0.10),
('barbell-row','lower_back','stabilizer',0.10),

('back-squat','quads','primary',0.45),
('back-squat','glutes','secondary',0.30),
('back-squat','hamstrings','secondary',0.10),
('back-squat','lower_back','stabilizer',0.10),
('back-squat','abs','stabilizer',0.05),

('romanian-deadlift','hamstrings','primary',0.45),
('romanian-deadlift','glutes','secondary',0.30),
('romanian-deadlift','lower_back','secondary',0.15),
('romanian-deadlift','upper_back','stabilizer',0.10),

('leg-extension','quads','primary',0.95),
('leg-curl','hamstrings','primary',0.9),

('standing-calf-raise','calves','primary',0.95),

('barbell-curl','biceps','primary',0.8),
('barbell-curl','forearms','secondary',0.2),

('hammer-curl','biceps','primary',0.6),
('hammer-curl','forearms','secondary',0.4),

('triceps-pushdown','triceps','primary',0.9),

('crunch','abs','primary',0.85),
('crunch','obliques','secondary',0.15),

('plank','abs','primary',0.5),
('plank','obliques','secondary',0.25),
('plank','lower_back','secondary',0.15),
('plank','glutes','stabilizer',0.10)

) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e
  on e.slug = x.exercise_slug
join public.muscle_groups m
  on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_group_id) do update
set
  involvement_role = excluded.involvement_role,
  contribution_weight = excluded.contribution_weight;

commit;