'use client';

import React, { useState } from 'react';
import { InstagramAccount } from '@/lib/types';
import {
  Instagram,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  KeyRound,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface InstagramAccountsStripProps {
  accounts: InstagramAccount[];
  onAccountAdded?: () => void;
  onRefresh?: () => void;
}

export function InstagramAccountsStrip({
  accounts,
  onAccountAdded,
  onRefresh,
}: InstagramAccountsStripProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<'sessionid' | 'password' | 'demo'>('sessionid');
  const [username, setUsername] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [followers, setFollowers] = useState('18.4K');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showCookieGuide, setShowCookieGuide] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername && authMethod !== 'sessionid') {
      setErrorNotice('Instagram username is required.');
      return;
    }

    if (authMethod === 'sessionid' && !sessionId.trim()) {
      setErrorNotice('Please paste your Instagram sessionid cookie value.');
      return;
    }

    if (authMethod === 'password' && !password.trim()) {
      setErrorNotice('Password is required for direct login.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: cleanUsername || 'instagram_user',
        username: cleanUsername,
        followers: followers.trim() || '1.2K',
        credentials: {
          username: cleanUsername,
          sessionid: authMethod === 'sessionid' ? sessionId.trim() : undefined,
          password: authMethod === 'password' ? password.trim() : undefined,
        },
        isSimulated: authMethod === 'demo',
      };

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setUsername('');
        setSessionId('');
        setPassword('');
        setModalOpen(false);
        if (onAccountAdded) onAccountAdded();
        if (onRefresh) onRefresh();
      } else {
        setErrorNotice(data.error || 'Failed to connect account');
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Error connecting account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (acc: InstagramAccount) => {
    setIsVerifying(acc.id);
    try {
      const res = await fetch('/api/accounts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: acc.id,
          accountId: acc.id,
          username: acc.username,
          credentials: acc.credentials,
        }),
      });
      const data = await res.json();
      if (data.status === 'valid') {
        const followerCount = data.followers ? ` (${data.followers.toLocaleString()} followers)` : '';
        setVerifyStatus((prev) => ({ ...prev, [acc.id]: `Active session verified${followerCount}` }));
      } else {
        setVerifyStatus((prev) => ({
          ...prev,
          [acc.id]: data.error ? `Notice: ${data.error}` : 'Session expired',
        }));
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setVerifyStatus((prev) => ({ ...prev, [acc.id]: 'Verification failed' }));
    } finally {
      setIsVerifying(null);
    }
  };

  return (
    <section className="w-full bg-slate-900/60 border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Connected Instagram Accounts ({accounts.length})
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/80 text-[10px] text-rose-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            <span>Meta Graph Sync Active</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          title="Refresh accounts"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Sync Health</span>
        </button>
      </div>

      {/* Account Cards Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
        {accounts.map((acc) => {
          const isVerifiedMessage = verifyStatus[acc.id];
          return (
            <div
              key={acc.id}
              className="flex-shrink-0 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl p-2.5 flex items-center gap-3 transition-all min-w-[230px]"
            >
              {/* Instagram Story Gradient Ring Avatar */}
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex-shrink-0">
                <div className="bg-slate-900 p-0.5 rounded-full">
                  <img
                    src={acc.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'}
                    alt={acc.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-white truncate">
                    @{acc.username}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                      acc.status === 'active'
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                        : 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        acc.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    ></span>
                    {acc.status === 'active' ? 'Active' : 'Expired'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span>{acc.followers || '14.8K'} followers</span>
                  <button
                    onClick={() => handleVerify(acc)}
                    disabled={isVerifying === acc.id}
                    className="text-rose-400 hover:text-rose-300 hover:underline transition-colors ml-1 font-semibold"
                  >
                    {isVerifying === acc.id ? 'Checking...' : 'Verify'}
                  </button>
                </div>

                {isVerifiedMessage && (
                  <p className="text-[9px] text-slate-300 font-mono mt-1 truncate">
                    {isVerifiedMessage}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Connect Instagram Action Card */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex-shrink-0 border border-dashed border-slate-700 hover:border-rose-500 bg-slate-800/30 hover:bg-slate-800/70 text-slate-400 hover:text-white rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-medium transition-all group min-w-[210px] justify-center"
        >
          <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <span>+ Connect Instagram Account</span>
        </button>
      </div>

      {/* Connect Instagram Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Connect Instagram Creator Profile</h3>
                <p className="text-xs text-slate-400">
                  Select your preferred connection method for this Google workspace.
                </p>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl mb-4 text-xs font-medium border border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMethod('sessionid')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === 'sessionid'
                    ? 'bg-rose-500 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Session Cookie</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === 'password'
                    ? 'bg-rose-500 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('demo')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === 'demo'
                    ? 'bg-rose-500 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Account</span>
              </button>
            </div>

            {errorNotice && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-xl text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorNotice}</span>
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Instagram @username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500">@</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. benjamin.taless"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              {authMethod === 'sessionid' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Instagram <code className="text-rose-400">sessionid</code> Cookie Value <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCookieGuide(!showCookieGuide)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 underline"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Where to find this?</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. 14569139723%3AnNUoCr22kzE2Ba%3A15%3A..."
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />

                  {showCookieGuide && (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1.5 leading-relaxed font-mono">
                      <p className="font-semibold text-rose-400">💡 How to copy sessionid in 10 seconds:</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[10px]">
                        <li>Open <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-rose-400 underline">instagram.com</a> in your browser where you are logged in.</li>
                        <li>Press <kbd className="bg-slate-800 px-1 rounded">F12</kbd> (or Right Click → Inspect).</li>
                        <li>Click <strong>Application</strong> tab (or <strong>Storage</strong> on Firefox) → <strong>Cookies</strong> → <code className="text-rose-400">https://www.instagram.com</code>.</li>
                        <li>Find the row named <code className="text-white bg-slate-800 px-1 py-0.2 rounded">sessionid</code> and double-click to copy its value!</li>
                      </ol>
                      <p className="text-[10px] text-emerald-400">✨ 100% bypass of 2FA and bot challenges!</p>
                    </div>
                  )}
                </div>
              )}

              {authMethod === 'password' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your Instagram password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    InstaMulti will authenticate with Instagram and save an encrypted session.
                  </p>
                </div>
              )}

              {authMethod === 'demo' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Followers Count (Display)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 54.2K"
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Demo accounts simulate genuine broadcasts and live Reel preview overlays without hitting Instagram limits.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-105 shadow-md shadow-rose-500/20"
                >
                  {isSubmitting ? 'Authenticating...' : 'Connect Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
