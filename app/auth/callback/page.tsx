'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase will handle the OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          // Redirect to login if no session
          router.push('/login');
        }
      } catch (error) {
        console.error('Error handling callback:', error);
        router.push('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-white text-lg font-medium">Verarbeite Anmeldung...</p>
      </div>
    </div>
  );
}
