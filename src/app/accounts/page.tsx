'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Instagram,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  KeyRound,
  Lock,
  HelpCircle,
} from 'lucide-react';
import { InstagramAccount } from '@/lib/types';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [authMethod, setAuthMethod] = useState<'sessionid' | 'password' | 'demo'>('sessionid');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [followers, setFollowers] = useState('18.2K');
  const [showCookieGuide, setShowCookieGuide] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verification states
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyNotice, setVerifyNotice] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) setAccounts(data.accounts);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Disconnect this Instagram account from your workspace?')) return;
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (acc: InstagramAccount) => {
    setVerifyingId(acc.id);
    setVerifyNotice(null);
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
        const followerText = data.followers ? ` (${data.followers.toLocaleString()} followers)` : '';
        setVerifyNotice({ id: acc.id, msg: `Session Valid & Active!${followerText}` });
        fetchAccounts();
      } else {
        setVerifyNotice({ id: acc.id, msg: data.error || 'Session expired', isError: true });
      }
    } catch (err: any) {
      setVerifyNotice({ id: acc.id, msg: err.message || 'Verification error', isError: true });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.trim().replace(/^@/, '');
    if (!cleanUser) {
      setErrorMsg('Instagram username is required.');
      return;
    }

    if (authMethod === 'sessionid' && !sessionId.trim()) {
      setErrorMsg('Please paste your sessionid cookie value.');
      return;
    }

    if (authMethod === 'password' && !password.trim()) {
      setErrorMsg('Password is required for direct login.');
      return;
    }

    setSaving(true);

    const payload = {
      name: name || cleanUser,
      username: cleanUser,
      followers: followers || '10K',
      isSimulated: authMethod === 'demo',
      credentials: {
        username: cleanUser,
        sessionid: authMethod === 'sessionid' ? sessionId.trim() : undefined,
        password: authMethod === 'password' ? password.trim() : undefined,
      },
    };

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add account');

      setName('');
      setUsername('');
      setSessionId('');
      setPassword('');
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect Instagram account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Instagram Profiles
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your connected Instagram creator accounts in this private Google workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAccounts}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-105 shadow-md shadow-rose-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Connect Instagram Account</span>
          </button>
        </div>
      </div>

      {/* Account Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          <span>Loading workspace accounts...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-rose-400 flex items-center justify-center mx-auto">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Instagram Accounts Connected</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Connect your first Instagram profile to enable instant multi-account Reel broadcasting.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isVerifying = verifyingId === acc.id;
            const notice = verifyNotice?.id === acc.id ? verifyNotice : null;

            return (
              <div
                key={acc.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex-shrink-0">
                        <div className="bg-slate-900 p-0.5 rounded-full">
                          <img
                            src={acc.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'}
                            alt={acc.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">
                          @{acc.username}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {acc.followers || '14.8K'} followers
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Disconnect account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
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
                      {acc.status === 'active' ? 'Active Session' : 'Needs Reconnection'}
                    </span>

                    {acc.isSimulated && (
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        Simulated
                      </span>
                    )}
                  </div>

                  {/* Notice feedback */}
                  {notice && (
                    <div
                      className={`p-2 rounded-lg text-[11px] font-mono mb-3 ${
                        notice.isError
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {notice.msg}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {acc.id.slice(0, 12)}
                  </span>

                  <button
                    onClick={() => handleVerify(acc)}
                    disabled={isVerifying}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-white transition-colors"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Verify Session</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
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

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-xl text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddAccount} className="space-y-3.5">
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-105 shadow-md shadow-rose-500/20"
                >
                  {saving ? 'Connecting...' : 'Connect Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
