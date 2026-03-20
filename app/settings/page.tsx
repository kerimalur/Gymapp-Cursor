'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useBodyWeightStore } from '@/store/useBodyWeightStore';
import { useAppSettingsStore } from '@/store/useAppSettingsStore';
import toast from 'react-hot-toast';
import {
  User, ChevronRight, LogOut, Cloud, Save,
  Dumbbell, Apple, Heart, SlidersHorizontal,
  Bell, Shield, ChevronDown,
} from 'lucide-react';

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-cyan-500' : 'bg-[hsl(225,12%,20%)]'}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ─── Expandable Section ──────────────────────────────────────────────────────

function Section({ title, subtitle, icon, children, defaultOpen = false }: {
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full p-4 text-left">
        <div className="rounded-lg bg-[hsl(225,12%,15%)] p-2 text-[hsl(var(--fg-secondary))]">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[hsl(var(--fg-primary))]">{title}</p>
          <p className="text-xs text-[hsl(var(--fg-muted))]">{subtitle}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[hsl(var(--fg-muted))] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { user, syncing, syncData, updateProfile, logout } = useAuthStore();
  const workoutStore = useWorkoutStore();
  const nutritionStore = useNutritionStore();
  const bodyWeightStore = useBodyWeightStore();
  const {
    profileName, profileBio, notifications, preferences,
    age, heightCm, trainingExperience, primaryGoal,
    setProfileName, setProfileBio, setAge, setHeightCm,
    setTrainingExperience, setPrimaryGoal,
    updateNotifications, updatePreferences,
  } = useAppSettingsStore();

  const [nameInput, setNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [ageInput, setAgeInput] = useState<number | ''>('');
  const [heightInput, setHeightInput] = useState<number | ''>('');
  const [experienceInput, setExperienceInput] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [goalInput, setGoalInput] = useState('');
  const [nutritionGoals, setNutritionGoals] = useState({ calories: 2500, protein: 150, carbs: 300, fats: 80, water: 3000, caffeine: 400 });

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

  const settingsPayload = useMemo(() => ({
    profileName: nameInput.trim(), profileBio: bioInput.trim(),
    age: ageInput === '' ? null : Number(ageInput), heightCm: heightInput === '' ? null : Number(heightInput),
    trainingExperience: experienceInput, primaryGoal: goalInput.trim(), notifications, preferences,
  }), [nameInput, bioInput, ageInput, heightInput, experienceInput, goalInput, notifications, preferences]);

  const handleSaveAll = async () => {
    // Save nutrition
    nutritionStore.setNutritionGoals({
      userId: user?.uid || 'local',
      dailyCalories: Number.isFinite(nutritionGoals.calories) ? nutritionGoals.calories : 2500,
      dailyProtein: Number.isFinite(nutritionGoals.protein) ? nutritionGoals.protein : 150,
      dailyCarbs: Number.isFinite(nutritionGoals.carbs) ? nutritionGoals.carbs : 300,
      dailyFats: Number.isFinite(nutritionGoals.fats) ? nutritionGoals.fats : 80,
      waterGoal: Number.isFinite(nutritionGoals.water) ? nutritionGoals.water : 3000,
      caffeineGoal: Number.isFinite(nutritionGoals.caffeine) ? nutritionGoals.caffeine : 400,
    });

    // Save profile
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
      if (cleanedName) await updateProfile({ displayName: cleanedName });
      await syncData(
        { exercises: workoutStore.exercises, customExercises: workoutStore.customExercises, trainingDays: workoutStore.trainingDays, trainingPlans: workoutStore.trainingPlans, workoutSessions: workoutStore.workoutSessions, workoutSettings: workoutStore.workoutSettings },
        { foodItems: nutritionStore.foodItems, meals: nutritionStore.meals, savedMeals: nutritionStore.savedMeals, nutritionGoals: nutritionStore.nutritionGoals, dailyTracking: nutritionStore.dailyTracking, supplements: nutritionStore.supplements, trackedMeals: nutritionStore.trackedMeals, mealTemplates: nutritionStore.mealTemplates, customFoods: nutritionStore.customFoods, supplementPresets: nutritionStore.supplementPresets, sleepEntries: nutritionStore.sleepEntries, trackingSettings: nutritionStore.trackingSettings },
        { entries: bodyWeightStore.entries, goal: bodyWeightStore.goal },
        settingsPayload,
      );
      toast.success('In Supabase gespeichert');
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error(error?.message || 'Cloud-Speichern fehlgeschlagen');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      toast.error('Abmelden fehlgeschlagen');
    }
  };

  const inputCls = 'w-full rounded-lg border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-3 py-2.5 text-sm text-[hsl(var(--fg-primary))] placeholder:text-[hsl(var(--fg-muted))] outline-none focus:border-cyan-400/50';
  const labelCls = 'mb-1 block text-xs font-semibold text-[hsl(var(--fg-secondary))]';

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── Profile Header ─────────────────────────────────── */}
        <div className="pt-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {(nameInput || user?.displayName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[hsl(var(--fg-primary))] truncate">{nameInput || user?.displayName || 'Benutzer'}</h1>
            <p className="text-sm text-[hsl(var(--fg-muted))] truncate">{user?.email || 'Lokaler Modus'}</p>
          </div>
        </div>

        {/* ── Save & Sync Strip ──────────────────────────────── */}
        <div className="flex gap-2">
          <button onClick={handleSaveAll}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-white">
            <Save className="w-4 h-4" />
            Alles speichern
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] px-3 py-2.5">
            <Cloud className={`w-4 h-4 text-[hsl(var(--fg-muted))] ${syncing ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-[hsl(var(--fg-muted))]">{syncing ? 'Sync...' : 'Cloud'}</span>
          </div>
        </div>

        {/* ── Quick Links ─────────────────────────────────────── */}
        <div className="space-y-1.5">
          {[
            { label: 'Ernährung', sub: 'Mahlzeiten, Makros & Supplements', icon: <Apple className="w-4 h-4" />, href: '/nutrition', color: 'text-emerald-400' },
            { label: 'Regeneration', sub: 'Erholung & Schlaf', icon: <Heart className="w-4 h-4" />, href: '/recovery', color: 'text-rose-400' },
          ].map((item) => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className="flex items-center gap-3 w-full rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-3.5 text-left">
              <div className={`rounded-lg bg-[hsl(225,12%,15%)] p-2 ${item.color}`}>{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[hsl(var(--fg-primary))]">{item.label}</p>
                <p className="text-xs text-[hsl(var(--fg-muted))]">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--fg-muted))]" />
            </button>
          ))}
        </div>

        {/* ── Profile Section ─────────────────────────────────── */}
        <Section title="Profil" subtitle="Name, Alter, Größe & Ziel" icon={<User className="w-4 h-4" />} defaultOpen>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Dein Name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} rows={2} placeholder="Optional" className={inputCls + ' resize-none'} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Alter</label><input type="number" value={ageInput} onChange={(e) => setAgeInput(e.target.value ? parseInt(e.target.value) : '')} className={inputCls} /></div>
              <div><label className={labelCls}>Größe (cm)</label><input type="number" value={heightInput} onChange={(e) => setHeightInput(e.target.value ? parseInt(e.target.value) : '')} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Level</label>
                <select value={experienceInput} onChange={(e) => setExperienceInput(e.target.value as any)} className={inputCls}>
                  <option value="beginner">Anfänger</option>
                  <option value="intermediate">Fortgeschritten</option>
                  <option value="advanced">Experte</option>
                </select>
              </div>
              <div><label className={labelCls}>Ziel</label><input type="text" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} placeholder="z. B. Muskelaufbau" className={inputCls} /></div>
            </div>
          </div>
        </Section>

        {/* ── Training Settings ────────────────────────────────── */}
        <Section title="Training" subtitle="Rest-Timer und Verhalten" icon={<Dumbbell className="w-4 h-4" />}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Standard Pause (Sekunden)</label>
              <input type="number" min={30} max={600} step={15}
                value={workoutStore.workoutSettings.defaultRestTime}
                onChange={(e) => workoutStore.updateWorkoutSettings({ defaultRestTime: parseInt(e.target.value || '90') })}
                className={inputCls} />
              <p className="mt-1 text-[10px] text-[hsl(var(--fg-muted))]">Empfohlen: 60–180 Sek.</p>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-[hsl(var(--fg-primary))]">Timer automatisch</p><p className="text-[10px] text-[hsl(var(--fg-muted))]">Nach Satzabschluss starten</p></div>
              <Toggle value={workoutStore.workoutSettings.autoStartRestTimer} onChange={(v) => workoutStore.updateWorkoutSettings({ autoStartRestTimer: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-[hsl(var(--fg-primary))]">Timer-Signal</p><p className="text-[10px] text-[hsl(var(--fg-muted))]">Sound bei Ablauf</p></div>
              <Toggle value={workoutStore.workoutSettings.restTimerSound} onChange={(v) => workoutStore.updateWorkoutSettings({ restTimerSound: v })} />
            </div>
          </div>
        </Section>

        {/* ── Nutrition Goals ──────────────────────────────────── */}
        <Section title="Ernährungsziele" subtitle="Kalorien & Makros" icon={<Apple className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'calories', label: 'Kalorien (kcal)' },
              { key: 'protein', label: 'Protein (g)' },
              { key: 'carbs', label: 'Kohlenhydrate (g)' },
              { key: 'fats', label: 'Fette (g)' },
              { key: 'water', label: 'Wasser (ml)' },
              { key: 'caffeine', label: 'Koffein (mg)' },
            ].map((item) => (
              <div key={item.key}>
                <label className={labelCls}>{item.label}</label>
                <input type="number" value={(nutritionGoals as any)[item.key]}
                  onChange={(e) => setNutritionGoals((p) => ({ ...p, [item.key]: parseInt(e.target.value || '0') }))}
                  className={inputCls} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── App Settings ─────────────────────────────────────── */}
        <Section title="App-Einstellungen" subtitle="Sprache, Darstellung" icon={<SlidersHorizontal className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Sprache</label>
                <select value={preferences.language} onChange={(e) => updatePreferences({ language: e.target.value as 'de' | 'en' })} className={inputCls}>
                  <option value="de">Deutsch</option><option value="en">English</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Kalenderansicht</label>
                <select value={preferences.calendarView} onChange={(e) => updatePreferences({ calendarView: e.target.value as any })} className={inputCls}>
                  <option value="month">Monat</option><option value="week">Woche</option><option value="year">Jahr</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-[hsl(var(--fg-primary))]">Kompakter Modus</p><p className="text-[10px] text-[hsl(var(--fg-muted))]">Dichtere Abstände</p></div>
              <Toggle value={preferences.compactMode} onChange={(v) => updatePreferences({ compactMode: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-[hsl(var(--fg-primary))]">Erweiterte Statistiken</p><p className="text-[10px] text-[hsl(var(--fg-muted))]">Detailmetriken</p></div>
              <Toggle value={preferences.showAdvancedStats} onChange={(v) => updatePreferences({ showAdvancedStats: v })} />
            </div>
          </div>
        </Section>

        {/* ── Notifications ────────────────────────────────────── */}
        <Section title="Benachrichtigungen" subtitle="Erinnerungen & Hinweise" icon={<Bell className="w-4 h-4" />}>
          <div className="space-y-2">
            {([
              ['workoutReminders', 'Training-Erinnerungen'],
              ['mealReminders', 'Mahlzeit-Erinnerungen'],
              ['waterReminders', 'Wasser-Erinnerungen'],
              ['weeklyReport', 'Wochenreport'],
              ['recoveryAlerts', 'Erholungs-Warnungen'],
              ['syncAlerts', 'Cloud-Sync Hinweise'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm font-medium text-[hsl(var(--fg-primary))]">{label}</p>
                <Toggle value={(notifications as any)[key]} onChange={(v) => updateNotifications({ [key]: v } as any)} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Logout ──────────────────────────────────────────── */}
        <button onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-bold text-rose-400">
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>

        {/* ── Footer note ─────────────────────────────────────── */}
        <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-[hsl(var(--fg-muted))] shrink-0 mt-0.5" />
          <p className="text-xs text-[hsl(var(--fg-muted))]">
            Alle Daten werden lokal gespeichert. Bei Login werden sie mit Supabase synchronisiert.
          </p>
        </div>

        {/* Bottom spacing for tab bar */}
        <div className="h-4" />
      </div>
    </DashboardLayout>
  );
}
