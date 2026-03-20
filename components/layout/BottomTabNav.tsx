'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Which routes belong to each tab (for active-state highlighting)
const TAB_ROUTES: Record<string, string[]> = {
  '/dashboard': ['/dashboard'],
  '/tracker': ['/tracker', '/workout', '/calendar'],
  '/statistics': ['/statistics', '/goals', '/muscle-balance'],
  '/settings': ['/settings', '/nutrition', '/recovery'],
};

const tabs = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (a: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: 'Training',
    href: '/tracker',
    icon: (a: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    label: 'Fortschritt',
    href: '/statistics',
    icon: (a: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    label: 'Profil',
    href: '/settings',
    icon: (a: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export function BottomTabNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-md px-3 pb-2 pointer-events-auto">
        <div className="flex items-center justify-around h-[60px] bg-[hsl(225,15%,8%)]/80 backdrop-blur-2xl border border-white/[0.07] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {tabs.map((tab) => {
            const isActive = TAB_ROUTES[tab.href]?.some(
              (r) => pathname === r || pathname.startsWith(r + '/')
            );
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 active:text-slate-400'
                }`}
              >
                {tab.icon(!!isActive)}
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
