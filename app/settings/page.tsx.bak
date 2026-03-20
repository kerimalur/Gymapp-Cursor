'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Bell, Cloud, Save, User, Apple, Dumbbell, SlidersHorizontal, Shield } from 'lucide-react';
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
      className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-cyan-500' : 'bg-[hsl(225,12%,20%)]'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

type TabId = 'profil' | 'training' | 'ernaehrung' | 'app';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profil', label: 'Profil', icon: <User className="h-4 w-4" /> },
  { id: 'training', label: 'Training', icon: <Dumbbell className="h-4 w-4" /> },
  { id: 'ernaehrung', label: 'Ernährung', icon: <Apple className="h-4 w-4" /> },
  { id: 'app', label: 'App', icon: <SlidersHorizontal className="h-4 w-4" /> },
];

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

  const [activeTab, setActiveTab] = useState<TabId>('profil');

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
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Einstellungen</h1>
          <p className="mt-1 text-sm text-blue-100">Persönlich, trainingsspezifisch und cloud-synchron.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(225,14%,10%)] px-4 py-2.5 font-semibold text-cyan-400 hover:bg-cyan-400/10"
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

        {/* Tab Bar */}
        <div className="flex gap-1 rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-[hsl(var(--fg-muted))] hover:bg-[hsl(225,12%,15%)] hover:text-[hsl(var(--fg-secondary))]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Profil */}
        {activeTab === 'profil' && (
          <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[hsl(225,12%,15%)] p-2 text-[hsl(var(--fg-secondary))]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Profil</h2>
                <p className="text-sm text-[hsl(var(--fg-muted))]">Wird in App und Cloud genutzt</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Dein Name"
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none transition-colors focus:border-cyan-400/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">E-Mail</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,12%,13%)] px-4 py-3 text-[hsl(var(--fg-muted))]"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Kurzprofil / Bio</label>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={3}
                placeholder="Optional: Ziele, Fokus, Hinweise"
                className="w-full resize-none rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none transition-colors focus:border-cyan-400/50"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Alter</label>
                <input
                  type="number"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value ? parseInt(e.target.value, 10) : '')}
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none transition-colors focus:border-cyan-400/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Größe (cm)</label>
                <input
                  type="number"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value ? parseInt(e.target.value, 10) : '')}
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none transition-colors focus:border-cyan-400/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Trainingslevel</label>
                <select
                  value={experienceInput}
                  onChange={(e) => setExperienceInput(e.target.value as any)}
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-cyan-400/50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Primäres Ziel</label>
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="z. B. Muskelaufbau"
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none transition-colors focus:border-cyan-400/50"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="mt-6 w-full rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white hover:bg-cyan-400 transition-colors"
            >
              Profil speichern
            </button>
          </div>
        )}

        {/* Tab: Training */}
        {activeTab === 'training' && (
          <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[hsl(225,12%,15%)] p-2 text-[hsl(var(--fg-secondary))]">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Training</h2>
                <p className="text-sm text-[hsl(var(--fg-muted))]">Rest-Timer und Trainingsverhalten</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Standard Pause (Sekunden)</label>
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
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none transition-colors focus:border-violet-500"
                />
                <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">Empfohlen: 60–180 Sekunden</p>
              </div>

              <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,12%,13%)] p-4 space-y-4">
                <p className="text-sm font-semibold text-[hsl(var(--fg-secondary))]">Timer-Optionen</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[hsl(var(--fg-primary))]">Timer automatisch starten</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Nach einem abgeschlossenen Satz</p>
                  </div>
                  <Toggle
                    value={workoutStore.workoutSettings.autoStartRestTimer}
                    onChange={(value) => workoutStore.updateWorkoutSettings({ autoStartRestTimer: value })}
                  />
                </div>
                <div className="h-px bg-[hsl(225,12%,20%)]" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[hsl(var(--fg-primary))]">Timer Signal</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Sound/Hinweis bei Ablauf</p>
                  </div>
                  <Toggle
                    value={workoutStore.workoutSettings.restTimerSound}
                    onChange={(value) => workoutStore.updateWorkoutSettings({ restTimerSound: value })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-violet-400/10 px-4 py-3 text-sm text-violet-400">
              Änderungen am Rest-Timer werden sofort gespeichert.
            </div>
          </div>
        )}

        {/* Tab: Ernaehrung */}
        {activeTab === 'ernaehrung' && (
          <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[hsl(225,12%,15%)] p-2 text-[hsl(var(--fg-secondary))]">
                <Apple className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Ernährung</h2>
                <p className="text-sm text-[hsl(var(--fg-muted))]">Tägliche Ziele für Kalorien und Makros</p>
              </div>
            </div>

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
                  <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">{item.label}</label>
                  <input
                    type="number"
                    value={(nutritionGoals as any)[item.key]}
                    onChange={(e) =>
                      setNutritionGoals((prev) => ({
                        ...prev,
                        [item.key]: parseInt(e.target.value || '0', 10),
                      }))
                    }
                    className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none transition-colors focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveNutrition}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Ernährungsziele speichern
            </button>
          </div>
        )}

        {/* Tab: App */}
        {activeTab === 'app' && (
          <div className="space-y-5">
            {/* App Praeferenzen */}
            <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-[hsl(225,12%,15%)] p-2 text-[hsl(var(--fg-secondary))]">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))]">App-Präferenzen</h2>
                  <p className="text-sm text-[hsl(var(--fg-muted))]">Sprache, Ansicht und Darstellung</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Sprache</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => updatePreferences({ language: e.target.value as 'de' | 'en' })}
                    className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-indigo-500"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Standard Kalenderansicht</label>
                  <select
                    value={preferences.calendarView}
                    onChange={(e) =>
                      updatePreferences({ calendarView: e.target.value as 'month' | 'week' | 'year' })
                    }
                    className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-indigo-500"
                  >
                    <option value="month">Monat</option>
                    <option value="week">Woche</option>
                    <option value="year">Jahr</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Dashboard Akzent</label>
                  <select
                    value={preferences.dashboardAccent}
                    onChange={(e) =>
                      updatePreferences({ dashboardAccent: e.target.value as 'blue' | 'violet' | 'teal' })
                    }
                    className="w-full rounded-xl border-2 border-[hsl(225,10%,16%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-indigo-500"
                  >
                    <option value="blue">Blue</option>
                    <option value="violet">Violet</option>
                    <option value="teal">Teal</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,12%,13%)] p-4 space-y-4">
                <p className="text-sm font-semibold text-[hsl(var(--fg-secondary))]">Darstellung</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[hsl(var(--fg-primary))]">Kompakter Modus</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Dichtere Karten/Abstände</p>
                  </div>
                  <Toggle
                    value={preferences.compactMode}
                    onChange={(value) => updatePreferences({ compactMode: value })}
                  />
                </div>
                <div className="h-px bg-[hsl(225,12%,20%)]" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[hsl(var(--fg-primary))]">Advanced Stats zeigen</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Detailmetriken einblenden</p>
                  </div>
                  <Toggle
                    value={preferences.showAdvancedStats}
                    onChange={(value) => updatePreferences({ showAdvancedStats: value })}
                  />
                </div>
                <div className="h-px bg-[hsl(225,12%,20%)]" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[hsl(var(--fg-primary))]">Muskelbalance sichtbar</p>
                    <p className="text-xs text-[hsl(var(--fg-muted))]">Kann später auch ausgeblendet werden</p>
                  </div>
                  <Toggle
                    value={preferences.showMuscleBalance}
                    onChange={(value) => updatePreferences({ showMuscleBalance: value })}
                  />
                </div>
              </div>
            </div>

            {/* Benachrichtigungen */}
            <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-[hsl(225,12%,15%)] p-2 text-[hsl(var(--fg-secondary))]">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[hsl(var(--fg-primary))]">Benachrichtigungen</h2>
                  <p className="text-sm text-[hsl(var(--fg-muted))]">Was du aktiv sehen willst</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ['workoutReminders', 'Workout Erinnerungen'],
                  ['mealReminders', 'Meal Erinnerungen'],
                  ['waterReminders', 'Wasser Erinnerungen'],
                  ['weeklyReport', 'Wochenreport'],
                  ['recoveryAlerts', 'Recovery Warnungen'],
                  ['syncAlerts', 'Cloud Sync Hinweise'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl bg-[hsl(225,12%,13%)] p-4">
                    <p className="font-medium text-[hsl(var(--fg-primary))]">{label}</p>
                    <Toggle
                      value={(notifications as any)[key]}
                      onChange={(value) => updateNotifications({ [key]: value } as any)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Hinweis */}
            <section className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
              <div className="mb-2 flex items-center gap-2 text-red-400">
                <Shield className="h-5 w-5" />
                <h3 className="font-bold">Hinweis</h3>
              </div>
              <p className="text-sm text-red-400">
                Alle Einstellungen werden lokal gespeichert und bei Login mit Supabase synchronisiert.
                Mit "Alles speichern" schreibst du sofort in die Cloud.
              </p>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
