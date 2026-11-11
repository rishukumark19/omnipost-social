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
  FolderOpen,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music2,
  MoreHorizontal,
  Instagram,
  Sparkles,
  Zap,
  Play,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-react';
import { InstagramAccount, InstagramBroadcast } from '@/lib/types';
import { InstagramAccountsStrip } from '@/components/InstagramAccountsStrip';

interface LocalVideoItem {
  id: string;
  name: string;
  folder: string;
  filePath: string;
  sizeMb: string;
  modifiedAt: string;
  suggestedTitle: string;
}

const HOOK_PRESETS = [
  'Wait until the end... 🤯',
  'Nobody is talking about this loophole ✨',
  'This changes everything for creators ⚡',
  'How we built this from scratch in 24 hours 🛠️',
  'Stop scrolling. You need to see this right now 👇',
];

export default function ComposePage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const [caption, setCaption] = useState(
    'Behind the scenes of our new workflow. Crafting motion in silence... ✨\n\n#cinematicreels #workflow #aesthetic #creator'
  );
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<InstagramBroadcast | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phone preview audio
  const [isMuted, setIsMuted] = useState(true);

  // Local Video Picker
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [localVideos, setLocalVideos] = useState<LocalVideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAccounts = () => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) {
          setAccounts(data.accounts);
          setSelectedIds(data.accounts.map((a: InstagramAccount) => a.id));
        }
      })
      .catch((err) => console.error('Failed to load accounts', err));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(accounts.map((a) => a.id));
  const deselectAll = () => setSelectedIds([]);

  const uploadFile = async (file: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
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

      if (!caption.trim() || caption.startsWith('Behind the scenes')) {
        setCaption(`${video.suggestedTitle} 🤯\n\n#reels #viral #explore #trending #creators`);
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

  const applyHookPreset = (hook: string) => {
    setCaption((prev) => `${hook}\n\n${prev}`);
  };

  const handlePublish = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage('Please select at least one Instagram account.');
      return;
    }
    if (!uploadedUrl) {
      setErrorMessage('Please upload or pick a Reel video file.');
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

  const currentPreviewAccount = accounts[activePreviewIndex] || accounts[0] || {
    username: 'creator.studio',
    name: 'Creator Studio',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
  };

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Top Instagram Accounts Strip */}
      <InstagramAccountsStrip
        accounts={accounts}
        onAccountAdded={fetchAccounts}
        onRefresh={fetchAccounts}
      />

      {/* Main Workspace Split View */}
      <div className="flex-1 flex flex-col xl:flex-row w-full max-w-[1720px] mx-auto overflow-hidden">
        {/* Left Column: Publisher Studio */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto border-r border-slate-800/80">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* 1. Broadcast Target Selector Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Broadcast Targets
                  </h2>
                  <span className="text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    {selectedIds.length} of {accounts.length} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Account Selection Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {accounts.map((acc) => {
                  const isSelected = selectedIds.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleAccount(acc.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-rose-500/10 border-rose-500/60 text-white shadow-xs'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={acc.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'}
                          alt={acc.username}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-xs font-semibold truncate">
                          @{acc.username}
                        </span>
                      </div>

                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ml-1 transition-all ${
                          isSelected
                            ? 'bg-rose-500 text-white'
                            : 'border border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}

                {accounts.length === 0 && (
                  <div className="col-span-3 text-center py-6 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400">
                      No Instagram accounts connected in this workspace yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Video Upload Zone (With Drag & Drop Support) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Reel Media Payload
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  9:16 Vertical • MP4 / MOV • Max 4K 60fps
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!uploadedUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                    isDragging
                      ? 'border-rose-500 bg-rose-500/10 scale-[1.01]'
                      : 'border-slate-800 hover:border-rose-500/70 bg-slate-950/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-md mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {isDragging ? 'Drop video file to upload!' : 'Drop high-res Reel video here or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-optimized for Instagram Reels algorithm
                  </p>

                  <div className="flex items-center gap-2.5 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Browse Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={openLocalPicker}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/40 flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      <span>Pick from AI Video Projects</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-rose-400 flex-shrink-0">
                      <Play className="w-5 h-5 fill-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white truncate max-w-xs font-mono">
                          {mediaFile?.name || 'reel_cinematic_payload.mp4'}
                        </p>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono">
                          Payload Ready
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Direct Push Verified • 9:16 Aspect Validated
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={removeMedia}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Remove video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Reel Caption & Metadata Editor */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Caption &amp; Meta Tags
                  </h3>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  <span className="text-rose-400 font-semibold">{caption.length}</span> / 2,200 chars
                </div>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Write your Reel caption, add hooks, tags..."
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all resize-none leading-relaxed"
              />

              {/* Quick Hook Preset Injectors */}
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <Wand2 className="w-3 h-3 text-rose-400" />
                  <span>Viral Hook Starters</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {HOOK_PRESETS.map((h, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyHookPreset(h)}
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-[10px] border border-slate-700/60 hover:border-rose-500/40 transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Hashtag Chips */}
              <div className="mt-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Quick Hashtags
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    '#designsystem',
                    '#creatortools',
                    '#cinematicreels',
                    '#workflow',
                    '#aesthetic',
                    '#viral',
                    '#loophole',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addHashtag(tag)}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-700/80 transition-colors"
                    >
                      {tag} +
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Track Tag */}
              <div className="mt-3 flex items-center justify-between bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Music2 className="w-4 h-4 text-rose-400" />
                  <span className="font-mono text-[11px]">
                    Original Audio - @{currentPreviewAccount?.username || 'account'} (Meta Licensed)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 4. Instant Action Footer */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Zero-Queue Dispatch
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Direct Python instagrapi broadcast • Zero delay • No scheduling needed
                </span>
              </div>

              <button
                type="button"
                disabled={isPublishing || isUploading || selectedIds.length === 0}
                onClick={handlePublish}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:brightness-105 disabled:opacity-50 shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing to Instagram...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Instant Publish to All {selectedIds.length} Accounts</span>
                  </>
                )}
              </button>
            </div>

            {/* Broadcast Results Card */}
            {broadcastResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Broadcast Summary
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {broadcastResult.id}
                  </span>
                </div>

                <div className="space-y-2">
                  {broadcastResult.results.map((res) => (
                    <div
                      key={res.accountId}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-rose-400" />
                        <span className="font-semibold text-white font-mono">
                          @{res.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            res.status === 'success'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {res.status.toUpperCase()}
                        </span>
                        {res.postUrl && (
                          <a
                            href={res.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-rose-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {res.error && (
                          <span className="text-[10px] text-rose-400 font-mono truncate max-w-xs">
                            {res.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live 9:16 Instagram Smartphone Mockup */}
        <div className="w-full xl:w-[460px] bg-slate-950/80 p-6 flex flex-col items-center justify-between border-t xl:border-t-0 xl:border-l border-slate-800/80">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Real-Time Device Preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              {mediaPreview && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400" />}
                </button>
              )}
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                iPhone 16 Pro Shell
              </span>
            </div>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="relative w-[300px] h-[610px] rounded-[48px] bg-black p-3.5 phone-shadow border-[3px] border-slate-700/80 flex flex-col justify-between overflow-hidden">
            {/* Dynamic Island Capsule & Status Bar */}
            <div className="absolute top-3 left-0 w-full px-6 flex items-center justify-between text-[10px] font-medium text-white z-40 font-mono">
              <span>9:41</span>
              <div className="w-20 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-900 ml-auto mr-2"></div>
              </div>
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Inner 9:16 Screen Canvas */}
            <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-black flex flex-col justify-between">
              {/* Video or Thumbnail */}
              {mediaPreview ? (
                <video
                  src={mediaPreview}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&fit=crop')",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90"></div>
                </div>
              )}

              {/* Instagram Reel Top Header inside phone */}
              <div className="relative z-20 pt-10 px-4 flex items-center justify-between text-white">
                <span className="font-bold text-sm tracking-tight">Reels</span>
                <div className="flex items-center gap-3">
                  <Music2 className="w-4 h-4" />
                  <Instagram className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Reel Overlays & Action Rail */}
              <div className="relative z-20 pb-4 px-3 flex items-end justify-between">
                {/* Left Side: Profile, Caption, Sound */}
                <div className="flex flex-col gap-1.5 max-w-[200px] text-white">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentPreviewAccount.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'}
                      alt={currentPreviewAccount.username}
                      className="w-7 h-7 rounded-full object-cover border border-white/40"
                    />
                    <span className="text-xs font-semibold truncate">
                      @{currentPreviewAccount.username}
                    </span>
                    <button className="text-[10px] font-bold text-white border border-white/40 rounded px-1.5 py-0.5 hover:bg-white hover:text-black transition-colors">
                      Follow
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-100 line-clamp-2 leading-tight">
                    {caption || 'Behind the scenes...'}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-0.5 font-mono">
                    <Music2 className="w-3 h-3 text-rose-400 flex-shrink-0 animate-spin" />
                    <span className="truncate">
                      Original Audio - @{currentPreviewAccount.username}
                    </span>
                  </div>
                </div>

                {/* Right Action Rail */}
                <div className="flex flex-col items-center gap-3 text-white pb-1">
                  <div className="flex items-center flex-col gap-0.5">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    <span className="text-[9px] font-mono">14.2K</span>
                  </div>
                  <div className="flex items-center flex-col gap-0.5">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-[9px] font-mono">382</span>
                  </div>
                  <div className="flex items-center flex-col gap-0.5">
                    <Share2 className="w-5 h-5" />
                    <span className="text-[9px] font-mono">1.1K</span>
                  </div>
                  <Bookmark className="w-5 h-5" />
                  <MoreHorizontal className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Account Preview Switcher */}
          <div className="w-full mt-4 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-mono text-slate-400">
              Preview handle:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[280px]">
              {accounts.map((acc, idx) => (
                <button
                  key={acc.id}
                  onClick={() => setActivePreviewIndex(idx)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors truncate max-w-[100px] ${
                    activePreviewIndex === idx
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  @{acc.username}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Local Video Projects Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  AI Video Editing Projects
                </h3>
              </div>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {loadingVideos ? (
                <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  <span>Scanning projects directory...</span>
                </div>
              ) : localVideos.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No exported MP4 videos found in local AI project directories.
                </div>
              ) : (
                localVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate font-mono">
                        {vid.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Folder: {vid.folder} • {vid.sizeMb} MB • Modified {new Date(vid.modifiedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => selectLocalVideo(vid)}
                      disabled={importingId === vid.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                    >
                      {importingId === vid.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <span>Use Video</span>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
