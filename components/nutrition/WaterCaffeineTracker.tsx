'use client';

import { useState } from 'react';
import { Droplets, Coffee, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

export function WaterCaffeineTracker() {
  const [water, setWater] = useState(0); // ml
  const [caffeine, setCaffeine] = useState(0); // mg

  const waterGoal = 3000; // ml
  const caffeineGoal = 400; // mg

  const handleAddWater = (amount: number) => {
    setWater(Math.min(water + amount, waterGoal + 1000));
    toast.success(`+${amount}ml Wasser hinzugefügt`);
  };

  const handleRemoveWater = (amount: number) => {
    setWater(Math.max(water - amount, 0));
  };

  const handleAddCaffeine = (amount: number) => {
    setCaffeine(Math.min(caffeine + amount, caffeineGoal + 200));
    toast.success(`+${amount}mg Koffein hinzugefügt`);
  };

  const handleRemoveCaffeine = (amount: number) => {
    setCaffeine(Math.max(caffeine - amount, 0));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Flüssigkeiten
      </h2>

      {/* Water Tracker */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Droplets className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Wasser</h3>
            <p className="text-sm text-gray-600">
              {water} / {waterGoal} ml
            </p>
          </div>
        </div>

        {/* Water Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all flex items-center justify-end pr-3"
              style={{ width: `${Math.min((water / waterGoal) * 100, 100)}%` }}
            >
              {water >= waterGoal * 0.3 && (
                <span className="text-white font-bold text-sm">
                  {Math.round((water / waterGoal) * 100)}%
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {waterGoal - water > 0 ? (
              <>Noch {waterGoal - water} ml bis zum Ziel</>
            ) : (
              <>Tagesziel erreicht! 🎉</>
            )}
          </p>
        </div>

        {/* Water Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleRemoveWater(250)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Minus className="w-4 h-4" />
            250ml
          </button>
          <button
            onClick={() => handleAddWater(250)}
            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            250ml
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            500ml
          </button>
          <button
            onClick={() => handleAddWater(750)}
            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            750ml
          </button>
        </div>
      </div>

      {/* Caffeine Tracker */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-orange-100 rounded-xl">
            <Coffee className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Koffein</h3>
            <p className="text-sm text-gray-600">
              {caffeine} / {caffeineGoal} mg
            </p>
          </div>
        </div>

        {/* Caffeine Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all flex items-center justify-end pr-3 ${
                caffeine > caffeineGoal
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : 'bg-gradient-to-r from-orange-400 to-orange-600'
              }`}
              style={{
                width: `${Math.min((caffeine / caffeineGoal) * 100, 100)}%`,
              }}
            >
              {caffeine >= caffeineGoal * 0.3 && (
                <span className="text-white font-bold text-sm">
                  {Math.round((caffeine / caffeineGoal) * 100)}%
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {caffeine > caffeineGoal ? (
              <span className="text-red-600 font-medium">
                ⚠️ Empfohlene Menge überschritten
              </span>
            ) : caffeineGoal - caffeine > 0 ? (
              <>Noch {caffeineGoal - caffeine} mg verfügbar</>
            ) : (
              <>Empfohlene Menge erreicht</>
            )}
          </p>
        </div>

        {/* Caffeine Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleRemoveCaffeine(80)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Minus className="w-4 h-4" />
            80mg
          </button>
          <button
            onClick={() => handleAddCaffeine(80)}
            className="px-4 py-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            80mg
          </button>
          <button
            onClick={() => handleAddCaffeine(120)}
            className="px-4 py-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            120mg
          </button>
          <button
            onClick={() => handleAddCaffeine(200)}
            className="px-4 py-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            200mg
          </button>
        </div>
      </div>
    </div>
  );
}
