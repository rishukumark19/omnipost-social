'use client';

import React, { useState, useEffect } from 'react';
import { Check, Loader2, Save, Globe, ShieldCheck } from 'lucide-react';
import { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    simulationMode: false,
    publicAppUrl: 'http://localhost:3001',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          General Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure app environment, simulation mode, and public endpoints
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#2C4BFF]" />
          <span>Loading settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-xs">
            {/* Simulation Mode Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Sandbox Simulation Mode
                </span>
                <span className="text-[11px] text-slate-500 block max-w-sm">
                  When enabled, posts simulate network delays. Keep disabled to push to real Instagram Reels and YouTube channels.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.simulationMode}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, simulationMode: e.target.checked }))
                }
                className="w-4 h-4 rounded text-[#2C4BFF] border-slate-300"
              />
            </div>

            {/* Public URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Public App URL (Required by Meta Graph API container fetch)
              </label>
              <input
                type="url"
                value={settings.publicAppUrl}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, publicAppUrl: e.target.value }))
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#2C4BFF]"
              />
              <p className="text-[11px] text-slate-400">
                When running locally with Meta APIs, paste your ngrok public URL here.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {savedSuccess && (
                <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                  <Check className="w-4 h-4 stroke-[3]" /> Settings saved
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#2C4BFF] hover:bg-[#1E3A8A] text-white transition-colors shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
