'use client';

import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function DashboardLayout({ children, showSidebar = true }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize offline queue processing
  useOfflineQueue();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [children]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen app-background relative overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="gradient-mesh" />

      {/* Dot Pattern Overlay */}
      <div className="pattern-dots" />

      {/* Floating Orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />

      {/* Mobile Header - Only visible on mobile */}
      {showSidebar && (
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 card-glass border-b border-[hsl(var(--border-light))] flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="font-bold text-base text-primary">FitTrack</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon p-2"
            aria-label="Menu öffnen"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Sidebar - Desktop always visible, Mobile as overlay */}
      {showSidebar && <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />}

      {/* Main Content */}
      <div className={`relative z-10 transition-all duration-300 ${showSidebar ? 'lg:ml-64' : ''} ${showSidebar ? 'pt-14 lg:pt-0' : ''}`}>
        <main className={`p-3 sm:p-4 md:p-6 lg:p-8 mobile-scroll-smooth ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
