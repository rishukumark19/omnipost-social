import type { Metadata } from 'next';
import './globals.css';
import { GoogleAuthHeader } from '@/components/GoogleAuthHeader';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'InstaMulti - Multi-Account Instagram Instant Broadcaster',
  description: 'Multi-account Instagram publishing platform with Google Sign-In and 1-click broadcast.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-[#dae2fd] min-h-screen flex flex-col antialiased selection:bg-rose-500 selection:text-white">
        <GoogleAuthHeader currentUser={currentUser} />
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
