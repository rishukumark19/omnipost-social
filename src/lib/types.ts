export type Platform = 'instagram' | 'facebook' | 'twitter' | 'youtube';

export interface SocialAccount {
  id: string;
  platform: Platform;
  name: string;
  handle: string;
  avatarUrl?: string;
  credentials: {
    // Instagram
    instagramAccountId?: string;
    // Facebook & Instagram
    accessToken?: string;
    pageId?: string;
    // Twitter / X
    apiKey?: string;
    apiSecret?: string;
    twitterAccessToken?: string;
    twitterAccessSecret?: string;
    bearerToken?: string;
    // YouTube
    youtubeChannelId?: string;
    youtubeRefreshToken?: string;
  };
  isSimulated?: boolean;
  status: 'active' | 'expired' | 'error';
  createdAt: string;
}

export interface PublishResult {
  accountId: string;
  accountName: string;
  platform: Platform;
  status: 'success' | 'failed';
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt: string;
}

export interface PostBroadcast {
  id: string;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  targetAccountIds: string[];
  createdAt: string;
  status: 'completed' | 'partial' | 'failed' | 'processing';
  results: PublishResult[];
}

export interface AppSettings {
  simulationMode: boolean;
  publicAppUrl: string;
}

export interface DatabaseSchema {
  accounts: SocialAccount[];
  posts: PostBroadcast[];
  settings: AppSettings;
}

