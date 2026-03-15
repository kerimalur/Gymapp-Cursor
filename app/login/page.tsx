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
      <div className="flex min-h-screen items-center justify-center bg-[hsl(225,15%,6%)]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(225,15%,6%)]">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/8 blur-3xl" />
      <div className="absolute -bottom-16 -right-8 h-72 w-72 rounded-full bg-violet-500/8 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-3xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-7 backdrop-blur-sm lg:p-10">
          <div className="mb-7 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-400/20">
            <Dumbbell className="h-9 w-9" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">FitCoach Pro</h1>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">Dein Smart Gym Coach</p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-cyan-400">
              <BarChart3 className="mb-3 h-7 w-7" />
              <div className="h-2 w-full rounded bg-white/10" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-violet-400">
              <CalendarDays className="mb-3 h-7 w-7" />
              <div className="h-2 w-full rounded bg-white/10" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-emerald-400">
              <HeartPulse className="mb-3 h-7 w-7" />
              <div className="h-2 w-full rounded bg-white/10" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-[hsl(225,14%,11%)] border border-[hsl(225,10%,18%)] p-8 shadow-2xl md:p-10">
          <h2 className="mb-6 text-2xl font-bold text-[hsl(var(--fg-primary))]">{isRegisterMode ? 'Registrieren' : 'Anmelden'}</h2>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="deinename@email.com"
                className="w-full rounded-xl border-2 border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                placeholder={isRegisterMode ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
                className="w-full rounded-xl border-2 border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]"
                disabled={isSubmitting}
                required
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[hsl(var(--fg-secondary))]">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Passwort wiederholen"
                  className="w-full rounded-xl border-2 border-[hsl(225,10%,20%)] bg-[hsl(225,14%,8%)] px-4 py-3 text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-cyan-400/50 placeholder:text-[hsl(var(--fg-muted))]"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3.5 font-semibold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-cyan-500/20"
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
            className="mt-4 w-full text-sm font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            {isRegisterMode ? 'Schon ein Konto? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
