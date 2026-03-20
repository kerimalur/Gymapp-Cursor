'use client';

import { BottomTabNav } from './BottomTabNav';
import { useState, useEffect } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useOfflineQueue();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWorkout = pathname === '/workout';

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--bg-primary))]">
      {/* Centered app column — mobile-first */}
      <div className="mx-auto w-full max-w-md">
        <main
          className={`px-4 pt-2 ${isWorkout ? 'pb-4' : 'pb-28'} transition-opacity duration-200 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {children}
        </main>
      </div>

      {!isWorkout && <BottomTabNav />}
    </div>
  );
}
