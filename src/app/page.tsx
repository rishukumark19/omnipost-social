'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Check,
  AlertCircle,
  ExternalLink,
  Film,
  Image as ImageIcon,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { SocialAccount, Platform, PostBroadcast, PublishResult } from '@/lib/types';
import { PlatformBadge } from '@/components/PlatformIcon';

export default function ComposePage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<PostBroadcast | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) {
          setAccounts(data.accounts);
          setSelectedIds(data.accounts.map((a: SocialAccount) => a.id));
        }
      })
      .catch((err) => console.error('Failed to load accounts', err));
  }, []);

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(accounts.map((a) => a.id));
  const deselectAll = () => setSelectedIds([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    const isVid = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(file.name);
    setMediaType(isVid ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload media file');
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType('none');
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isXSelected = accounts.some(
    (a) => selectedIds.includes(a.id) && a.platform === 'twitter'
  );
  const isOverXLimit = isXSelected && caption.length > 280;

  const handlePublish = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage('Select at least one account.');
      return;
    }
    if (!caption.trim() && !uploadedUrl) {
      setErrorMessage('Write a caption or upload media to publish.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          mediaUrl: uploadedUrl,
          mediaType,
          targetAccountIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publishing failed');

      setBroadcastResult(data.broadcast);
    } catch (err: any) {
      setErrorMessage(err.message || 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Clean Composer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-neutral-800 bg-neutral-900/40 rounded-xl p-5 space-y-4 backdrop-blur-sm">
            {/* Caption Textarea */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-neutral-400">
                <span className="font-medium text-neutral-300">Caption / Text</span>
                <span className={isOverXLimit ? 'text-rose-400 font-semibold' : ''}>
                  {caption.length} {isXSelected && '/ 280'}
                </span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your post caption, tags, and description..."
                rows={5}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors resize-y"
              />
            </div>

            {/* Media Dropzone / Preview */}
            <div>
              {!mediaPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950/60 rounded-lg p-6 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <Upload className="w-5 h-5 text-neutral-500" />
                    <span className="text-xs font-medium text-neutral-300">
                      Upload Video (MP4 / MOV) or Image
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Required for Instagram Reels & YouTube Shorts
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative border border-neutral-800 bg-neutral-950 rounded-lg p-2 overflow-hidden">
                  {mediaType === 'video' ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="max-h-64 w-full rounded bg-black object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="max-h-64 w-full rounded bg-black object-contain"
                    />
                  )}

                  <div className="flex items-center justify-between pt-2 px-1 text-xs text-neutral-400">
                    <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                      {mediaType === 'video' ? (
                        <Film className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{mediaFile?.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUploading && (
                        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Uploading
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="text-neutral-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Broadcast Result Card */}
          {broadcastResult && (
            <div className="border border-neutral-800 bg-neutral-900/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-200">
                  Published to {broadcastResult.results.length} Accounts
                </span>
                <span className="text-neutral-500">
                  {new Date(broadcastResult.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="divide-y divide-neutral-800/60">
                {broadcastResult.results.map((res: PublishResult) => (
                  <div
                    key={res.accountId}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={res.platform} />
                      <span className="text-neutral-300 font-medium">{res.accountName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {res.status === 'success' ? (
                        <>
                          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <Check className="w-3 h-3" /> Live
                          </span>
                          {res.postUrl && (
                            <a
                              href={res.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-400 hover:text-white"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-rose-400 text-[11px]" title={res.error}>
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Clean Account Selector & Action */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-neutral-800 bg-neutral-900/40 rounded-xl p-5 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">Target Accounts</span>
              <div className="flex gap-2 text-xs text-neutral-400">
                <button onClick={selectAll} className="hover:text-white transition-colors">
                  All
                </button>
                <span>&bull;</span>
                <button onClick={deselectAll} className="hover:text-white transition-colors">
                  None
                </button>
              </div>
            </div>

            {/* Accounts Checklist */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {accounts.length === 0 ? (
                <div className="text-xs text-neutral-500 py-6 text-center">
                  No accounts connected. Go to Accounts to add one.
                </div>
              ) : (
                accounts.map((acc) => {
                  const isSelected = selectedIds.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-neutral-600 bg-neutral-800/60'
                          : 'border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-white border-white text-black'
                              : 'border-neutral-700 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <span className="text-xs font-medium text-neutral-200 truncate block">
                            {acc.name}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate block">
                            {acc.handle}
                          </span>
                        </div>
                      </div>

                      <PlatformBadge platform={acc.platform} />
                    </div>
                  );
                })
              )}
            </div>

            {/* Big Clean Action Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing || isUploading || selectedIds.length === 0}
              className={`w-full py-3 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isPublishing || isUploading || selectedIds.length === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-neutral-200 active:scale-[0.99]'
              }`}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Pushing to {selectedIds.length} accounts...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading file...</span>
                </>
              ) : (
                <>
                  <span>Publish to {selectedIds.length} accounts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
