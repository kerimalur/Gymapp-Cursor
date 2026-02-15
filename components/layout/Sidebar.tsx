'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Modern minimal icons as inline SVGs for cleaner look
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 6a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7zm-10 2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
    </svg>
  ),
  tracker: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  recovery: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  statistics: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  nutrition: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
  collapse: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  expand: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
  plates: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
    </svg>
  ),
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', highlight: false },
  { name: 'Tracker', href: '/tracker', icon: 'tracker', highlight: true },
  { name: 'Statistiken', href: '/statistics', icon: 'statistics', highlight: false },
  { name: 'Muskelbalance', href: '/muscle-balance', icon: 'statistics', highlight: false },
  { name: 'Regeneration', href: '/recovery', icon: 'recovery', highlight: false },
  { name: 'Kalender', href: '/calendar', icon: 'calendar', highlight: false },
  { name: 'Scheiben-Rechner', href: '/plate-calculator', icon: 'plates', highlight: false },
  { name: 'Ernährung', href: '/nutrition', icon: 'nutrition', highlight: false },
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, syncing } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Erfolgreich abgemeldet');
    } catch (error) {
      toast.error('Fehler beim Abmelden');
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    // Close mobile menu after navigation
    if (onMobileClose) {
      setTimeout(() => onMobileClose(), 150);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Overlay - only on mobile when menu is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-out
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
      {/* Glass Background */}
      <div className="absolute inset-0 card-glass border-r" style={{ borderRadius: 0 }} />
      
      {/* Gradient Accent at Top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[hsl(var(--primary)/0.08)] to-transparent pointer-events-none" />

      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[hsl(var(--border-light))]">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-slide-in-right">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-[hsl(var(--primary)/0.3)]">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[hsl(var(--success))] rounded-full border-2 border-[hsl(var(--bg-elevated))]" />
              </div>
              <span className="font-bold text-lg text-primary tracking-tight">FitTrack</span>
            </div>
          )}
          {/* Hide collapse button on mobile, show only on desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-icon hidden lg:flex"
          >
            {collapsed ? icons.expand : icons.collapse}
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className={`px-3 py-4 border-b border-[hsl(var(--border-light))] ${collapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="relative group">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-10 h-10 rounded-xl ring-2 ring-[hsl(var(--bg-elevated))] shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--bg-tertiary))] to-[hsl(var(--bg-secondary))] flex items-center justify-center ring-2 ring-[hsl(var(--bg-elevated))] shadow-sm">
                    <span className="text-sm font-semibold text-secondary">
                      {user.displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                {/* Sync indicator */}
                {syncing && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[hsl(var(--primary))] rounded-full border-2 border-[hsl(var(--bg-elevated))] animate-pulse-soft" />
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 animate-slide-in-right">
                  <p className="text-sm font-semibold text-primary truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = icons[item.icon as keyof typeof icons];

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'gradient-primary text-white shadow-lg shadow-[hsl(var(--primary)/0.3)]'
                      : item.highlight
                      ? 'text-secondary hover:bg-[hsl(var(--primary-light))] hover:text-brand'
                      : 'text-muted hover:bg-[hsl(var(--bg-tertiary))] hover:text-secondary'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full -ml-2" />
                  )}
                  
                  <span className={`flex-shrink-0 transition-transform duration-200 ${
                    isActive ? '' : 'group-hover:scale-110'
                  }`}>
                    {Icon}
                  </span>
                  
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}

                  {/* Highlight badge for main features */}
                  {item.highlight && !isActive && !collapsed && (
                    <div className="ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 mx-3 divider" />

          {/* Settings */}
          <button
            onClick={() => handleNavigation('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              pathname === '/settings'
                ? 'bg-[hsl(var(--bg-tertiary))] text-primary'
                : 'text-muted hover:bg-[hsl(var(--bg-tertiary))] hover:text-secondary'
            }`}
          >
            {icons.settings}
            {!collapsed && <span className="font-medium text-sm">Einstellungen</span>}
          </button>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[hsl(var(--border-light))]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:bg-[hsl(var(--error-light))] hover:text-[hsl(var(--error))] transition-all duration-200 group"
          >
            <span className="group-hover:rotate-12 transition-transform duration-200">
              {icons.logout}
            </span>
            {!collapsed && <span className="font-medium text-sm">Abmelden</span>}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
