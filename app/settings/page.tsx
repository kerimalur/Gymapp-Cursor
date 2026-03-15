'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Bell, Clock, Cloud, Save, User, Apple, Dumbbell, SlidersHorizontal, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { useAppSettingsStore } from '@/store/useAppSettingsStore';
import toast from 'react-hot-toast';

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, syncing, syncData, updateProfile } = useAuthStore();
  const workoutStore = useWorkoutStore();
  const nutritionStore = useNutritionStore();
  const bodyWeightStore = useBodyWeightStore();

  const {
    profileName,
    profileBio,
    notifications,
    preferences,
    age,
    heightCm,
    trainingExperience,
    primaryGoal,
    setProfileName,
    setProfileBio,
    setAge,
    setHeightCm,
    setTrainingExperience,
    setPrimaryGoal,
    updateNotifications,
    updatePreferences,
  } = useAppSettingsStore();

  const [nameInput, setNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [ageInput, setAgeInput] = useState<number | ''>('');
  const [heightInput, setHeightInput] = useState<number | ''>('');
  const [experienceInput, setExperienceInput] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [goalInput, setGoalInput] = useState('');

  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2500,
    protein: 150,
    carbs: 300,
    fats: 80,
    water: 3000,
    caffeine: 400,
  });

  useEffect(() => {
    setNameInput(profileName || user?.displayName || '');
    setBioInput(profileBio || '');
    setAgeInput(age || '');
    setHeightInput(heightCm || '');
    setExperienceInput(trainingExperience || 'beginner');
    setGoalInput(primaryGoal || '');
  }, [profileName, profileBio, age, heightCm, trainingExperience, primaryGoal, user?.displayName]);

  useEffect(() => {
    if (!nutritionStore.nutritionGoals) return;

    setNutritionGoals({
      calories: nutritionStore.nutritionGoals.dailyCalories || 2500,
      protein: nutritionStore.nutritionGoals.dailyProtein || 150,
      carbs: nutritionStore.nutritionGoals.dailyCarbs || 300,
      fats: nutritionStore.nutritionGoals.dailyFats || 80,
      water: nutritionStore.nutritionGoals.waterGoal || 3000,
      caffeine: nutritionStore.nutritionGoals.caffeineGoal || 400,
    });
  }, [nutritionStore.nutritionGoals]);

  const settingsPayload = useMemo(
    () => ({
      profileName: nameInput.trim(),
      profileBio: bioInput.trim(),
      age: ageInput === '' ? null : Number(ageInput),
      heightCm: heightInput === '' ? null : Number(heightInput),
      trainingExperience: experienceInput,
      primaryGoal: goalInput.trim(),
      notifications,
      preferences,
    }),
    [nameInput, bioInput, notifications, preferences]
  );

  const handleSaveNutrition = () => {
    nutritionStore.setNutritionGoals({
      userId: user?.uid || 'local',
      dailyCalories: Number.isFinite(nutritionGoals.calories) ? nutritionGoals.calories : 2500,
      dailyProtein: Number.isFinite(nutritionGoals.protein) ? nutritionGoals.protein : 150,
      dailyCarbs: Number.isFinite(nutritionGoals.carbs) ? nutritionGoals.carbs : 300,
      dailyFats: Number.isFinite(nutritionGoals.fats) ? nutritionGoals.fats : 80,
      waterGoal: Number.isFinite(nutritionGoals.water) ? nutritionGoals.water : 3000,
      caffeineGoal: Number.isFinite(nutritionGoals.caffeine) ? nutritionGoals.caffeine : 400,
    });
    toast.success('Ernährungsziele gespeichert');
  };

  const handleSaveProfile = async () => {
    const cleanedName = nameInput.trim();
    if (!cleanedName) {
      toast.error('Bitte einen Namen eingeben');
      return;
    }

    setProfileName(cleanedName);
    setProfileBio(bioInput.trim());
    setAge(ageInput === '' ? null : Number(ageInput));
    setHeightCm(heightInput === '' ? null : Number(heightInput));
    setTrainingExperience(experienceInput);
    setPrimaryGoal(goalInput.trim());

    if (user) {
      try {
        await updateProfile({ displayName: cleanedName });
      } catch (error: any) {
        console.error('Profile update failed:', error);
        toast.error(error?.message || 'Profil konnte nicht aktualisiert werden');
        return;
      }
    }

    toast.success('Profil gespeichert');
  };

  const handleSaveAll = async () => {
    handleSaveNutrition();

    const cleanedName = nameInput.trim();
    setProfileName(cleanedName);
    setProfileBio(bioInput.trim());
    setAge(ageInput === '' ? null : Number(ageInput));
    setHeightCm(heightInput === '' ? null : Number(heightInput));
    setTrainingExperience(experienceInput);
    setPrimaryGoal(goalInput.trim());

    if (!user) {
      toast.success('Lokal gespeichert');
      return;
    }

    try {
      if (cleanedName) {
        await updateProfile({ displayName: cleanedName });
      }

      await syncData(
        {
          exercises: workoutStore.exercises,
          customExercises: workoutStore.customExercises,
          trainingDays: workoutStore.trainingDays,
          trainingPlans: workoutStore.trainingPlans,
          workoutSessions: workoutStore.workoutSessions,
          workoutSettings: workoutStore.workoutSettings,
        },
        {
          foodItems: nutritionStore.foodItems,
          meals: nutritionStore.meals,
          savedMeals: nutritionStore.savedMeals,
          nutritionGoals: nutritionStore.nutritionGoals,
          dailyTracking: nutritionStore.dailyTracking,
          supplements: nutritionStore.supplements,
          trackedMeals: nutritionStore.trackedMeals,
          mealTemplates: nutritionStore.mealTemplates,
          customFoods: nutritionStore.customFoods,
          supplementPresets: nutritionStore.supplementPresets,
          sleepEntries: nutritionStore.sleepEntries,
          trackingSettings: nutritionStore.trackingSettings,
        },
        {
          entries: bodyWeightStore.entries,
          goal: bodyWeightStore.goal,
        },
        settingsPayload
      );

      toast.success('Alle Einstellungen in Supabase gespeichert');
    } catch (error: any) {
      console.error('Full settings sync failed:', error);
      toast.error(error?.message || 'Speichern in der Cloud fehlgeschlagen');
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Einstellungen</h1>
          <p className="mt-1 text-sm text-blue-100">Persönlich, trainingsspezifisch und cloud-synchron.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Save className="h-4 w-4" />
              Alles speichern
            </button>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium">
              <Cloud className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Synchronisiert...' : `Eingeloggt: ${user?.email || 'Nein'}`}
            </div>
          </div>
        </div>

        <Section title="Profil" subtitle="Wird in App und Cloud genutzt" icon={<User className="h-5 w-5" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Dein Name"
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">E-Mail</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Kurzprofil</label>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              rows={3}
              placeholder="Optional: Ziele, Fokus, Hinweise"
              className="w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Alter</label>
              <input
                type="number"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Groesse (cm)</label>
              <input
                type="number"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Trainingslevel</label>
              <select
                value={experienceInput}
                onChange={(e) => setExperienceInput(e.target.value as any)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Prim?res Ziel</label>
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="z. B. Muskelaufbau"
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Profil speichern
          </button>
        </Section>

        <Section title="Ernährung" subtitle="Ziele für Kalorien und Makros" icon={<Apple className="h-5 w-5" />}>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: 'calories', label: 'Kalorien (kcal)' },
              { key: 'protein', label: 'Protein (g)' },
              { key: 'carbs', label: 'Kohlenhydrate (g)' },
              { key: 'fats', label: 'Fette (g)' },
              { key: 'water', label: 'Wasser (ml)' },
              { key: 'caffeine', label: 'Koffein (mg)' },
            ].map((item) => (
              <div key={item.key}>
                <label className="mb-1 block text-sm font-semibold text-slate-700">{item.label}</label>
                <input
                  type="number"
                  value={(nutritionGoals as any)[item.key]}
                  onChange={(e) =>
                    setNutritionGoals((prev) => ({
                      ...prev,
                      [item.key]: parseInt(e.target.value || '0', 10),
                    }))
                  }
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveNutrition}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
          >
            Ernährung speichern
          </button>
        </Section>

        <Section title="Training" subtitle="Rest-Timer und Trainingsverhalten" icon={<Dumbbell className="h-5 w-5" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Standard Pause (Sekunden)</label>
              <input
                type="number"
                min={30}
                max={600}
                step={15}
                value={workoutStore.workoutSettings.defaultRestTime}
                onChange={(e) =>
                  workoutStore.updateWorkoutSettings({
                    defaultRestTime: parseInt(e.target.value || '90', 10),
                  })
                }
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-violet-500"
              />
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Timer automatisch starten</p>
                  <p className="text-xs text-slate-500">Nach einem abgeschlossenen Satz</p>
                </div>
                <Toggle
                  value={workoutStore.workoutSettings.autoStartRestTimer}
                  onChange={(value) => workoutStore.updateWorkoutSettings({ autoStartRestTimer: value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Timer Signal</p>
                  <p className="text-xs text-slate-500">Sound/Hinweis bei Ablauf</p>
                </div>
                <Toggle
                  value={workoutStore.workoutSettings.restTimerSound}
                  onChange={(value) => workoutStore.updateWorkoutSettings({ restTimerSound: value })}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Benachrichtigungen"
          subtitle="Was du aktiv sehen willst"
          icon={<Bell className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {[
              ['workoutReminders', 'Workout Erinnerungen'],
              ['mealReminders', 'Meal Erinnerungen'],
              ['waterReminders', 'Wasser Erinnerungen'],
              ['weeklyReport', 'Wochenreport'],
              ['recoveryAlerts', 'Recovery Warnungen'],
              ['syncAlerts', 'Cloud Sync Hinweise'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <p className="font-medium text-slate-800">{label}</p>
                <Toggle
                  value={(notifications as any)[key]}
                  onChange={(value) => updateNotifications({ [key]: value } as any)}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="App Praeferenzen"
          subtitle="Mehr Individualisierung für deine eigene Nutzung"
          icon={<SlidersHorizontal className="h-5 w-5" />}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Sprache</label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreferences({ language: e.target.value as 'de' | 'en' })}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-indigo-500"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Standard Kalenderansicht</label>
              <select
                value={preferences.calendarView}
                onChange={(e) =>
                  updatePreferences({ calendarView: e.target.value as 'month' | 'week' | 'year' })
                }
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-indigo-500"
              >
                <option value="month">Monat</option>
                <option value="week">Woche</option>
                <option value="year">Jahr</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Dashboard Akzent</label>
              <select
                value={preferences.dashboardAccent}
                onChange={(e) =>
                  updatePreferences({ dashboardAccent: e.target.value as 'blue' | 'violet' | 'teal' })
                }
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-indigo-500"
              >
                <option value="blue">Blue</option>
                <option value="violet">Violet</option>
                <option value="teal">Teal</option>
              </select>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Kompakter Modus</p>
                  <p className="text-xs text-slate-500">Dichtere Karten/Abstaende</p>
                </div>
                <Toggle
                  value={preferences.compactMode}
                  onChange={(value) => updatePreferences({ compactMode: value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Advanced Stats zeigen</p>
                  <p className="text-xs text-slate-500">Detailmetriken einblenden</p>
                </div>
                <Toggle
                  value={preferences.showAdvancedStats}
                  onChange={(value) => updatePreferences({ showAdvancedStats: value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Muskelbalance sichtbar</p>
                  <p className="text-xs text-slate-500">Kann spaeter auch ausgeblendet werden</p>
                </div>
                <Toggle
                  value={preferences.showMuscleBalance}
                  onChange={(value) => updatePreferences({ showMuscleBalance: value })}
                />
              </div>
            </div>
          </div>
        </Section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <Shield className="h-5 w-5" />
            <h3 className="font-bold">Hinweis</h3>
          </div>
          <p className="text-sm text-red-700">
            Alle Einstellungen werden lokal gespeichert und bei Login mit Supabase synchronisiert.
            Mit "Alles speichern" schreibst du sofort in die Cloud.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
