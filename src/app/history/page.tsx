'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Film, Loader2, CheckCircle2 } from 'lucide-react';
import { PostBroadcast, PublishResult } from '@/lib/types';
import { PlatformBadge } from '@/components/PlatformIcon';

export default function HistoryPage() {
  const [posts, setPosts] = useState<PostBroadcast[]>([]);
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
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Sent Posts &bull; History
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audit log of published broadcasts and live links across all channels
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#2C4BFF]" />
          <span>Loading sent posts...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 bg-white rounded-xl text-slate-500 text-xs p-6">
          No posts broadcasted yet. Create your first post from the composer.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
                <span className="text-slate-600 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {post.results.filter((r) => r.status === 'success').length} of {post.results.length} Channels Succeeded
                </span>
              </div>

              <div className="flex items-start gap-3">
                {post.mediaUrl && (
                  <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {post.mediaType === 'video' ? (
                      <Film className="w-6 h-6 text-purple-400" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.mediaUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-800 line-clamp-3 flex-1 font-medium leading-relaxed">
                  {post.caption || <span className="text-slate-400 italic">Media only</span>}
                </p>
              </div>

              {/* Account statuses */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {post.results.map((res: PublishResult) => (
                  <div
                    key={res.accountId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-semibold"
                  >
                    <PlatformBadge platform={res.platform} />
                    <span className="text-slate-700 truncate max-w-[120px]">
                      {res.accountName}
                    </span>
                    {res.status === 'success' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    ) : (
                      <span className="text-rose-600 font-bold">×</span>
                    )}
                    {res.postUrl && (
                      <a
                        href={res.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2C4BFF] hover:underline ml-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
