'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  simulationMode?: boolean;
}

export function Navbar({ simulationMode }: NavbarProps) {
  const pathname = usePathname();

  const links = [
    { label: 'Compose', href: '/' },
    { label: 'Accounts', href: '/accounts' },
    { label: 'History', href: '/history' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-medium text-sm text-neutral-100">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <span className="font-semibold tracking-tight">OmniPost</span>
        </Link>

        {/* Minimal Navigation */}
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'text-white bg-neutral-800'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mode Pill */}
        <Link
          href="/settings"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            simulationMode
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              simulationMode ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span>{simulationMode ? 'Sandbox' : 'Live Real API'}</span>
        </Link>
      </div>
    </header>
  );
}
