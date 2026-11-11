'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Film, Loader2, Instagram } from 'lucide-react';
import { InstagramBroadcast, InstagramPublishResult } from '@/lib/types';

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
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Instagram className="w-6 h-6 text-pink-600" />
            <span>Published Reels History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all Instagram Reel broadcasts and direct links to live Reels
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
          <span>Loading published Reels...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 bg-white rounded-2xl text-slate-500 text-xs p-6">
          No Reels broadcasted yet. Push your first Reel from the Studio.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs hover:border-pink-200 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
                <span className="text-pink-700 font-bold bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 text-[11px]">
                  {post.results.filter((r) => r.status === 'success').length} of {post.results.length} Accounts Pushed
                </span>
              </div>

              <div className="flex items-start gap-3">
                {post.mediaUrl && (
                  <div className="w-16 h-20 rounded-xl bg-slate-900 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <Film className="w-6 h-6 text-pink-400" />
                  </div>
                )}
                <p className="text-xs text-slate-800 line-clamp-3 flex-1 font-medium leading-relaxed">
                  {post.caption || <span className="text-slate-400 italic">No caption</span>}
                </p>
              </div>

              {/* Per-account results */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {post.results.map((res: InstagramPublishResult) => (
                  <div
                    key={res.accountId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span className="text-slate-800">@{res.username}</span>

                    {res.status === 'success' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        {res.postUrl && (
                          <a
                            href={res.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-pink-600 hover:underline flex items-center gap-1 font-bold ml-1"
                          >
                            <span>Live Reel</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-rose-600 font-bold" title={res.error}>
                        Failed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
