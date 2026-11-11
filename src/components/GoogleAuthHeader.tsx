'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import {
  LogOut,
  ChevronDown,
  UserCheck,
  Plus,
  Sparkles,
  Instagram,
  Radio,
} from 'lucide-react';

interface GoogleAuthHeaderProps {
  currentUser: User | null;
  onUserChanged?: (user: User) => void;
}

export function GoogleAuthHeader({ currentUser: initialUser, onUserChanged }: GoogleAuthHeaderProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(initialUser);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (onUserChanged) onUserChanged(data.user);
      }
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch session', err);
    }
  };

  const handleSelectUser = async (targetUser: User) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setDropdownOpen(false);
        setModalOpen(false);
        if (onUserChanged) onUserChanged(data.user);
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch user', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customEmail.trim(),
          name: customName.trim() || customEmail.split('@')[0],
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setModalOpen(false);
        setDropdownOpen(false);
        if (onUserChanged) onUserChanged(data.user);
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to login with Google', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setDropdownOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Sign out error', err);
    }
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Instagram className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white leading-none">
                  InstaMulti
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Multi-Account Instant Broadcaster
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden md:block"></div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Publish Reel
            </Link>
            <Link
              href="/accounts"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/accounts'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Instagram Accounts
            </Link>
            <Link
              href="/history"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/history'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              History & Logs
            </Link>
          </nav>
        </div>

        {/* Right: Google Profile Capsule */}
        <div className="relative flex items-center gap-3">
          {user ? (
            <div className="flex items-center">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-full pl-1.5 pr-3 py-1 transition-all text-left shadow-xs focus:outline-hidden"
              >
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"
                    title="Google Account Active"
                  ></span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 py-0.2 rounded font-mono uppercase">
                      Google
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px] font-mono leading-none">
                    {user.email}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-[11px] font-medium text-slate-400">Signed in with Google as</p>
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <p className="text-[10px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                      Switch Google Workspace
                    </p>
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                          u.id === user.id
                            ? 'bg-rose-500/10 text-rose-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="truncate">{u.email}</span>
                        </div>
                        {u.id === user.id && <UserCheck className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-slate-800 transition-colors mt-1 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log in with another Google account</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-1 mt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs px-3.5 py-1.5 rounded-full shadow-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </header>

      {/* Google Login Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Log in with Google</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Each Google account gets a completely private and isolated Instagram broadcaster workspace.
              </p>
            </div>

            {/* Quick Pick Existing Accounts */}
            <div className="space-y-2 mb-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Choose an Account
              </p>
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-rose-400 transition-colors">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                    Select
                  </span>
                </button>
              ))}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-400 font-mono">
                  Or enter new Google email
                </span>
              </div>
            </div>

            {/* Custom Google Email Form */}
            <form onSubmit={handleCustomGoogleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rishu Kumar"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:brightness-105 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg transition-all"
              >
                {isLoading ? 'Signing in...' : 'Sign In & Create Private Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
