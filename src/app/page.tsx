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
  Smile,
  Hash,
  Clock,
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

  // Buffer Scheduling state
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState('');

  // AI Video Picker
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

    const payload: any = {
      caption,
      mediaUrl: uploadedUrl,
      mediaType,
      targetAccountIds: selectedIds,
    };

    if (scheduleMode === 'schedule' && scheduledDate) {
      payload.scheduledFor = new Date(scheduledDate).toISOString();
    }

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <div className="space-y-6">
      {/* Top Buffer Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Publishing &bull; Create Post
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Share simultaneously across your connected channels
          </p>
        </div>

        {/* Channels counter pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
            <span className="text-[#2C4BFF] font-bold">{selectedIds.length}</span> of {accounts.length} Channels Active
          </span>
        </div>
      </div>

      {/* Iconic Buffer Channel Avatar Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Channels:
          </span>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2C4BFF]">
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
          {accounts.map((acc) => {
            const isSelected = selectedIds.includes(acc.id);
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => toggleAccount(acc.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all ${
                  isSelected
                    ? 'border-[#2C4BFF] bg-blue-50/80 text-slate-900 shadow-xs ring-2 ring-[#2C4BFF]/20'
                    : 'border-slate-200 bg-white text-slate-500 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={acc.avatarUrl}
                    alt={acc.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#2C4BFF] text-white rounded-full flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="text-left">
                  <span className="text-xs font-bold block leading-tight truncate max-w-[120px]">
                    {acc.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-none">
                    {acc.handle}
                  </span>
                </div>

                <PlatformBadge platform={acc.platform} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Buffer Composer on Left, Live Mockup Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: The Buffer Composer Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Top Network Tab Tabs (Buffer Style) */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/60 px-4">
              <button
                type="button"
                className="py-3 px-3 text-xs font-bold text-[#2C4BFF] border-b-2 border-[#2C4BFF] flex items-center gap-1.5"
              >
                <span>🌐 All Channels</span>
              </button>
              <span className="text-slate-300 mx-2">|</span>
              <span className="text-[11px] text-slate-400 font-medium">
                Content syncs automatically across all selected accounts
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Caption Textarea */}
              <div className="space-y-1">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What would you like to share? Write your caption, hashtags, or description..."
                  rows={6}
                  className="w-full border-0 focus:ring-0 p-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-y leading-relaxed"
                />

                {/* Character Counter & Warnings */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Assistant</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-1">
                      {['#shorts', '#viral', '#reels', '#loophole', '#glitch'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addHashtags(tag)}
                          className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-semibold ${
                      isOverXLimit
                        ? 'text-rose-600 font-bold'
                        : caption.length > 240
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {caption.length} {isXSelected && '/ 280'}
                  </span>
                </div>
              </div>

              {/* Media Upload Area (Buffer Style) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">
                  Media Attachment (Reel / Video / Photo)
                </span>

                {!mediaPreview ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* PC Upload Box */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-[#2C4BFF] bg-slate-50 hover:bg-blue-50/20 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-[#2C4BFF] group-hover:border-[#2C4BFF]/40 shadow-xs transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Upload Video or Photo</span>
                      <span className="text-[11px] text-slate-400">MP4, MOV, JPG, PNG</span>
                    </div>

                    {/* AI Video Projects Direct Bridge */}
                    <div
                      onClick={openLocalPicker}
                      className="border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-white border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-105 shadow-xs transition-transform">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-purple-900">
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

                    <div className="flex items-center justify-between text-xs text-slate-300 px-2 py-1">
                      <div className="flex items-center gap-2 truncate max-w-[280px]">
                        {mediaType === 'video' ? (
                          <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{mediaFile?.name || 'Selected Video'}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isUploading && (
                          <span className="flex items-center gap-1 text-[11px] text-blue-400">
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

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Buffer Action Bar Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Schedule Mode Selector */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScheduleMode('now')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    scheduleMode === 'now'
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Publish Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('schedule')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    scheduleMode === 'schedule'
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>

                {scheduleMode === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 bg-white"
                  />
                )}
              </div>

              {/* Buffer Signature Blue CTA Button */}
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || isUploading || selectedIds.length === 0}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all ${
                  isPublishing || isUploading || selectedIds.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-[#2C4BFF] hover:bg-[#1E3A8A] text-white shadow-blue-500/20 active:scale-[0.99]'
                }`}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting across {selectedIds.length} channels...</span>
                  </>
                ) : scheduleMode === 'schedule' ? (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule to {selectedIds.length} Channels</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Share Now to {selectedIds.length} Channels</span>
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Broadcast Successfully Executed</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(broadcastResult.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {broadcastResult.results.map((res: PublishResult) => (
                  <div
                    key={res.accountId}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlatformBadge platform={res.platform} />
                      <span className="font-bold text-slate-800">{res.accountName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {res.status === 'success' ? (
                        <>
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Published
                          </span>
                          {res.postUrl && (
                            <a
                              href={res.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2C4BFF] hover:underline flex items-center gap-1 font-semibold ml-1"
                            >
                              <span>View Post</span>
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

        {/* Right: Real-Time Live Feed / Device Mockup Preview (Buffer Signature) */}
        <div className="lg:col-span-5 space-y-3 sticky top-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Live Preview:
            </span>

            {/* Segmented Control */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
              {(
                [
                  { id: 'instagram', label: 'Reels' },
                  { id: 'youtube', label: 'Shorts' },
                  { id: 'twitter', label: 'X' },
                  { id: 'facebook', label: 'Facebook' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activePreviewTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Mockup Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center">
            {/* INSTAGRAM REEL PREVIEW */}
            {activePreviewTab === 'instagram' && (
              <div className="w-full max-w-[310px] aspect-[9/16] bg-black rounded-2xl overflow-hidden relative border border-slate-800 flex flex-col justify-between p-3 select-none shadow-md">
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
                    <span className="text-[11px]">Upload video for live Reel preview</span>
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
              <div className="w-full max-w-[310px] aspect-[9/16] bg-black rounded-2xl overflow-hidden relative border border-slate-800 flex flex-col justify-between p-3 select-none shadow-md">
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
                    <span className="text-[11px]">Upload video for live Shorts preview</span>
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

            {/* X (TWITTER) TWEET PREVIEW */}
            {activePreviewTab === 'twitter' && (
              <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-white text-xs shadow-md">
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
                      <span className="text-slate-400 truncate">
                        {currentAccount?.handle || '@crosstech_ai'} &bull; Just now
                      </span>
                    </div>

                    <p className="text-slate-100 text-xs mt-1.5 whitespace-pre-wrap leading-relaxed">
                      {caption || 'What is happening?!'}
                    </p>

                    {mediaPreview && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-black max-h-56 flex items-center justify-center">
                        {mediaType === 'video' ? (
                          <video src={mediaPreview} controls className="max-h-56 w-full object-contain" />
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

                    <div className="flex items-center justify-between text-slate-400 pt-3 mt-1 max-w-xs">
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

            {/* FACEBOOK POST PREVIEW */}
            {activePreviewTab === 'facebook' && (
              <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-slate-900 text-xs shadow-md">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentAccount?.avatarUrl}
                    alt="FB Page"
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {currentAccount?.name || 'CrossTech Facebook Page'}
                    </span>
                    <span className="text-[10px] text-slate-400">Just now &bull; 🌐 Public</span>
                  </div>
                </div>

                <p className="text-slate-800 text-xs whitespace-pre-wrap leading-relaxed">
                  {caption || 'Your Facebook post description...'}
                </p>

                {mediaPreview && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-black max-h-56 flex items-center justify-center">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls className="max-h-56 w-full object-contain" />
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

                <div className="border-t border-slate-100 pt-2 flex items-center justify-around text-slate-500 text-xs font-semibold">
                  <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                    <ThumbsUp className="w-3.5 h-3.5" /> Like
                  </span>
                  <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" /> Comment
                  </span>
                  <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
              Select any rendered video from <code className="text-slate-700 font-mono">D:\ai video editing with image</code> to import it directly into Buffer.
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
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/40 hover:border-[#2C4BFF] cursor-pointer flex items-center justify-between transition-all text-xs"
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
                      className="px-3 py-1 rounded-lg bg-[#2C4BFF] text-white text-xs font-bold hover:bg-[#1E3A8A] flex items-center gap-1"
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
