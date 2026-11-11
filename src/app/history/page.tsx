'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Film, Loader2, Instagram, Calendar, Play } from 'lucide-react';
import { InstagramBroadcast } from '@/lib/types';

export default function HistoryPage() {
  const [posts, setPosts] = useState<InstagramBroadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Broadcast Dispatch Log
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            History of direct Instagram Reel broadcasts executed under your Google account
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          <span>Loading broadcast history...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 bg-slate-900/40 rounded-2xl text-slate-400 text-xs p-8 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Film className="w-5 h-5" />
          </div>
          <p className="font-semibold text-white">No Reels broadcasted in this workspace yet.</p>
          <p className="text-slate-500">Instant publish a Reel from the Publisher Studio to see live logs here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const successCount = post.results.filter((r) => r.status === 'success').length;
            const totalCount = post.results.length || post.targetAccountIds.length;

            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full border ${
                      successCount === totalCount && totalCount > 0
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                    }`}
                  >
                    {successCount} of {totalCount} Accounts Pushed
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  {post.mediaUrl && (
                    <div className="w-14 h-24 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      <video
                        src={post.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-4 h-4 fill-white text-white opacity-80" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white line-clamp-3 leading-relaxed whitespace-pre-line font-mono">
                      {post.caption || '(No caption provided)'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.results.map((r) => (
                        <div
                          key={r.accountId}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono"
                        >
                          <Instagram className="w-3 h-3 text-rose-400" />
                          <span className="text-white">@{r.username}</span>
                          <span
                            className={`text-[9px] px-1 rounded ${
                              r.status === 'success'
                                ? 'text-emerald-400 bg-emerald-950'
                                : 'text-rose-400 bg-rose-950'
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.postUrl && (
                            <a
                              href={r.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-rose-400 hover:text-white"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
