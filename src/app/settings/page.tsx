'use client';

import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    simulationMode: false,
    publicAppUrl: 'http://localhost:3000',
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
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-base font-semibold text-neutral-100">Settings</h1>
        <p className="text-xs text-neutral-500">
          Configure execution modes and public endpoints
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="border border-neutral-800 bg-neutral-900/30 rounded-xl p-4 space-y-4">
            {/* Simulation Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">
                  Sandbox Simulation Mode
                </span>
                <span className="text-[11px] text-neutral-500 block max-w-sm">
                  Turn off to publish directly to real Instagram, Facebook, X, and YouTube accounts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.simulationMode}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, simulationMode: e.target.checked }))
                }
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-800"
              />
            </div>

            {/* Public URL */}
            <div className="space-y-1 pt-3 border-t border-neutral-800/80">
              <label className="text-[11px] text-neutral-400 block font-medium">
                Public URL (For Meta Container Downloads)
              </label>
              <input
                type="url"
                value={settings.publicAppUrl}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, publicAppUrl: e.target.value }))
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {savedSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
