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
    if (!confirm('Remove this account?')) return;
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
      setErrorMsg('Name and handle are required.');
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
      if (!res.ok) throw new Error(data.error || 'Failed to save account');

      setIsModalOpen(false);
      setName('');
      setHandle('');
      fetchAccounts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving account');
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
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-100">Connected Accounts</h1>
          <p className="text-xs text-neutral-500">
            {accounts.length} social destinations connected
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Account</span>
        </button>
      </div>

      {/* Quick Local Session Auto-Link */}
      <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-neutral-400">
          Auto-link verified credentials from your workspace:
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => linkLocalEngineAccount('instagram')}
            className="px-2.5 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Link2 className="w-3 h-3 text-pink-400" />
            <span>Link @benjamin.taless (Real IG)</span>
          </button>
          <button
            onClick={() => linkLocalEngineAccount('youtube')}
            className="px-2.5 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Link2 className="w-3 h-3 text-red-400" />
            <span>Link YouTube Channel</span>
          </button>
        </div>
      </div>

      {/* Account List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading accounts...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
          No accounts added yet.
        </div>
      ) : (
        <div className="border border-neutral-800 bg-neutral-900/30 rounded-xl divide-y divide-neutral-800/80 overflow-hidden">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 flex items-center justify-between hover:bg-neutral-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <PlatformBadge platform={acc.platform} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-200">{acc.name}</span>
                    {acc.isSimulated && (
                      <span className="text-[10px] font-mono px-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        SIM
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500">{acc.handle}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-500 hidden sm:inline">
                  {new Date(acc.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-100">Add Account</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selection */}
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
                  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-400' },
                  { id: 'twitter', label: 'X', icon: Twitter, color: 'text-sky-400' },
                  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400' },
                ] as const
              ).map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPlatform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? 'border-neutral-500 bg-neutral-800 text-white'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${p.color}`} />
                    <span className="text-[11px]">{p.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">Account / Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Instagram"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">Handle / ID</label>
                <input
                  type="text"
                  placeholder="@handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>

              {/* Mode Toggle */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-300">Simulate this account</span>
                <input
                  type="checkbox"
                  checked={isSimulated}
                  onChange={(e) => setIsSimulated(e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-900 border-neutral-700"
                />
              </div>

              {/* Specific API keys if not simulated */}
              {!isSimulated && selectedPlatform === 'twitter' && (
                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block font-medium">X (Twitter) Keys:</span>
                  <input
                    type="password"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100"
                  />
                  <input
                    type="password"
                    placeholder="API Key Secret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100"
                  />
                  <input
                    type="password"
                    placeholder="Access Token"
                    value={twitterAccessToken}
                    onChange={(e) => setTwitterAccessToken(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100"
                  />
                  <input
                    type="password"
                    placeholder="Access Token Secret"
                    value={twitterAccessSecret}
                    onChange={(e) => setTwitterAccessSecret(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100"
                  />
                </div>
              )}

              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200"
                >
                  {saving ? 'Saving...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
