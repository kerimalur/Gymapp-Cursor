'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlateCalculator } from '@/components/workout/PlateCalculator';

export default function PlateCalculatorPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">🏋️ Scheiben-Rechner</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Berechne welche Hantelscheiben du für dein Zielgewicht auflegen musst
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Wie funktioniert es?</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Gib dein Zielgewicht ein</li>
            <li>• Wähle deine Langhantel (Olympia 20kg, Damen 15kg, Standard 10kg)</li>
            <li>• Der Rechner zeigt dir welche Scheiben du <strong>pro Seite</strong> auflegen musst</li>
            <li>• Farben entsprechen IPF/IWF Standard</li>
          </ul>
        </div>

        {/* Calculator */}
        <PlateCalculator />

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📊 Standard Scheiben</h3>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span>25 kg (Rot)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>20 kg (Blau)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span>15 kg (Gelb)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span>10 kg (Grün)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-300" />
                <span>5 kg (Weiß)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-300" />
                <span>2.5 kg, 1.25 kg, 0.5 kg</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">⚡ Tipps</h3>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Immer symmetrisch auf beide Seiten verteilen</li>
              <li>• Größte Scheiben nach innen (zur Stange)</li>
              <li>• Collars/Verschlüsse nicht vergessen (~2.5 kg)</li>
              <li>• Beim Aufwärmen mit leichteren Scheiben starten</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
