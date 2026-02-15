'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface PlateCalculatorProps {
  targetWeight?: number;
  onClose?: () => void;
}

// Standard Hantelscheiben (in kg) - Olympische Langhantel
const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
const BARBELL_WEIGHT = 20; // Standard Olympia-Langhantel

interface PlateConfig {
  weight: number;
  count: number;
  color: string;
}

function calculatePlates(targetWeight: number, barbellWeight: number = BARBELL_WEIGHT): PlateConfig[] {
  // Gewicht das auf die Scheiben verteilt werden muss (beide Seiten)
  const weightForPlates = targetWeight - barbellWeight;

  if (weightForPlates <= 0) {
    return [];
  }

  // Gewicht pro Seite
  const weightPerSide = weightForPlates / 2;

  const plates: PlateConfig[] = [];
  let remaining = weightPerSide;

  // Greedy Algorithm - größte Scheiben zuerst
  for (const plateWeight of AVAILABLE_PLATES) {
    const count = Math.floor(remaining / plateWeight);

    if (count > 0) {
      plates.push({
        weight: plateWeight,
        count,
        color: getPlateColor(plateWeight),
      });
      remaining -= count * plateWeight;
    }

    // Präzision auf 2 Dezimalstellen
    remaining = Math.round(remaining * 100) / 100;

    if (remaining < 0.01) break;
  }

  return plates;
}

// IPF/IWF Standard Farben für olympische Hantelscheiben
function getPlateColor(weight: number): string {
  switch (weight) {
    case 25: return 'bg-red-500';
    case 20: return 'bg-blue-500';
    case 15: return 'bg-yellow-500';
    case 10: return 'bg-green-500';
    case 5: return 'bg-white border-2 border-gray-300';
    case 2.5: return 'bg-red-400';
    case 1.25: return 'bg-blue-400';
    case 0.5: return 'bg-gray-300';
    default: return 'bg-gray-400';
  }
}

export function PlateCalculator({ targetWeight: initialWeight = 100, onClose }: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState(initialWeight);
  const [barbellWeight, setBarbellWeight] = useState(BARBELL_WEIGHT);

  const plates = calculatePlates(targetWeight, barbellWeight);
  const actualWeight = barbellWeight + plates.reduce((sum, p) => sum + (p.weight * p.count * 2), 0);
  const difference = targetWeight - actualWeight;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scheiben-Rechner</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Berechne welche Scheiben du auflegen musst</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="btn-icon hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Zielgewicht (kg)
          </label>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
            step={2.5}
            min={barbellWeight}
            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl
                     focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                     dark:bg-slate-700 dark:text-white outline-none transition-all text-lg font-semibold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Langhantel (kg)
          </label>
          <select
            value={barbellWeight}
            onChange={(e) => setBarbellWeight(parseFloat(e.target.value))}
            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl
                     focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                     dark:bg-slate-700 dark:text-white outline-none transition-all text-lg font-semibold"
          >
            <option value={20}>Olympia (20 kg)</option>
            <option value={15}>Damen (15 kg)</option>
            <option value={10}>Standard (10 kg)</option>
            <option value={0}>Nur Scheiben (0 kg)</option>
          </select>
        </div>
      </div>

      {/* Result Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Tatsächliches Gewicht</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{actualWeight} kg</p>
          </div>
          {Math.abs(difference) > 0.01 && (
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-300">Differenz</p>
              <p className={`text-xl font-bold ${difference > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {difference > 0 ? '+' : ''}{difference.toFixed(2)} kg
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plate Configuration */}
      {plates.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pro Seite auflegen:</h3>

          {/* List View */}
          <div className="space-y-2">
            {plates.map((plate, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${plate.color} flex items-center justify-center shadow-md`}>
                    <span className={`text-sm font-bold ${plate.weight >= 5 ? 'text-white' : 'text-slate-700'}`}>
                      {plate.weight}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{plate.weight} kg</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {plate.count} × Scheibe{plate.count > 1 ? 'n' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {plate.count}×
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(plate.weight * plate.count).toFixed(2)} kg
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Representation */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Visuelle Darstellung:</h4>
            <div className="flex items-center justify-center gap-1 p-4 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-x-auto">
              {/* Left side plates */}
              <div className="flex items-center gap-0.5">
                {plates.map((plate, plateIndex) => (
                  Array.from({ length: plate.count }).map((_, count) => (
                    <div
                      key={`left-${plateIndex}-${count}`}
                      className={`${plate.color} rounded-sm transition-all hover:scale-105`}
                      style={{
                        width: `${Math.max(8, plate.weight * 1.5)}px`,
                        height: `${Math.max(40, plate.weight * 3)}px`,
                      }}
                      title={`${plate.weight} kg`}
                    />
                  ))
                ))}
              </div>

              {/* Barbell */}
              <div className="flex flex-col items-center mx-2">
                <div className="w-32 h-3 bg-slate-600 dark:bg-slate-400 rounded-full" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  {barbellWeight} kg
                </span>
              </div>

              {/* Right side plates (mirror) */}
              <div className="flex items-center gap-0.5">
                {plates.map((plate, plateIndex) => (
                  Array.from({ length: plate.count }).map((_, count) => (
                    <div
                      key={`right-${plateIndex}-${count}`}
                      className={`${plate.color} rounded-sm transition-all hover:scale-105`}
                      style={{
                        width: `${Math.max(8, plate.weight * 1.5)}px`,
                        height: `${Math.max(40, plate.weight * 3)}px`,
                      }}
                      title={`${plate.weight} kg`}
                    />
                  ))
                ))}
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Gesamt Scheiben (beide Seiten)</p>
              <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                {plates.reduce((sum, p) => sum + p.count, 0) * 2} Scheiben
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Scheiben-Gewicht</p>
              <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                {(actualWeight - barbellWeight).toFixed(2)} kg
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">
            Zielgewicht muss höher als Langhantel-Gewicht sein
          </p>
        </div>
      )}

      {/* Quick Presets */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Schnellauswahl:</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {[60, 80, 100, 120, 140, 160].map((weight) => (
            <button
              key={weight}
              onClick={() => setTargetWeight(weight)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                targetWeight === weight
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {weight}kg
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
