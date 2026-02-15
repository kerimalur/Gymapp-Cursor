import { Exercise, MuscleGroup } from '@/types';

// Secondary muscle recovery multiplier (they recover faster because less fatigued)
// e.g., 0.4 means secondary muscles only need 40% of their normal recovery time
export const SECONDARY_MUSCLE_RECOVERY_MULTIPLIER = 0.4;

export const exerciseDatabase: Exercise[] = [
  // ============ BRUST ============
  { 
    id: 'ex1', 
    name: 'Bankdrücken', 
    muscleGroups: ['chest', 'triceps', 'shoulders'], 
    muscles: [
      { muscle: 'chest', role: 'primary' },
      { muscle: 'triceps', role: 'secondary' },
      { muscle: 'shoulders', role: 'secondary' },
    ],
    category: 'push' 
  },
  { 
    id: 'ex2', 
    name: 'Schrägbankdrücken', 
    muscleGroups: ['chest', 'shoulders', 'triceps'], 
    muscles: [
      { muscle: 'chest', role: 'primary' },
      { muscle: 'shoulders', role: 'secondary' },
      { muscle: 'triceps', role: 'secondary' },
    ],
    category: 'push' 
  },
  { 
    id: 'ex3', 
    name: 'Fliegende', 
    muscleGroups: ['chest'], 
    muscles: [{ muscle: 'chest', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex4', 
    name: 'Butterfly', 
    muscleGroups: ['chest'], 
    muscles: [{ muscle: 'chest', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex5', 
    name: 'Kabelzug Crossover', 
    muscleGroups: ['chest'], 
    muscles: [{ muscle: 'chest', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex6', 
    name: 'Dips', 
    muscleGroups: ['chest', 'triceps', 'shoulders'], 
    muscles: [
      { muscle: 'chest', role: 'primary' },
      { muscle: 'triceps', role: 'secondary' },
      { muscle: 'shoulders', role: 'secondary' },
    ],
    category: 'push' 
  },
  { 
    id: 'ex7', 
    name: 'Push-Ups', 
    muscleGroups: ['chest', 'triceps', 'shoulders'], 
    muscles: [
      { muscle: 'chest', role: 'primary' },
      { muscle: 'triceps', role: 'secondary' },
      { muscle: 'shoulders', role: 'secondary' },
    ],
    category: 'push' 
  },

  // ============ RÜCKEN ============
  { 
    id: 'ex8', 
    name: 'Klimmzüge', 
    muscleGroups: ['lats', 'back', 'biceps'], 
    muscles: [
      { muscle: 'lats', role: 'primary' },
      { muscle: 'back', role: 'primary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex9', 
    name: 'Latzug', 
    muscleGroups: ['lats', 'back', 'biceps'], 
    muscles: [
      { muscle: 'lats', role: 'primary' },
      { muscle: 'back', role: 'secondary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex10', 
    name: 'Rudern Langhantel', 
    muscleGroups: ['back', 'lats', 'biceps'], 
    muscles: [
      { muscle: 'back', role: 'primary' },
      { muscle: 'lats', role: 'primary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex11', 
    name: 'Kurzhantel Rudern', 
    muscleGroups: ['back', 'lats', 'biceps'], 
    muscles: [
      { muscle: 'back', role: 'primary' },
      { muscle: 'lats', role: 'secondary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex12', 
    name: 'T-Bar Rudern', 
    muscleGroups: ['back', 'lats'], 
    muscles: [
      { muscle: 'back', role: 'primary' },
      { muscle: 'lats', role: 'primary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex13', 
    name: 'Kabelrudern', 
    muscleGroups: ['back', 'lats', 'biceps'], 
    muscles: [
      { muscle: 'back', role: 'primary' },
      { muscle: 'lats', role: 'secondary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex14', 
    name: 'Kreuzheben', 
    muscleGroups: ['back', 'glutes', 'hamstrings', 'traps'], 
    muscles: [
      { muscle: 'back', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'primary' },
      { muscle: 'traps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex15', 
    name: 'Hyperextensions', 
    muscleGroups: ['back', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'back', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'pull' 
  },

  // ============ SCHULTERN ============
  { 
    id: 'ex16', 
    name: 'Schulterdrücken', 
    muscleGroups: ['shoulders', 'triceps'], 
    muscles: [
      { muscle: 'shoulders', role: 'primary' },
      { muscle: 'triceps', role: 'secondary' },
    ],
    category: 'push' 
  },
  { 
    id: 'ex17', 
    name: 'Seitheben', 
    muscleGroups: ['shoulders'], 
    muscles: [{ muscle: 'shoulders', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex18', 
    name: 'Frontheben', 
    muscleGroups: ['shoulders'], 
    muscles: [{ muscle: 'shoulders', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex19', 
    name: 'Reverse Flys', 
    muscleGroups: ['shoulders', 'back'], 
    muscles: [
      { muscle: 'shoulders', role: 'primary' },
      { muscle: 'back', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex20', 
    name: 'Arnold Press', 
    muscleGroups: ['shoulders', 'triceps'], 
    muscles: [
      { muscle: 'shoulders', role: 'primary' },
      { muscle: 'triceps', role: 'secondary' },
    ],
    category: 'push' 
  },
  { 
    id: 'ex21', 
    name: 'Face Pulls', 
    muscleGroups: ['shoulders', 'traps'], 
    muscles: [
      { muscle: 'shoulders', role: 'primary' },
      { muscle: 'traps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex22', 
    name: 'Shrugs', 
    muscleGroups: ['traps'], 
    muscles: [{ muscle: 'traps', role: 'primary' }],
    category: 'pull' 
  },

  // ============ ARME - BIZEPS ============
  { 
    id: 'ex23', 
    name: 'Bizeps Curls', 
    muscleGroups: ['biceps'], 
    muscles: [{ muscle: 'biceps', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex24', 
    name: 'Hammer Curls', 
    muscleGroups: ['biceps', 'forearms'], 
    muscles: [
      { muscle: 'biceps', role: 'primary' },
      { muscle: 'forearms', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex25', 
    name: 'Konzentrationscurls', 
    muscleGroups: ['biceps'], 
    muscles: [{ muscle: 'biceps', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex26', 
    name: 'Preacher Curls', 
    muscleGroups: ['biceps'], 
    muscles: [{ muscle: 'biceps', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex27', 
    name: 'Kabel Curls', 
    muscleGroups: ['biceps'], 
    muscles: [{ muscle: 'biceps', role: 'primary' }],
    category: 'pull' 
  },

  // ============ ARME - TRIZEPS ============
  { 
    id: 'ex28', 
    name: 'Trizeps Drücken', 
    muscleGroups: ['triceps'], 
    muscles: [{ muscle: 'triceps', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex29', 
    name: 'Trizeps Pushdowns', 
    muscleGroups: ['triceps'], 
    muscles: [{ muscle: 'triceps', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex30', 
    name: 'Überkopf Trizepsdrücken', 
    muscleGroups: ['triceps'], 
    muscles: [{ muscle: 'triceps', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex31', 
    name: 'French Press', 
    muscleGroups: ['triceps'], 
    muscles: [{ muscle: 'triceps', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex32', 
    name: 'Close Grip Bench Press', 
    muscleGroups: ['triceps', 'chest'], 
    muscles: [
      { muscle: 'triceps', role: 'primary' },
      { muscle: 'chest', role: 'secondary' },
    ],
    category: 'push' 
  },

  // ============ BEINE - QUADRIZEPS ============
  { 
    id: 'ex33', 
    name: 'Kniebeugen', 
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex34', 
    name: 'Beinpresse', 
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex35', 
    name: 'Ausfallschritte', 
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex36', 
    name: 'Leg Extensions', 
    muscleGroups: ['quadriceps'], 
    muscles: [{ muscle: 'quadriceps', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex37', 
    name: 'Bulgarian Split Squats', 
    muscleGroups: ['quadriceps', 'glutes'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex38', 
    name: 'Front Squats', 
    muscleGroups: ['quadriceps', 'glutes'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
    ],
    category: 'legs' 
  },

  // ============ BEINE - HAMSTRINGS ============
  { 
    id: 'ex39', 
    name: 'Leg Curls', 
    muscleGroups: ['hamstrings'], 
    muscles: [{ muscle: 'hamstrings', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex40', 
    name: 'Romanian Deadlift', 
    muscleGroups: ['hamstrings', 'glutes', 'back'], 
    muscles: [
      { muscle: 'hamstrings', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'back', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex41', 
    name: 'Good Mornings', 
    muscleGroups: ['hamstrings', 'glutes', 'back'], 
    muscles: [
      { muscle: 'hamstrings', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
      { muscle: 'back', role: 'secondary' },
    ],
    category: 'legs' 
  },

  // ============ BEINE - WADEN ============
  { 
    id: 'ex42', 
    name: 'Wadenheben stehend', 
    muscleGroups: ['calves'], 
    muscles: [{ muscle: 'calves', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex43', 
    name: 'Wadenheben sitzend', 
    muscleGroups: ['calves'], 
    muscles: [{ muscle: 'calves', role: 'primary' }],
    category: 'legs' 
  },

  // ============ CORE/BAUCH ============
  { 
    id: 'ex44', 
    name: 'Crunches', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex45', 
    name: 'Plank', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex46', 
    name: 'Russian Twists', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex47', 
    name: 'Leg Raises', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex48', 
    name: 'Mountain Climbers', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex49', 
    name: 'Ab Wheel Rollouts', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex50', 
    name: 'Hanging Leg Raises', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },

  // ============ ADDUKTOREN ============
  { 
    id: 'ex51', 
    name: 'Adduktoren Maschine', 
    muscleGroups: ['adductors'], 
    muscles: [{ muscle: 'adductors', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex52', 
    name: 'Kabel Adduktion', 
    muscleGroups: ['adductors'], 
    muscles: [{ muscle: 'adductors', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex53', 
    name: 'Sumo Squats', 
    muscleGroups: ['adductors', 'glutes', 'quadriceps'], 
    muscles: [
      { muscle: 'adductors', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'quadriceps', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex54', 
    name: 'Copenhagen Plank', 
    muscleGroups: ['adductors', 'abs'], 
    muscles: [
      { muscle: 'adductors', role: 'primary' },
      { muscle: 'abs', role: 'secondary' },
    ],
    category: 'legs' 
  },

  // ============ ABDUKTOREN ============
  { 
    id: 'ex55', 
    name: 'Abduktoren Maschine', 
    muscleGroups: ['abductors'], 
    muscles: [{ muscle: 'abductors', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex56', 
    name: 'Kabel Abduktion', 
    muscleGroups: ['abductors', 'glutes'], 
    muscles: [
      { muscle: 'abductors', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex57', 
    name: 'Side Lying Hip Abduction', 
    muscleGroups: ['abductors', 'glutes'], 
    muscles: [
      { muscle: 'abductors', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex58', 
    name: 'Banded Lateral Walks', 
    muscleGroups: ['abductors', 'glutes'], 
    muscles: [
      { muscle: 'abductors', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex59', 
    name: 'Clamshells', 
    muscleGroups: ['abductors', 'glutes'], 
    muscles: [
      { muscle: 'abductors', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
    ],
    category: 'legs' 
  },

  // ============ UNTERER RÜCKEN ============
  { 
    id: 'ex60', 
    name: 'Back Extensions', 
    muscleGroups: ['lower_back', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'lower_back', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex61', 
    name: 'Reverse Hypers', 
    muscleGroups: ['lower_back', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'lower_back', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex62', 
    name: 'Superman', 
    muscleGroups: ['lower_back', 'glutes'], 
    muscles: [
      { muscle: 'lower_back', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
    ],
    category: 'core' 
  },

  // ============ NACKEN ============
  { 
    id: 'ex63', 
    name: 'Neck Curls', 
    muscleGroups: ['neck'], 
    muscles: [{ muscle: 'neck', role: 'primary' }],
    category: 'other' 
  },
  { 
    id: 'ex64', 
    name: 'Neck Extensions', 
    muscleGroups: ['neck'], 
    muscles: [{ muscle: 'neck', role: 'primary' }],
    category: 'other' 
  },
  { 
    id: 'ex65', 
    name: 'Neck Harness', 
    muscleGroups: ['neck', 'traps'], 
    muscles: [
      { muscle: 'neck', role: 'primary' },
      { muscle: 'traps', role: 'secondary' },
    ],
    category: 'other' 
  },

  // ============ GESÄSS (WEITERE) ============
  { 
    id: 'ex66', 
    name: 'Hip Thrust', 
    muscleGroups: ['glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex67', 
    name: 'Glute Bridge', 
    muscleGroups: ['glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex68', 
    name: 'Kabel Pull Through', 
    muscleGroups: ['glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex69', 
    name: 'Kickbacks', 
    muscleGroups: ['glutes'], 
    muscles: [{ muscle: 'glutes', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex70', 
    name: 'Step Ups', 
    muscleGroups: ['glutes', 'quadriceps'], 
    muscles: [
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'quadriceps', role: 'primary' },
    ],
    category: 'legs' 
  },

  // ============ UNTERARME ============
  { 
    id: 'ex71', 
    name: 'Wrist Curls', 
    muscleGroups: ['forearms'], 
    muscles: [{ muscle: 'forearms', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex72', 
    name: 'Reverse Wrist Curls', 
    muscleGroups: ['forearms'], 
    muscles: [{ muscle: 'forearms', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex73', 
    name: 'Farmers Walk', 
    muscleGroups: ['forearms', 'traps', 'abs'], 
    muscles: [
      { muscle: 'forearms', role: 'primary' },
      { muscle: 'traps', role: 'secondary' },
      { muscle: 'abs', role: 'secondary' },
    ],
    category: 'other' 
  },

  // ============ BRUST (WEITERE) ============
  { 
    id: 'ex74', 
    name: 'Decline Bankdrücken', 
    muscleGroups: ['chest', 'triceps'], 
    muscles: [
      { muscle: 'chest', role: 'primary' },
      { muscle: 'triceps', role: 'secondary' },
    ],
    category: 'push' 
  },
  { 
    id: 'ex75', 
    name: 'Incline Dumbbell Press', 
    muscleGroups: ['chest', 'shoulders', 'triceps'], 
    muscles: [
      { muscle: 'chest', role: 'primary' },
      { muscle: 'shoulders', role: 'secondary' },
      { muscle: 'triceps', role: 'secondary' },
    ],
    category: 'push' 
  },
  { 
    id: 'ex76', 
    name: 'Chest Press Maschine', 
    muscleGroups: ['chest', 'triceps'], 
    muscles: [
      { muscle: 'chest', role: 'primary' },
      { muscle: 'triceps', role: 'secondary' },
    ],
    category: 'push' 
  },

  // ============ RÜCKEN (WEITERE) ============
  { 
    id: 'ex77', 
    name: 'Meadows Row', 
    muscleGroups: ['lats', 'back', 'biceps'], 
    muscles: [
      { muscle: 'lats', role: 'primary' },
      { muscle: 'back', role: 'secondary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex78', 
    name: 'Pullover', 
    muscleGroups: ['lats', 'chest'], 
    muscles: [
      { muscle: 'lats', role: 'primary' },
      { muscle: 'chest', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex79', 
    name: 'Straight Arm Pulldown', 
    muscleGroups: ['lats'], 
    muscles: [{ muscle: 'lats', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex80', 
    name: 'Seal Row', 
    muscleGroups: ['back', 'lats', 'biceps'], 
    muscles: [
      { muscle: 'back', role: 'primary' },
      { muscle: 'lats', role: 'primary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },

  // ============ BEINE (WEITERE) ============
  { 
    id: 'ex81', 
    name: 'Hack Squat', 
    muscleGroups: ['quadriceps', 'glutes'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex82', 
    name: 'Sissy Squat', 
    muscleGroups: ['quadriceps'], 
    muscles: [{ muscle: 'quadriceps', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex83', 
    name: 'Nordic Curls', 
    muscleGroups: ['hamstrings'], 
    muscles: [{ muscle: 'hamstrings', role: 'primary' }],
    category: 'legs' 
  },
  { 
    id: 'ex84', 
    name: 'Goblet Squat', 
    muscleGroups: ['quadriceps', 'glutes'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex85', 
    name: 'Reverse Lunges', 
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex86', 
    name: 'Walking Lunges', 
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], 
    muscles: [
      { muscle: 'quadriceps', role: 'primary' },
      { muscle: 'glutes', role: 'primary' },
      { muscle: 'hamstrings', role: 'secondary' },
    ],
    category: 'legs' 
  },
  { 
    id: 'ex87', 
    name: 'Donkey Calf Raises', 
    muscleGroups: ['calves'], 
    muscles: [{ muscle: 'calves', role: 'primary' }],
    category: 'legs' 
  },

  // ============ SCHULTERN (WEITERE) ============
  { 
    id: 'ex88', 
    name: 'Upright Row', 
    muscleGroups: ['shoulders', 'traps'], 
    muscles: [
      { muscle: 'shoulders', role: 'primary' },
      { muscle: 'traps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex89', 
    name: 'Lu Raises', 
    muscleGroups: ['shoulders'], 
    muscles: [{ muscle: 'shoulders', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex90', 
    name: 'Cable Lateral Raises', 
    muscleGroups: ['shoulders'], 
    muscles: [{ muscle: 'shoulders', role: 'primary' }],
    category: 'push' 
  },

  // ============ ARME (WEITERE) ============
  { 
    id: 'ex91', 
    name: 'Incline Dumbbell Curls', 
    muscleGroups: ['biceps'], 
    muscles: [{ muscle: 'biceps', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex92', 
    name: 'Spider Curls', 
    muscleGroups: ['biceps'], 
    muscles: [{ muscle: 'biceps', role: 'primary' }],
    category: 'pull' 
  },
  { 
    id: 'ex93', 
    name: 'Reverse Curls', 
    muscleGroups: ['forearms', 'biceps'], 
    muscles: [
      { muscle: 'forearms', role: 'primary' },
      { muscle: 'biceps', role: 'secondary' },
    ],
    category: 'pull' 
  },
  { 
    id: 'ex94', 
    name: 'Kickbacks (Trizeps)', 
    muscleGroups: ['triceps'], 
    muscles: [{ muscle: 'triceps', role: 'primary' }],
    category: 'push' 
  },
  { 
    id: 'ex95', 
    name: 'Diamond Push-Ups', 
    muscleGroups: ['triceps', 'chest'], 
    muscles: [
      { muscle: 'triceps', role: 'primary' },
      { muscle: 'chest', role: 'secondary' },
    ],
    category: 'push' 
  },

  // ============ CORE (WEITERE) ============
  { 
    id: 'ex96', 
    name: 'Side Plank', 
    muscleGroups: ['abs', 'abductors'], 
    muscles: [
      { muscle: 'abs', role: 'primary' },
      { muscle: 'abductors', role: 'secondary' },
    ],
    category: 'core' 
  },
  { 
    id: 'ex97', 
    name: 'Dead Bug', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex98', 
    name: 'Pallof Press', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex99', 
    name: 'Cable Crunches', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
  { 
    id: 'ex100', 
    name: 'Woodchoppers', 
    muscleGroups: ['abs'], 
    muscles: [{ muscle: 'abs', role: 'primary' }],
    category: 'core' 
  },
];

// Helper function to get muscle involvement for an exercise
export function getMuscleInvolvement(exerciseId: string) {
  const exercise = exerciseDatabase.find(e => e.id === exerciseId);
  if (!exercise) return [];
  
  // Use new muscles array if available, otherwise fallback to muscleGroups
  if (exercise.muscles && exercise.muscles.length > 0) {
    return exercise.muscles;
  }
  
  // Fallback: first muscle is primary, rest are secondary
  return exercise.muscleGroups.map((muscle, index) => ({
    muscle,
    role: (index === 0 ? 'primary' : 'secondary') as 'primary' | 'secondary',
  }));
}

// Get all primary muscles for an exercise
export function getPrimaryMuscles(exerciseId: string): MuscleGroup[] {
  const involvement = getMuscleInvolvement(exerciseId);
  return involvement.filter(m => m.role === 'primary').map(m => m.muscle);
}

// Get all secondary muscles for an exercise
export function getSecondaryMuscles(exerciseId: string): MuscleGroup[] {
  const involvement = getMuscleInvolvement(exerciseId);
  return involvement.filter(m => m.role === 'secondary').map(m => m.muscle);
}
