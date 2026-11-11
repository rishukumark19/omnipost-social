import type { Metadata } from 'next';
import './globals.css';
import { BufferSidebar } from '@/components/BufferSidebar';

export const metadata: Metadata = {
  title: 'InstaMulti - Multi-Account Instagram Reels Broadcaster',
  description: 'Connect multiple Instagram accounts and broadcast Reels to all of them in 1 click.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900 min-h-screen flex antialiased">
        <BufferSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
