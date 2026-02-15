'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { User, Target, Dumbbell, Apple, Bell, Shield, RefreshCw, Database, Cloud, Clock, FileText, Download, FileSpreadsheet, History, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { loadAllDataFromFirebase, syncAllDataToFirebase } from '@/lib/firestore';
import { generateWorkoutHistoryPDF, generateStatisticsPDF, generateTrainingPlanPDF, exportToCSV } from '@/lib/pdfExport';
import { exerciseDatabase } from '@/data/exerciseDatabase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, syncing } = useAuthStore();
  const workoutStore = useWorkoutStore();
  const nutritionStore = useNutritionStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize from store
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: nutritionStore.nutritionGoals?.dailyCalories || 2500,
    protein: nutritionStore.nutritionGoals?.dailyProtein || 150,
    carbs: nutritionStore.nutritionGoals?.dailyCarbs || 300,
    fats: nutritionStore.nutritionGoals?.dailyFats || 80,
    water: nutritionStore.nutritionGoals?.waterGoal || 3000,
    caffeine: nutritionStore.nutritionGoals?.caffeineGoal || 400,
  });

  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    mealReminders: true,
    waterReminders: true,
    weeklyReport: true,
  });

  // Update local state when store changes
  useEffect(() => {
    if (nutritionStore.nutritionGoals) {
      setNutritionGoals({
        calories: nutritionStore.nutritionGoals.dailyCalories || 2500,
        protein: nutritionStore.nutritionGoals.dailyProtein || 150,
        carbs: nutritionStore.nutritionGoals.dailyCarbs || 300,
        fats: nutritionStore.nutritionGoals.dailyFats || 80,
        water: nutritionStore.nutritionGoals.waterGoal || 3000,
        caffeine: nutritionStore.nutritionGoals.caffeineGoal || 400,
      });
    }
  }, [nutritionStore.nutritionGoals]);

  const handleSaveNutrition = () => {
    // Actually save to store
    nutritionStore.setNutritionGoals({
      userId: user?.uid || 'local',
      dailyCalories: nutritionGoals.calories,
      dailyProtein: nutritionGoals.protein,
      dailyCarbs: nutritionGoals.carbs,
      dailyFats: nutritionGoals.fats,
      waterGoal: nutritionGoals.water,
      caffeineGoal: nutritionGoals.caffeine,
    });
    toast.success('Ernährungsziele gespeichert!');
  };

  const handleSaveNotifications = () => {
    toast.success('Benachrichtigungen aktualisiert!');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Einstellungen
          </h1>
          <p className="text-lg text-gray-600">
            Passe die App nach deinen Bedürfnissen an
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Profil</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="Dein Name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-Mail
              </label>
              <input
                type="email"
                placeholder="deine@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Nutrition Goals */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <Apple className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Ernährungsziele
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tägliche Kalorien (kcal)
              </label>
              <input
                type="number"
                value={nutritionGoals.calories}
                onChange={(e) =>
                  setNutritionGoals({
                    ...nutritionGoals,
                    calories: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                value={nutritionGoals.protein}
                onChange={(e) =>
                  setNutritionGoals({
                    ...nutritionGoals,
                    protein: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kohlenhydrate (g)
              </label>
              <input
                type="number"
                value={nutritionGoals.carbs}
                onChange={(e) =>
                  setNutritionGoals({
                    ...nutritionGoals,
                    carbs: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fette (g)
              </label>
              <input
                type="number"
                value={nutritionGoals.fats}
                onChange={(e) =>
                  setNutritionGoals({
                    ...nutritionGoals,
                    fats: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wasser-Ziel (ml)
              </label>
              <input
                type="number"
                value={nutritionGoals.water}
                onChange={(e) =>
                  setNutritionGoals({
                    ...nutritionGoals,
                    water: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Koffein-Limit (mg)
              </label>
              <input
                type="number"
                value={nutritionGoals.caffeine}
                onChange={(e) =>
                  setNutritionGoals({
                    ...nutritionGoals,
                    caffeine: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSaveNutrition}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
          >
            Speichern
          </button>
        </div>

        {/* Workout Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Dumbbell className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Trainingseinstellungen
            </h2>
          </div>

          <div className="space-y-6">
            {/* Rest Timer Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-600" />
                <label className="block text-sm font-semibold text-gray-700">
                  Rest Timer Einstellungen
                </label>
              </div>

              <div className="space-y-4">
                {/* Default Rest Time */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm text-gray-600 mb-2">
                    Standard Pausenzeit (Sekunden)
                  </label>
                  <input
                    type="number"
                    value={workoutStore.workoutSettings.defaultRestTime}
                    onChange={(e) => workoutStore.updateWorkoutSettings({
                      defaultRestTime: parseInt(e.target.value) || 90
                    })}
                    min={30}
                    max={300}
                    step={15}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.floor(workoutStore.workoutSettings.defaultRestTime / 60)}:{(workoutStore.workoutSettings.defaultRestTime % 60).toString().padStart(2, '0')} Minuten
                  </p>
                </div>

                {/* Auto-Start Rest Timer */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <span className="font-medium text-gray-900">Timer automatisch starten</span>
                    <p className="text-sm text-gray-500">Nach Abschluss eines Satzes</p>
                  </div>
                  <button
                    onClick={() => workoutStore.updateWorkoutSettings({
                      autoStartRestTimer: !workoutStore.workoutSettings.autoStartRestTimer
                    })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      workoutStore.workoutSettings.autoStartRestTimer
                        ? 'bg-primary-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        workoutStore.workoutSettings.autoStartRestTimer
                          ? 'transform translate-x-6'
                          : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Rest Timer Sound */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <span className="font-medium text-gray-900">Timer Sound & Vibration</span>
                    <p className="text-sm text-gray-500">Benachrichtigung wenn Timer endet</p>
                  </div>
                  <button
                    onClick={() => workoutStore.updateWorkoutSettings({
                      restTimerSound: !workoutStore.workoutSettings.restTimerSound
                    })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      workoutStore.workoutSettings.restTimerSound
                        ? 'bg-primary-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        workoutStore.workoutSettings.restTimerSound
                          ? 'transform translate-x-6'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Recovery Times */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Standard Regenerationszeiten (Stunden)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Große Muskelgruppen</p>
                  <input
                    type="number"
                    defaultValue={48}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Kleine Muskelgruppen</p>
                  <input
                    type="number"
                    defaultValue={24}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Benachrichtigungen
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'workoutReminders', label: 'Training-Erinnerungen' },
              { key: 'mealReminders', label: 'Mahlzeit-Erinnerungen' },
              { key: 'waterReminders', label: 'Wasser-Erinnerungen' },
              { key: 'weeklyReport', label: 'Wöchentlicher Bericht' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <span className="font-medium text-gray-900">{item.label}</span>
                <button
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      [item.key]: !notifications[item.key as keyof typeof notifications],
                    })
                  }
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications]
                      ? 'bg-primary-500'
                      : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'transform translate-x-6'
                        : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveNotifications}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
          >
            Speichern
          </button>
        </div>

        {/* Data Export Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Download className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Datenexport
            </h2>
          </div>

          <p className="text-gray-600 mb-6">
            Exportiere deine Daten als PDF oder CSV-Datei für Backups oder zur Analyse.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Workout History PDF */}
            <button
              onClick={() => {
                if (workoutStore.workoutSessions.length === 0) {
                  toast.error('Keine Trainings vorhanden');
                  return;
                }
                generateWorkoutHistoryPDF(workoutStore.workoutSessions, exerciseDatabase);
                toast.success('Trainingshistorie wird heruntergeladen...');
              }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors border-2 border-transparent hover:border-indigo-200"
            >
              <div className="p-2 bg-indigo-100 rounded-lg">
                <History className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Trainingshistorie PDF</p>
                <p className="text-sm text-gray-500">{workoutStore.workoutSessions.length} Trainings</p>
              </div>
            </button>

            {/* Statistics PDF */}
            <button
              onClick={() => {
                if (workoutStore.workoutSessions.length === 0) {
                  toast.error('Keine Statistiken vorhanden');
                  return;
                }
                // Calculate statistics for the export
                const sessions = workoutStore.workoutSessions;
                let totalVolume = 0;
                let totalSets = 0;
                const volumeByMuscle: Record<string, number> = {};
                
                sessions.forEach(session => {
                  session.exercises.forEach(ex => {
                    const exercise = exerciseDatabase.find(e => e.id === ex.exerciseId);
                    ex.sets.forEach(set => {
                      if (set.completed && !set.isWarmup) {
                        const weight = Math.abs(set.weight || 0);
                        const reps = set.reps || 0;
                        totalVolume += weight * reps;
                        totalSets++;
                        
                        const primaryMuscle = exercise?.muscles?.find(m => m.role === 'primary')?.muscle;
                        if (primaryMuscle) {
                          volumeByMuscle[primaryMuscle] = (volumeByMuscle[primaryMuscle] || 0) + (weight * reps);
                        }
                      }
                    });
                  });
                });
                
                const avgDuration = sessions.reduce((sum, s) => {
                  if (s.endTime) {
                    return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
                  }
                  return sum;
                }, 0) / sessions.length / 60000;
                
                generateStatisticsPDF(workoutStore.workoutSessions, exerciseDatabase, {
                  totalVolume,
                  workoutCount: sessions.length,
                  totalSets,
                  avgDuration,
                  volumeByMuscle: volumeByMuscle as any
                });
                toast.success('Statistiken werden heruntergeladen...');
              }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors border-2 border-transparent hover:border-green-200"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Statistiken PDF</p>
                <p className="text-sm text-gray-500">PRs & Volumen</p>
              </div>
            </button>

            {/* Training Plans PDF */}
            <button
              onClick={() => {
                if (workoutStore.trainingPlans.length === 0) {
                  toast.error('Keine Trainingspläne vorhanden');
                  return;
                }
                workoutStore.trainingPlans.forEach(plan => {
                  const planDays = workoutStore.trainingDays.filter(d => plan.trainingDays.includes(d.id));
                  generateTrainingPlanPDF(plan, planDays, exerciseDatabase);
                });
                toast.success('Trainingspläne werden heruntergeladen...');
              }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors border-2 border-transparent hover:border-purple-200"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Trainingspläne PDF</p>
                <p className="text-sm text-gray-500">{workoutStore.trainingPlans.length} Pläne</p>
              </div>
            </button>

            {/* CSV Export */}
            <button
              onClick={() => {
                if (workoutStore.workoutSessions.length === 0) {
                  toast.error('Keine Daten zum Exportieren');
                  return;
                }
                exportToCSV(workoutStore.workoutSessions, exerciseDatabase);
                toast.success('CSV wird heruntergeladen...');
              }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors border-2 border-transparent hover:border-orange-200"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">CSV Export</p>
                <p className="text-sm text-gray-500">Für Excel/Tabellen</p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-900">
              Gefahrenzone
            </h2>
          </div>
          <p className="text-red-700 mb-4">
            Diese Aktionen können nicht rückgängig gemacht werden.
          </p>
          <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
            Alle Daten löschen
          </button>
        </div>

        {/* Cloud Sync Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Cloud Sync</h2>
          </div>

          {/* Current Data Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Database className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{workoutStore.trainingDays.length}</p>
              <p className="text-sm text-gray-600">Trainingstage</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Dumbbell className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{workoutStore.trainingPlans.length}</p>
              <p className="text-sm text-gray-600">Trainingspläne</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Target className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{workoutStore.workoutSessions.length}</p>
              <p className="text-sm text-gray-600">Trainings</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Apple className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{nutritionStore.meals.length}</p>
              <p className="text-sm text-gray-600">Mahlzeiten</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={async () => {
                if (!user) {
                  toast.error('Bitte zuerst anmelden');
                  return;
                }
                setIsLoading(true);
                try {
                  const data = await loadAllDataFromFirebase(user.uid);
                  console.log('Loaded from Firebase:', data);
                  
                  const { workoutData, nutritionData } = data;
                  
                  if (workoutData.trainingDays?.length > 0) {
                    workoutStore.setTrainingDays(workoutData.trainingDays);
                  }
                  if (workoutData.trainingPlans?.length > 0) {
                    workoutStore.setTrainingPlans(workoutData.trainingPlans);
                  }
                  if (workoutData.workoutSessions?.length > 0) {
                    workoutStore.setWorkoutSessions(workoutData.workoutSessions);
                  }
                  
                  toast.success(`Daten geladen: ${workoutData.trainingDays?.length || 0} Tage, ${workoutData.workoutSessions?.length || 0} Trainings`);
                } catch (error: any) {
                  console.error('Load error:', error);
                  toast.error('Fehler beim Laden: ' + error.message);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading || syncing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Von Cloud laden
            </button>
            
            <button
              onClick={async () => {
                if (!user) {
                  toast.error('Bitte zuerst anmelden');
                  return;
                }
                setIsLoading(true);
                try {
                  await syncAllDataToFirebase(user.uid, 
                    {
                      trainingDays: workoutStore.trainingDays,
                      trainingPlans: workoutStore.trainingPlans,
                      workoutSessions: workoutStore.workoutSessions,
                    },
                    {
                      nutritionGoals: nutritionStore.nutritionGoals,
                      meals: nutritionStore.meals,
                      supplements: nutritionStore.supplements,
                    }
                  );
                  toast.success('Daten in Cloud gespeichert!');
                } catch (error: any) {
                  console.error('Sync error:', error);
                  toast.error('Fehler beim Speichern: ' + error.message);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading || syncing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Cloud className={`w-5 h-5 ${syncing ? 'animate-pulse' : ''}`} />
              In Cloud speichern
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            Eingeloggt als: {user?.email || 'Nicht angemeldet'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
