'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Check,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import { SocialAccount, Platform } from '@/lib/types';
import { PlatformBadge } from '@/components/PlatformIcon';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);

  // Credentials
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [twitterAccessToken, setTwitterAccessToken] = useState('');
  const [twitterAccessSecret, setTwitterAccessSecret] = useState('');
  const [bearerToken, setBearerToken] = useState('');

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
    if (!confirm('Disconnect this channel?')) return;
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
    if (!name || !handle) {
      setErrorMsg('Channel name and handle are required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      platform: selectedPlatform,
      name,
      handle,
      isSimulated,
      credentials: {
        instagramAccountId: selectedPlatform === 'instagram' ? instagramAccountId : undefined,
        accessToken: selectedPlatform === 'instagram' || selectedPlatform === 'facebook' ? accessToken : undefined,
        pageId: selectedPlatform === 'facebook' ? pageId : undefined,
        apiKey: selectedPlatform === 'twitter' ? apiKey : undefined,
        apiSecret: selectedPlatform === 'twitter' ? apiSecret : undefined,
        twitterAccessToken: selectedPlatform === 'twitter' ? twitterAccessToken : undefined,
        twitterAccessSecret: selectedPlatform === 'twitter' ? twitterAccessSecret : undefined,
        bearerToken: selectedPlatform === 'twitter' ? bearerToken : undefined,
      },
    };

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save channel');

      setIsModalOpen(false);
      setName('');
      setHandle('');
      fetchAccounts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving channel');
    } finally {
      setSaving(false);
    }
  };

  const linkLocalEngineAccount = async (platform: Platform) => {
    const payload =
      platform === 'instagram'
        ? {
            platform: 'instagram',
            name: 'Benjamin Tales (Real Instagram)',
            handle: '@benjamin.taless',
            isSimulated: false,
            credentials: {
              sessionFile: 'D:\\ai video editing with image\\insta_session.json',
            },
          }
        : {
            platform: 'youtube',
            name: 'My YouTube Channel',
            handle: '@YouTubeChannel',
            isSimulated: false,
            credentials: {
              tokenFile: 'D:\\ai video editing with image\\yt credential\\yt_token.pickle',
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Manage Channels
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect and configure accounts for multi-network publishing
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#2C4BFF] hover:bg-[#1E3A8A] text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Connect New Channel</span>
        </button>
      </div>

      {/* Auto-link Local Workspace Sessions */}
      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-[#2C4BFF]" />
          <span className="font-medium">
            Pre-authenticated credentials found in your workspace:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => linkLocalEngineAccount('instagram')}
            className="px-3 py-1.5 rounded-lg border border-pink-200 bg-white text-pink-700 hover:bg-pink-50 font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Link @benjamin.taless (Real IG)</span>
          </button>
          <button
            onClick={() => linkLocalEngineAccount('youtube')}
            className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>Link YouTube Channel</span>
          </button>
        </div>
      </div>

      {/* Channel Cards Grid (Buffer Style) */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#2C4BFF]" />
          <span>Loading channels...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-500 text-xs p-6">
          No channels connected yet. Click "Connect New Channel" above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={acc.avatarUrl}
                    alt={acc.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {acc.name}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block">
                      {acc.handle}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <PlatformBadge platform={acc.platform} />
                      {acc.isSimulated && (
                        <span className="text-[9px] font-mono px-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          SIMULATED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(acc.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                  title="Disconnect Channel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Connected &amp; Ready
                </span>
                <span>Added {new Date(acc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Channel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Connect Channel</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selection */}
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
                  { id: 'twitter', label: 'X', icon: Twitter, color: 'text-sky-600' },
                  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                ] as const
              ).map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPlatform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                      isSelected
                        ? 'border-[#2C4BFF] bg-blue-50/80 text-slate-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${p.color}`} />
                    <span className="text-[11px]">{p.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Account / Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Agency Instagram"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#2C4BFF]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Handle / ID</label>
                <input
                  type="text"
                  placeholder="@handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#2C4BFF]"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Simulation Mode</span>
                  <span className="text-[11px] text-slate-500">Test multi-publishing without live API tokens.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSimulated}
                  onChange={(e) => setIsSimulated(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2C4BFF] border-slate-300"
                />
              </div>

              {!isSimulated && selectedPlatform === 'twitter' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-700 font-bold block">X (Twitter) Keys:</span>
                  <input
                    type="password"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="password"
                    placeholder="API Key Secret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="password"
                    placeholder="Access Token"
                    value={twitterAccessToken}
                    onChange={(e) => setTwitterAccessToken(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="password"
                    placeholder="Access Token Secret"
                    value={twitterAccessSecret}
                    onChange={(e) => setTwitterAccessSecret(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              )}

              {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2C4BFF] hover:bg-[#1E3A8A] text-white"
                >
                  {saving ? 'Connecting...' : 'Connect Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
