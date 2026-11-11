'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Send,
  Calendar,
  Layers,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  History,
  CheckCircle2,
} from 'lucide-react';
import { SocialAccount } from '@/lib/types';

export function BufferSidebar() {
  const pathname = usePathname();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) setAccounts(data.accounts);
      })
      .catch((err) => console.error(err));
  }, []);

  const navItems = [
    { label: 'Create Post', href: '/', icon: Send },
    { label: 'Sent History', href: '/history', icon: History },
    { label: 'Channels', href: '/accounts', icon: Layers },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-red-500" />;
      case 'twitter':
        return <Twitter className="w-3.5 h-3.5 text-sky-500" />;
      case 'facebook':
        return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0 select-none">
      <div className="flex flex-col">
        {/* Buffer Top Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Iconic Buffer 3-layers Logo */}
            <div className="w-8 h-8 rounded-lg bg-[#2C4BFF] flex flex-col items-center justify-center gap-1 shadow-sm shadow-blue-500/20">
              <div className="w-4 h-1 bg-white rounded-full"></div>
              <div className="w-4 h-1 bg-white/80 rounded-full"></div>
              <div className="w-4 h-1 bg-white/60 rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                Buffer
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Publishing Hub
              </span>
            </div>
          </Link>

          {/* Org pill */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
            <span>CrossTech</span>
          </div>
        </div>

        {/* Create Post Button */}
        <div className="p-4 pb-2">
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-lg bg-[#2C4BFF] hover:bg-[#1E3A8A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Post</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="px-3 py-2 space-y-0.5">
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Publishing
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#2C4BFF]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2C4BFF]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Connected Channels List (Buffer Signature Feature) */}
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Connected Channels ({accounts.length})
            </span>
            <Link
              href="/accounts"
              className="text-[11px] font-semibold text-[#2C4BFF] hover:underline"
            >
              + Add
            </Link>
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {accounts.map((acc) => (
              <Link
                key={acc.id}
                href="/accounts"
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={acc.avatarUrl}
                      alt={acc.name}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                      {getPlatformIcon(acc.platform)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-700 font-medium truncate block text-xs group-hover:text-slate-900">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {acc.handle}
                    </span>
                  </div>
                </div>

                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            RK
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-tight">Rishu Kumar</span>
            <span className="text-[10px] text-slate-400">Team Admin</span>
          </div>
        </div>

        <Link
          href="/settings"
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}
