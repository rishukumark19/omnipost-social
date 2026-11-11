'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Check,
  AlertCircle,
  ExternalLink,
  Film,
  X,
  Loader2,
  Send,
  FolderOpen,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music2,
  MoreHorizontal,
  Instagram,
  Sparkles,
} from 'lucide-react';
import { InstagramAccount, InstagramBroadcast, InstagramPublishResult } from '@/lib/types';

interface LocalVideoItem {
  id: string;
  name: string;
  folder: string;
  filePath: string;
  sizeMb: string;
  modifiedAt: string;
  suggestedTitle: string;
}

export default function ComposePage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);

  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<InstagramBroadcast | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local Video Picker
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [localVideos, setLocalVideos] = useState<LocalVideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) {
          setAccounts(data.accounts);
          setSelectedIds(data.accounts.map((a: InstagramAccount) => a.id));
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
    setMediaPreview(URL.createObjectURL(file));

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const openLocalPicker = () => {
    setIsPickerOpen(true);
    setLoadingVideos(true);
    fetch('/api/videos/local')
      .then((res) => res.json())
      .then((data) => {
        if (data.videos) setLocalVideos(data.videos);
      })
      .finally(() => setLoadingVideos(false));
  };

  const selectLocalVideo = async (video: LocalVideoItem) => {
    setImportingId(video.id);
    try {
      const res = await fetch('/api/videos/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: video.filePath,
          suggestedTitle: video.suggestedTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import video');

      setUploadedUrl(data.url);
      setMediaPreview(data.url);
      setMediaFile(new File([], video.name));

      if (!caption.trim()) {
        setCaption(`${video.suggestedTitle} 🤯\n\n#reels #viral #explore #trending #loophole`);
      }

      setIsPickerOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error importing video');
    } finally {
      setImportingId(null);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addHashtag = (tag: string) => {
    setCaption((prev) => (prev ? `${prev.trim()} ${tag}` : tag));
  };

  const handlePublish = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage('Please select at least one Instagram account.');
      return;
    }
    if (!uploadedUrl) {
      setErrorMessage('Please upload or pick a video file to publish to Instagram.');
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
          mediaType: 'video',
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

  const currentPreviewAccount = accounts[activeAccountIndex] || accounts[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Instagram className="w-6 h-6 text-pink-600" />
            <span>Instagram Reel Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Post 1 video to all your connected Instagram accounts at the same time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
            <span className="text-pink-600">{selectedIds.length}</span> of {accounts.length} Accounts Selected
          </span>
        </div>
      </div>

      {/* Connected Instagram Usernames Bar (Clear and Easy UI) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Connected Instagram Accounts (Click to toggle):
          </span>
          <div className="flex items-center gap-2 text-xs font-bold text-pink-600">
            <button onClick={selectAll} className="hover:underline">
              Select All
            </button>
            <span className="text-slate-300">&bull;</span>
            <button onClick={deselectAll} className="text-slate-500 hover:text-slate-800">
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {accounts.length === 0 ? (
            <div className="text-xs text-slate-400 py-2">
              No Instagram accounts connected yet. Go to Accounts to add one.
            </div>
          ) : (
            accounts.map((acc, index) => {
              const isSelected = selectedIds.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    toggleAccount(acc.id);
                    setActiveAccountIndex(index);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-50 text-slate-900 shadow-xs ring-2 ring-pink-500/20'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={acc.avatarUrl}
                        alt={acc.username}
                        className="w-full h-full rounded-full object-cover border border-white"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-pink-600 text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-bold block leading-tight text-slate-900">
                      @{acc.username}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-none">
                      {acc.name}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Composer on Left, Live Phone Mockup on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Instant Publish Composer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden p-5 space-y-4">
            {/* Media Upload Area */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                1. Upload Reel Video (Required)
              </span>

              {!mediaPreview ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* From PC */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-pink-500 bg-slate-50 hover:bg-pink-50/20 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-pink-600 group-hover:border-pink-300 shadow-xs transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Upload Video from PC</span>
                    <span className="text-[11px] text-slate-400">MP4, MOV (Vertical 9:16)</span>
                  </div>

                  {/* From AI Video Editing Projects */}
                  <div
                    onClick={openLocalPicker}
                    className="border-2 border-dashed border-purple-200 hover:border-purple-600 bg-purple-50/40 hover:bg-purple-50 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-105 shadow-xs transition-transform">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-purple-950">
                      Pick AI Video Project
                    </span>
                    <span className="text-[11px] text-purple-600">
                      From D:\ai video editing
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative border border-slate-200 bg-slate-900 rounded-xl p-2 overflow-hidden space-y-2">
                  <div className="relative aspect-video max-h-64 w-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    <video src={mediaPreview} controls className="max-h-64 w-full object-contain" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 px-2 py-1">
                    <div className="flex items-center gap-2 truncate max-w-[280px]">
                      <Film className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      <span className="truncate">{mediaFile?.name || 'Selected Reel Video'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isUploading && (
                        <span className="flex items-center gap-1 text-[11px] text-pink-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">
                2. Reel Caption &amp; Hashtags
              </span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your Reel caption, hashtags, and description here..."
                rows={5}
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors resize-y leading-relaxed"
              />

              {/* Quick Hashtag Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">
                  Add tags:
                </span>
                {['#reels', '#viral', '#explore', '#trending', '#loophole', '#ai', '#glitch'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addHashtag(tag)}
                    className="text-[11px] px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Instant Publish Button (No scheduling) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Pushing directly to{' '}
                <span className="font-bold text-slate-900">{selectedIds.length}</span> Instagram accounts
              </div>

              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || isUploading || selectedIds.length === 0}
                className={`px-8 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all ${
                  isPublishing || isUploading || selectedIds.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-95 text-white active:scale-[0.99] shadow-pink-500/20'
                }`}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Reel to {selectedIds.length} Accounts...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Instant Publish to {selectedIds.length} Accounts</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Broadcast Output Card */}
          {broadcastResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                  <span>Instagram Broadcast Execution Complete</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(broadcastResult.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {broadcastResult.results.map((res: InstagramPublishResult) => (
                  <div
                    key={res.accountId}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span className="font-bold text-slate-800">@{res.username}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {res.status === 'success' ? (
                        <>
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Reel Live!
                          </span>
                          {res.postUrl && (
                            <a
                              href={res.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-pink-600 hover:underline flex items-center gap-1 font-bold ml-1"
                            >
                              <span>View on Instagram</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-rose-600 text-xs font-semibold" title={res.error}>
                          Failed ({res.error})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Real-Time Live Instagram Phone Preview */}
        <div className="lg:col-span-5 space-y-3 sticky top-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Live Reel Mockup ({currentPreviewAccount ? `@${currentPreviewAccount.username}` : ''}):
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center">
            <div className="w-full max-w-[310px] aspect-[9/16] bg-black rounded-2xl overflow-hidden relative border border-slate-800 flex flex-col justify-between p-3 select-none shadow-md">
              {mediaPreview ? (
                <video
                  src={mediaPreview}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 gap-2">
                  <Film className="w-8 h-8" />
                  <span className="text-[11px]">Upload video to preview Reel</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>

              <div className="relative z-10 flex items-center justify-between text-white text-xs font-bold pt-1">
                <span>Reels</span>
                <MoreHorizontal className="w-4 h-4" />
              </div>

              <div className="relative z-10 flex items-end justify-between gap-3 pb-1">
                <div className="space-y-1.5 min-w-0 flex-1 text-white text-xs">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPreviewAccount?.avatarUrl}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border border-white/40"
                    />
                    <span className="font-bold text-xs truncate">
                      @{currentPreviewAccount?.username || 'benjamin.taless'}
                    </span>
                    <button className="text-[10px] px-2 py-0.5 rounded border border-white/60 font-semibold backdrop-blur-sm">
                      Follow
                    </button>
                  </div>

                  <p className="text-[11px] text-white/90 line-clamp-3 leading-tight drop-shadow">
                    {caption || 'Your Reel caption and tags will appear here in real-time...'}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                    <Music2 className="w-3 h-3" />
                    <span className="truncate">Original audio &bull; {currentPreviewAccount?.name}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 text-white">
                  <div className="flex flex-col items-center">
                    <Heart className="w-5 h-5 fill-white" />
                    <span className="text-[10px]">14.8K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-[10px]">298</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Videos Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-bold text-slate-900">
                  Pick from AI Video Editing Projects
                </span>
              </div>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select any rendered video from <code className="text-slate-700 font-mono">D:\ai video editing with image</code> to import it directly into the studio.
            </p>

            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {loadingVideos ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning projects...</span>
                </div>
              ) : localVideos.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No .mp4 videos found.
                </div>
              ) : (
                localVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => selectLocalVideo(vid)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-pink-50/40 hover:border-pink-300 cursor-pointer flex items-center justify-between transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Film className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate max-w-[240px]">
                          {vid.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {vid.folder} &bull; {vid.sizeMb}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={importingId === vid.id}
                      className="px-3 py-1 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 flex items-center gap-1"
                    >
                      {importingId === vid.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Load</span>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
