'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Dumbbell } from 'lucide-react';
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
          throw new Error('Passwoerter stimmen nicht ueberein');
        }

        const { needsEmailConfirmation } = await signUpWithEmail(normalizedEmail, password);

        if (needsEmailConfirmation) {
          toast.success('Konto erstellt. Bitte bestaetige deine E-Mail.');
          setIsRegisterMode(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          toast.success('Konto erstellt und angemeldet!');
          router.push('/dashboard');
        }
      } else {
        await signInWithEmail(normalizedEmail, password);
        toast.success('Erfolgreich angemeldet!');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-purple-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-purple-700">
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">gym app Kerim</h1>
            <p className="text-gray-600 text-lg">Dein professioneller Fitness Tracker</p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <p className="text-gray-700">Verfolge deine Workouts und Fortschritte</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <p className="text-gray-700">Intelligentes Regenerations-Tracking</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <p className="text-gray-700">Cloud-Sync - Deine Daten sind ueberall verfuegbar</p>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="deinename@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                placeholder={isRegisterMode ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
                required
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passwort bestaetigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Passwort wiederholen"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:bg-primary-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : null}
              {isSubmitting
                ? (isRegisterMode ? 'Konto wird erstellt...' : 'Wird angemeldet...')
                : (isRegisterMode ? 'Konto erstellen' : 'Mit E-Mail anmelden')}
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
            className="w-full mt-4 text-sm font-medium text-primary-700 hover:text-primary-800 disabled:opacity-50"
          >
            {isRegisterMode
              ? 'Hast du schon ein Konto? Jetzt anmelden'
              : 'Noch kein Konto? Jetzt registrieren'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Deine Daten werden sicher in der Cloud gespeichert
          </p>
        </div>
      </div>

      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
    </div>
  );
}
