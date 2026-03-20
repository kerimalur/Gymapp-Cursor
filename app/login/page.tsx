'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(225,15%,6%)]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[hsl(225,15%,6%)] px-5">
      {/* Ambient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-400/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-violet-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo + Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-400/20">
            <Dumbbell className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">FitCoach Pro</h1>
          <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">Dein intelligenter Gym Coach</p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-[hsl(225,10%,16%)] bg-[hsl(225,14%,10%)] p-6 shadow-xl">
          <h2 className="mb-5 text-lg font-bold text-[hsl(var(--fg-primary))]">
            {isRegisterMode ? 'Konto erstellen' : 'Willkommen zurück'}
          </h2>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--fg-secondary))]">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="deinname@email.com"
                className="w-full rounded-xl border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,7%)] px-4 py-3 text-sm text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-[hsl(var(--fg-subtle))]"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--fg-secondary))]">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                  placeholder={isRegisterMode ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
                  className="w-full rounded-xl border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,7%)] px-4 py-3 pr-11 text-sm text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-[hsl(var(--fg-subtle))]"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-subtle))] hover:text-[hsl(var(--fg-secondary))] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--fg-secondary))]">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Passwort wiederholen"
                  className="w-full rounded-xl border border-[hsl(225,10%,20%)] bg-[hsl(225,14%,7%)] px-4 py-3 text-sm text-[hsl(var(--fg-primary))] outline-none transition-colors focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-[hsl(var(--fg-subtle))]"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-3.5 text-sm font-bold text-[hsl(225,15%,6%)] transition-all hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(225,15%,6%)] border-t-transparent" />
              ) : null}
              {isSubmitting
                ? isRegisterMode
                  ? 'Konto wird erstellt...'
                  : 'Wird angemeldet...'
                : isRegisterMode
                  ? 'Konto erstellen'
                  : 'Einloggen'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode((prev) => !prev);
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isSubmitting}
              className="text-sm font-medium text-[hsl(var(--fg-muted))] hover:text-cyan-400 transition-colors disabled:opacity-50"
            >
              {isRegisterMode ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[hsl(var(--fg-subtle))]">
          Deine Daten werden sicher in der Cloud gespeichert
        </p>
      </div>
    </div>
  );
}
