'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Check,
  Instagram,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { InstagramAccount } from '@/lib/types';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!confirm('Disconnect this Instagram account?')) return;
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setErrorMsg('Instagram username is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const cleanUser = username.trim().replace(/^@/, '');

    const payload = {
      name: name || cleanUser,
      username: cleanUser,
      isSimulated,
      credentials: {
        username: cleanUser,
        password: password || undefined,
      },
    };

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save account');

      setIsModalOpen(false);
      setName('');
      setUsername('');
      setPassword('');
      fetchAccounts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving account');
    } finally {
      setSaving(false);
    }
  };

  const linkBenjaminAccount = async () => {
    const payload = {
      name: 'Benjamin Tales',
      username: 'benjamin.taless',
      isSimulated: false,
      credentials: {
        sessionFile: 'D:\\ai video editing with image\\insta_session.json',
        username: 'benjamin.taless',
      },
    };

    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const quickAddTestAccount = async () => {
    const rand = Math.floor(100 + Math.random() * 900);
    const payload = {
      name: `Test Creator #${rand}`,
      username: `creator_${rand}`,
      isSimulated: true,
      credentials: {},
    };

    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Instagram className="w-6 h-6 text-pink-600" />
            <span>Connected Instagram Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all the Instagram profiles you broadcast Reels to simultaneously
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Instagram Account</span>
          </button>
        </div>
      </div>

      {/* Auto-link banner */}
      <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-pink-600" />
          <span className="font-medium">
            Workspace session file found for <strong>@benjamin.taless</strong>:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={linkBenjaminAccount}
            className="px-3 py-1.5 rounded-lg border border-pink-300 bg-white text-pink-700 hover:bg-pink-100 font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Link @benjamin.taless</span>
          </button>
          <button
            onClick={quickAddTestAccount}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Add Test Sim Account</span>
          </button>
        </div>
      </div>

      {/* Accounts List (Clear, readable UI with username) */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
          <span>Loading Instagram accounts...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-500 text-xs p-6">
          No Instagram accounts connected yet. Click "+ Add Instagram Account" to add your first profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-pink-300 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5 flex-shrink-0 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={acc.avatarUrl}
                      alt={acc.username}
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-slate-900 truncate block">
                      @{acc.username}
                    </span>
                    <span className="text-xs text-slate-400 truncate block">
                      {acc.name}
                    </span>
                    {acc.isSimulated && (
                      <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                        SIMULATED
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(acc.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Disconnect Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Ready to Broadcast
                </span>
                <span className="text-slate-400 font-normal text-[11px]">
                  Added {new Date(acc.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Instagram Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-600" />
                <span className="text-sm font-bold text-slate-900">
                  Connect Instagram Account
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Add your Instagram username. OmniPost will securely publish Reels using your credentials or session.
            </p>

            <form onSubmit={handleAddAccount} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Instagram Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Display Name / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Personal Account or Brand Page"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password (Optional if session exists)</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
                <span className="text-[10px] text-slate-400">
                  Used by instagrapi to authenticate and dump a local session file.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Simulation Test Mode</span>
                  <span className="text-[11px] text-slate-500">Mock responses for testing the UI flow.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSimulated}
                  onChange={(e) => setIsSimulated(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-600 border-slate-300"
                />
              </div>

              {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {saving ? 'Connecting...' : 'Connect Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
