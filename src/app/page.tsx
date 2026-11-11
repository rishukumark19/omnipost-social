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
  Send,
  Calendar,
  Sparkles,
  FolderOpen,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music2,
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import { SocialAccount, Platform, PostBroadcast, PublishResult } from '@/lib/types';
import { PlatformBadge } from '@/components/PlatformIcon';

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
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<Platform>('instagram');

  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<PostBroadcast | null>(null);
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
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload media file');
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
      setMediaType('video');
      setMediaFile(new File([], video.name));

      if (!caption.trim()) {
        setCaption(`${video.suggestedTitle} 🤯\n\n#viral #loophole #glitch #shorts #reels`);
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
    setMediaType('none');
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addHashtags = (tagString: string) => {
    setCaption((prev) => (prev ? `${prev.trim()} ${tagString}` : tagString));
  };

  const isXSelected = accounts.some(
    (a) => selectedIds.includes(a.id) && a.platform === 'twitter'
  );
  const isOverXLimit = isXSelected && caption.length > 280;

  const handlePublish = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage('Please select at least one channel to publish.');
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

  // Active account in preview
  const currentAccount =
    accounts.find((a) => a.platform === activePreviewTab && selectedIds.includes(a.id)) ||
    accounts.find((a) => a.platform === activePreviewTab) ||
    accounts[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Channel Bar (Postiz/Buffer Style) */}
      <div className="border border-neutral-800 bg-neutral-900/40 rounded-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mr-1">
            Channels:
          </span>

          {accounts.map((acc) => {
            const isSelected = selectedIds.includes(acc.id);
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => toggleAccount(acc.id)}
                className={`relative group flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={acc.avatarUrl}
                    alt={acc.name}
                    className="w-5 h-5 rounded-full object-cover border border-neutral-700"
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center text-black">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </div>
                  )}
                </div>

                <span className="truncate max-w-[130px]">{acc.name}</span>
                <PlatformBadge platform={acc.platform} />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={selectAll}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Select All
          </button>
          <span className="text-neutral-700">&bull;</span>
          <button
            onClick={deselectAll}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Composer on Left, Live Mockup Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: The Postiz/Buffer Composer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-neutral-800 bg-neutral-900/40 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            {/* Caption Area with Toolbar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-neutral-400">
                <span className="font-semibold text-neutral-200">Compose Message</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono ${
                      isOverXLimit
                        ? 'text-rose-400 font-bold'
                        : caption.length > 240
                        ? 'text-amber-400'
                        : 'text-neutral-500'
                    }`}
                  >
                    {caption.length} {isXSelected && '/ 280'}
                  </span>
                </div>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What would you like to share? Write your caption, description, and hashtags..."
                rows={6}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500/70 transition-all resize-y leading-relaxed"
              />

              {/* Quick Preset Tags Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-neutral-500 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Presets:
                </span>
                {['#shorts', '#viral', '#reels', '#loophole', '#glitch', '#trending'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addHashtags(tag)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Upload Area */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300 block">
                Media File (Video or Image)
              </span>

              {!mediaPreview ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-neutral-800 hover:border-indigo-500/50 bg-neutral-950/50 rounded-xl p-5 text-center cursor-pointer transition-all group flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-neutral-300">Upload MP4 or Image</span>
                    <span className="text-[11px] text-neutral-500">From this PC</span>
                  </div>

                  {/* AI Video Projects Direct Bridge */}
                  <div
                    onClick={openLocalPicker}
                    className="border border-dashed border-neutral-800 hover:border-purple-500/50 bg-neutral-950/50 rounded-xl p-5 text-center cursor-pointer transition-all group flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-purple-400 group-hover:border-purple-500/40 transition-colors">
                      <FolderOpen className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-neutral-300">AI Video Projects</span>
                    <span className="text-[11px] text-neutral-500">
                      Pick from rendered projects
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative border border-neutral-800 bg-neutral-950 rounded-xl p-3 overflow-hidden space-y-2">
                  <div className="relative aspect-video max-h-64 w-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls className="max-h-64 w-full object-contain" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-h-64 w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                    <div className="flex items-center gap-2 truncate max-w-[280px]">
                      {mediaType === 'video' ? (
                        <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{mediaFile?.name || 'Uploaded File'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isUploading && (
                        <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="text-neutral-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bottom Publishing Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800/80">
              <div className="text-xs text-neutral-400">
                Broadcasting to{' '}
                <span className="font-semibold text-white">{selectedIds.length}</span> connected{' '}
                {selectedIds.length === 1 ? 'channel' : 'channels'}
              </div>

              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || isUploading || selectedIds.length === 0}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isPublishing || isUploading || selectedIds.length === 0
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none'
                    : 'bg-white text-black hover:bg-neutral-200 active:scale-[0.99] shadow-white/5'
                }`}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting across {selectedIds.length} channels...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Broadcast Output Card */}
          {broadcastResult && (
            <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-5 space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Broadcast Execution Complete</span>
                </span>
                <span className="text-[11px] text-neutral-500">
                  {new Date(broadcastResult.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="divide-y divide-neutral-800/80">
                {broadcastResult.results.map((res: PublishResult) => (
                  <div
                    key={res.accountId}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlatformBadge platform={res.platform} />
                      <span className="font-semibold text-neutral-200">{res.accountName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {res.status === 'success' ? (
                        <>
                          <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3" /> Published
                          </span>
                          {res.postUrl && (
                            <a
                              href={res.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-1"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-rose-400 text-[11px]" title={res.error}>
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

        {/* Right: Real-Time Interactive Device Mockup (Postiz / Buffer Signature Preview) */}
        <div className="lg:col-span-5 space-y-3 sticky top-20">
          {/* Mockup Platform Switcher Tabs */}
          <div className="flex items-center justify-center p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl gap-1">
            {(
              [
                { id: 'instagram', label: 'Instagram' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'twitter', label: 'X' },
                { id: 'facebook', label: 'Facebook' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activePreviewTab === tab.id
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Mockup Container */}
          <div className="border border-neutral-800 bg-neutral-950 rounded-3xl p-3 shadow-2xl flex flex-col items-center">
            {/* INSTAGRAM REEL PREVIEW */}
            {activePreviewTab === 'instagram' && (
              <div className="w-full max-w-[310px] aspect-[9/16] bg-black rounded-2xl overflow-hidden relative border border-neutral-800 flex flex-col justify-between p-3 select-none">
                {/* Background Video / Media */}
                {mediaPreview && mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : mediaPreview && mediaType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 gap-2">
                    <Film className="w-8 h-8" />
                    <span className="text-[11px]">Attach video for live Reel preview</span>
                  </div>
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>

                {/* Top Instagram Bar */}
                <div className="relative z-10 flex items-center justify-between text-white text-xs font-bold pt-1">
                  <span>Reels</span>
                  <div className="flex gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Overlay & Right Rail */}
                <div className="relative z-10 flex items-end justify-between gap-3 pb-1">
                  {/* Left Info: User & Caption */}
                  <div className="space-y-1.5 min-w-0 flex-1 text-white text-xs">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentAccount?.avatarUrl}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border border-white/40"
                      />
                      <span className="font-bold text-xs truncate">
                        {currentAccount?.handle || '@benjamin.taless'}
                      </span>
                      <button className="text-[10px] px-2 py-0.5 rounded border border-white/60 font-semibold backdrop-blur-sm">
                        Follow
                      </button>
                    </div>

                    <p className="text-[11px] text-white/90 line-clamp-3 leading-tight drop-shadow">
                      {caption || 'Your caption will appear here in real-time...'}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                      <Music2 className="w-3 h-3" />
                      <span className="truncate">Original audio &bull; {currentAccount?.name}</span>
                    </div>
                  </div>

                  {/* Right Action Rail */}
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="flex flex-col items-center">
                      <Heart className="w-5 h-5 fill-white" />
                      <span className="text-[10px]">12.4K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-[10px]">342</span>
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
            )}

            {/* YOUTUBE SHORTS PREVIEW */}
            {activePreviewTab === 'youtube' && (
              <div className="w-full max-w-[310px] aspect-[9/16] bg-black rounded-2xl overflow-hidden relative border border-neutral-800 flex flex-col justify-between p-3 select-none">
                {mediaPreview && mediaType === 'video' ? (
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
                    <span className="text-[11px]">Attach video for live Shorts preview</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>

                <div className="relative z-10 flex items-center justify-between text-white text-xs font-bold pt-1">
                  <span>Shorts</span>
                  <MoreHorizontal className="w-4 h-4" />
                </div>

                <div className="relative z-10 flex items-end justify-between gap-3 pb-1">
                  <div className="space-y-1.5 min-w-0 flex-1 text-white">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentAccount?.avatarUrl}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border border-white/40"
                      />
                      <span className="font-bold text-xs truncate">
                        {currentAccount?.name || 'Benjamin Stories'}
                      </span>
                      <button className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold">
                        Subscribe
                      </button>
                    </div>

                    <p className="text-[11px] text-white/95 line-clamp-2 leading-tight">
                      {caption || 'Shorts title and description...'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="flex flex-col items-center">
                      <ThumbsUp className="w-5 h-5" />
                      <span className="text-[10px]">48K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <ThumbsDown className="w-5 h-5" />
                      <span className="text-[10px]">Dislike</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-[10px]">1.2K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Share2 className="w-5 h-5" />
                      <span className="text-[10px]">Share</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* X (TWITTER) TWEET CARD PREVIEW */}
            {activePreviewTab === 'twitter' && (
              <div className="w-full bg-black border border-neutral-800 rounded-2xl p-4 space-y-3 text-white text-xs">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentAccount?.avatarUrl}
                    alt="X Avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white truncate">
                        {currentAccount?.name || 'CrossTech'}
                      </span>
                      <span className="text-neutral-500 truncate">
                        {currentAccount?.handle || '@crosstech_ai'} &bull; Just now
                      </span>
                    </div>

                    <p className="text-neutral-100 text-xs mt-1.5 whitespace-pre-wrap leading-relaxed">
                      {caption || 'What is happening?!'}
                    </p>

                    {mediaPreview && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 max-h-56 flex items-center justify-center">
                        {mediaType === 'video' ? (
                          <video
                            src={mediaPreview}
                            controls
                            className="max-h-56 w-full object-contain"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaPreview}
                            alt="Tweet media"
                            className="max-h-56 w-full object-contain"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-neutral-500 pt-3 mt-1 max-w-xs">
                      <span className="flex items-center gap-1 hover:text-sky-400">
                        <MessageCircle className="w-3.5 h-3.5" /> 18
                      </span>
                      <span className="flex items-center gap-1 hover:text-emerald-400">
                        <Repeat2 className="w-3.5 h-3.5" /> 42
                      </span>
                      <span className="flex items-center gap-1 hover:text-rose-400">
                        <Heart className="w-3.5 h-3.5" /> 380
                      </span>
                      <span className="flex items-center gap-1 hover:text-sky-400">
                        <Bookmark className="w-3.5 h-3.5" /> 14
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FACEBOOK PAGE POST PREVIEW */}
            {activePreviewTab === 'facebook' && (
              <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3 text-white text-xs">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentAccount?.avatarUrl}
                    alt="FB Page"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-white block">
                      {currentAccount?.name || 'CrossTech Facebook Page'}
                    </span>
                    <span className="text-[10px] text-neutral-400">Just now &bull; 🌐 Public</span>
                  </div>
                </div>

                <p className="text-neutral-200 text-xs whitespace-pre-wrap leading-relaxed">
                  {caption || 'Your Facebook post description...'}
                </p>

                {mediaPreview && (
                  <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black max-h-56 flex items-center justify-center">
                    {mediaType === 'video' ? (
                      <video
                        src={mediaPreview}
                        controls
                        className="max-h-56 w-full object-contain"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaPreview}
                        alt="FB media"
                        className="max-h-56 w-full object-contain"
                      />
                    )}
                  </div>
                )}

                <div className="border-t border-neutral-800 pt-2 flex items-center justify-around text-neutral-400 text-xs">
                  <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">
                    <ThumbsUp className="w-3.5 h-3.5" /> Like
                  </span>
                  <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" /> Comment
                  </span>
                  <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Videos Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">
                  Pick from AI Video Editing Projects
                </span>
              </div>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Select any rendered video from <code className="text-neutral-300 font-mono">D:\ai video editing with image</code> to import it directly into the studio.
            </p>

            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {loadingVideos ? (
                <div className="py-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning local projects...</span>
                </div>
              ) : localVideos.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No .mp4 videos found in projects folder.
                </div>
              ) : (
                localVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => selectLocalVideo(vid)}
                    className="p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/60 hover:border-neutral-700 cursor-pointer flex items-center justify-between transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-neutral-200 block truncate max-w-[240px]">
                          {vid.name}
                        </span>
                        <span className="text-[11px] text-neutral-500 block truncate">
                          {vid.folder} &bull; {vid.sizeMb}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={importingId === vid.id}
                      className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1"
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
                className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
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
