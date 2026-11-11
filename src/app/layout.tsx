import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { getSettings } from '@/lib/db';

export const metadata: Metadata = {
  title: 'OmniPost - 1-Click Multi-Account Social Broadcaster',
  description: 'Broadcast videos, photos, and posts across Instagram, Facebook, X (Twitter), and YouTube in one click.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = getSettings();

  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar simulationMode={settings.simulationMode} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-900 py-6 text-center text-xs text-gray-600">
          OmniPost Multi-Account Engine &copy; {new Date().getFullYear()} &bull; Instagram &bull; Facebook &bull; X (Twitter) &bull; YouTube
        </footer>
      </body>
    </html>
  );
}

