'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Instagram,
  Plus,
  History,
  Users,
  Film,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { InstagramAccount } from '@/lib/types';

export function BufferSidebar() {
  const pathname = usePathname();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) setAccounts(data.accounts);
      })
      .catch((err) => console.error(err));
  }, []);

  const navItems = [
    { label: 'Publish Reel', href: '/', icon: Film },
    { label: 'Connected Accounts', href: '/accounts', icon: Users },
    { label: 'Published Reels', href: '/history', icon: History },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0 select-none">
      <div className="flex flex-col">
        {/* Instagram Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Instagram className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                InstaMulti
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Multi-Account Reels
              </span>
            </div>
          </Link>

          <span className="text-[10px] font-bold text-pink-600 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
            {accounts.length} Active
          </span>
        </div>

        {/* Primary CTA */}
        <div className="p-4 pb-2">
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Reel Broadcast</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Connected Instagram Accounts List */}
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Connected Usernames
            </span>
            <Link
              href="/accounts"
              className="text-[11px] font-bold text-pink-600 hover:underline"
            >
              + Add
            </Link>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-pink-600 p-0.5 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={acc.avatarUrl}
                      alt={acc.username}
                      className="w-full h-full rounded-full object-cover border border-white"
                    />
                  </div>
                  <span className="text-slate-800 font-bold text-xs truncate">
                    @{acc.username}
                  </span>
                </div>

                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[11px]">
            IG
          </div>
          <span className="text-xs font-bold text-slate-700">Instagram Studio</span>
        </div>
        <span className="text-[10px] text-slate-400">v2.0</span>
      </div>
    </aside>
  );
}
