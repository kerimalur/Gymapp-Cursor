'use client';

import { Sidebar } from './Sidebar';
import { BottomTabNav } from './BottomTabNav';
import { useState, useEffect } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { FloatingQuickActions } from '@/components/ui/FloatingQuickActions';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function DashboardLayout({ children, showSidebar = true }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Initialize offline queue processing
  useOfflineQueue();

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldShowQuickActions = showSidebar && pathname !== '/workout';
  const shouldShowBottomNav = showSidebar && pathname !== '/workout';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[hsl(var(--bg-primary))] relative overflow-x-hidden">
      {/* Subtle ambient background — no heavy blurs/orbs on mobile */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-400/[0.03] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Sidebar - Desktop only */}
      {showSidebar && <Sidebar />}

      {/* Main Content */}
      <div className={`relative z-10 ${showSidebar ? 'lg:ml-64' : ''}`}>
        <main className={`px-4 pt-4 pb-24 sm:px-5 md:px-6 lg:px-8 lg:pt-6 lg:pb-8 ${mounted ? '' : 'opacity-0'}`}>
          {children}
        </main>
      </div>

      {shouldShowQuickActions && <FloatingQuickActions />}
      {shouldShowBottomNav && <BottomTabNav />}
    </div>
  );
}
