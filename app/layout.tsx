import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitCoach Pro – Dein Smart Gym Coach',
  description: 'Intelligenter Fitness-Coach mit automatischer Trainingsoptimierung',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitCoach Pro',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0a0f1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} bg-[hsl(225,15%,6%)]`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'hsl(225, 14%, 11%)',
                  color: 'hsl(210, 40%, 96%)',
                  border: '1px solid hsl(225, 10%, 20%)',
                  borderRadius: '1rem',
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#0a0f1a',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#0a0f1a',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
