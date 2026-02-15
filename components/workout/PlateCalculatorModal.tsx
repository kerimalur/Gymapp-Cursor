'use client';

import { PlateCalculator } from './PlateCalculator';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetWeight?: number;
}

export function PlateCalculatorModal({ isOpen, onClose, targetWeight }: PlateCalculatorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-300">
        <PlateCalculator targetWeight={targetWeight} onClose={onClose} />
      </div>
    </div>
  );
}
