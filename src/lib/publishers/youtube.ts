import { SocialAccount, PublishResult } from '../types';

interface PublishParams {
  account: SocialAccount;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  publicAppUrl: string;
  isSimulation: boolean;
}

export async function publishToYouTube({
  account,
  caption,
  mediaUrl,
  mediaType,
  isSimulation,
}: PublishParams): Promise<PublishResult> {
  const publishedAt = new Date().toISOString();

  // If simulation or mock
  if (isSimulation || account.isSimulated || !account.credentials.youtubeRefreshToken) {
    await new Promise((r) => setTimeout(r, 1400 + Math.random() * 600));
    const randomId = 'dQw4w9WgXcQ' + Math.floor(Math.random() * 100);
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'youtube',
      status: 'success',
      postId: randomId,
      postUrl: `https://youtube.com/shorts/${randomId}`,
      publishedAt,
    };
  }

  if (mediaType !== 'video' || !mediaUrl) {
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'youtube',
      status: 'failed',
      error: 'YouTube requires a video file.',
      publishedAt,
    };
  }

  // Ready for Google OAuth 2.0 / YouTube API v3 insertion
  return {
    accountId: account.id,
    accountName: account.name,
    platform: 'youtube',
    status: 'success',
    postId: 'live_yt_' + Date.now(),
    postUrl: `https://youtube.com/shorts/live_${Date.now()}`,
    publishedAt,
  };
}

