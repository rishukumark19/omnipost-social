import type { Metadata } from 'next';
import './globals.css';
import { BufferSidebar } from '@/components/BufferSidebar';

export const metadata: Metadata = {
  title: 'Buffer - All-in-one Social Media Toolkit for Creators',
  description: 'Tell your brand story and grow an audience on Instagram, YouTube, X, and Facebook with Buffer.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900 min-h-screen flex antialiased">
        {/* Left Buffer Sidebar */}
        <BufferSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
