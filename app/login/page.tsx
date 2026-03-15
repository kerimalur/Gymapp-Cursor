'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Dumbbell, BarChart3, CalendarDays, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (!normalizedEmail || !password) {
        throw new Error('Bitte E-Mail und Passwort eingeben');
      }

      if (isRegisterMode) {
        if (password.length < 6) {
          throw new Error('Passwort muss mindestens 6 Zeichen haben');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwörter stimmen nicht überein');
        }

        const { needsEmailConfirmation } = await signUpWithEmail(normalizedEmail, password);

        if (needsEmailConfirmation) {
          toast.success('Konto erstellt. Bitte bestätige deine E-Mail.');
          setIsRegisterMode(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          toast.success('Konto erstellt und angemeldet');
          router.push('/dashboard');
        }
      } else {
        await signInWithEmail(normalizedEmail, password);
        toast.success('Erfolgreich angemeldet');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-16 -right-8 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-7 backdrop-blur-sm lg:p-10">
          <div className="mb-7 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-lg">
            <Dumbbell className="h-9 w-9" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Gym App Kerim</h1>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white">
              <BarChart3 className="mb-3 h-7 w-7" />
              <div className="h-2 w-full rounded bg-white/20" />
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white">
              <CalendarDays className="mb-3 h-7 w-7" />
              <div className="h-2 w-full rounded bg-white/20" />
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white">
              <HeartPulse className="mb-3 h-7 w-7" />
              <div className="h-2 w-full rounded bg-white/20" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">{isRegisterMode ? 'Registrieren' : 'Anmelden'}</h2>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="deinename@email.com"
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                placeholder={isRegisterMode ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Passwort wiederholen"
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-colors focus:border-blue-500"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 font-semibold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" /> : null}
              {isSubmitting
                ? isRegisterMode
                  ? 'Konto wird erstellt...'
                  : 'Wird angemeldet...'
                : isRegisterMode
                  ? 'Konto erstellen'
                  : 'Einloggen'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsRegisterMode((prev) => !prev);
              setPassword('');
              setConfirmPassword('');
            }}
            disabled={isSubmitting}
            className="mt-4 w-full text-sm font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50"
          >
            {isRegisterMode ? 'Schon ein Konto? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
