'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Film, Loader2 } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-base font-semibold text-neutral-100">Broadcast History</h1>
        <p className="text-xs text-neutral-500">
          Audit trail of published posts and live links
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading history...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
          No posts broadcasted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-neutral-800 bg-neutral-900/30 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
                <span className="text-neutral-500 text-[11px]">
                  {post.results.filter((r) => r.status === 'success').length} of {post.results.length} succeeded
                </span>
              </div>

              <div className="flex items-start gap-3">
                {post.mediaUrl && (
                  <div className="w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {post.mediaType === 'video' ? (
                      <Film className="w-5 h-5 text-neutral-500" />
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
                <p className="text-xs text-neutral-200 line-clamp-2 flex-1">
                  {post.caption || <span className="text-neutral-500 italic">Media only</span>}
                </p>
              </div>

              {/* Account statuses */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-800/60">
                {post.results.map((res: PublishResult) => (
                  <div
                    key={res.accountId}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[11px]"
                  >
                    <PlatformBadge platform={res.platform} />
                    <span className="text-neutral-300 font-medium truncate max-w-[100px]">
                      {res.accountName}
                    </span>
                    {res.status === 'success' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span className="text-rose-400 font-bold">×</span>
                    )}
                    {res.postUrl && (
                      <a
                        href={res.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-400 hover:text-white ml-0.5"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
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
