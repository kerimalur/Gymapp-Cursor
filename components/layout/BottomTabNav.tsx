'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const tabIcons = {
  home: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 6a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7zm-10 2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
    </svg>
  ),
  training: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  goals: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
  statistics: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  mehr: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
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
};

const mainTabs = [
  { label: 'Home', href: '/dashboard', icon: 'home' as const },
  { label: 'Training', href: '/tracker', icon: 'training' as const },
  { label: 'Ziele', href: '/goals', icon: 'goals' as const },
  { label: 'Statistiken', href: '/statistics', icon: 'statistics' as const },
  { label: 'Mehr', href: null, icon: 'mehr' as const },
];

const moreItems = [
  { label: 'Regeneration', href: '/recovery', icon: 'recovery' as const },
  { label: 'Kalender', href: '/calendar', icon: 'calendar' as const },
  { label: 'Ernährung', href: '/nutrition', icon: 'nutrition' as const },
  { label: 'Einstellungen', href: '/settings', icon: 'settings' as const },
];

const moreHrefs = moreItems.map((i) => i.href);

export function BottomTabNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate sheet in/out
  useEffect(() => {
    if (sheetOpen) {
      // Small delay so the element is in the DOM before the translate transition starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSheetVisible(true));
      });
    } else {
      setSheetVisible(false);
    }
  }, [sheetOpen]);

  const handleOpenSheet = () => setSheetOpen(true);

  const handleCloseSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSheetOpen(false), 300);
  };

  const handleNavigate = (href: string) => {
    handleCloseSheet();
    setTimeout(() => router.push(href), 50);
  };

  const handleLogout = async () => {
    handleCloseSheet();
    try {
      await logout();
      toast.success('Erfolgreich abgemeldet');
      router.push('/login');
    } catch {
      toast.error('Fehler beim Abmelden');
    }
  };

  if (!mounted) return null;

  const isMoreActive = moreHrefs.includes(pathname) || pathname === '/settings';

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[hsl(225,14%,9%)]/95 backdrop-blur-xl border-t border-[hsl(225,10%,16%)] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]" style={{ height: 56 }}>
        <div className="flex items-stretch h-full">
          {mainTabs.map((tab) => {
            const isMehr = tab.href === null;
            const isActive = isMehr
              ? isMoreActive || sheetOpen
              : pathname === tab.href;

            return (
              <button
                key={tab.label}
                onClick={isMehr ? handleOpenSheet : () => router.push(tab.href!)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative focus:outline-none"
                aria-label={tab.label}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                  {tabIcons[tab.icon]}
                </span>
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Sheet */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseSheet}
            aria-hidden="true"
          />

          {/* Slide-up Sheet */}
          <div
            className={`lg:hidden fixed inset-x-0 bottom-0 z-50 bg-[hsl(225,14%,10%)] border-t border-[hsl(225,10%,20%)] rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[hsl(225,10%,25%)]" />
            </div>

            {/* Title */}
            <div className="px-5 pt-2 pb-3 border-b border-[hsl(225,10%,16%)]">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Mehr</p>
            </div>

            {/* Nav Items */}
            <ul className="py-2">
              {moreItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors duration-150 ${
                        isActive
                          ? 'text-cyan-400 bg-cyan-400/10'
                          : 'text-slate-300 hover:bg-white/5 active:bg-white/10'
                      }`}
                    >
                      <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                        {tabIcons[item.icon]}
                      </span>
                      <span className="font-medium text-sm">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Divider */}
            <div className="mx-5 border-t border-[hsl(225,10%,16%)]" />

            {/* Logout */}
            <div className="py-2 pb-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition-colors duration-150"
              >
                <span className="text-red-400">{tabIcons.logout}</span>
                <span className="font-medium text-sm">Abmelden</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
