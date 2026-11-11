export interface InstagramAccount {
  id: string;
  name: string;
  username: string; // e.g. "benjamin.taless"
  avatarUrl?: string;
  credentials: {
    username?: string;
    password?: string;
    sessionFile?: string;
    sessionData?: string;
    accessToken?: string;
    instagramAccountId?: string;
  };
  isSimulated?: boolean;
  status: 'active' | 'expired' | 'error';
  createdAt: string;
}

export interface InstagramPublishResult {
  accountId: string;
  username: string;
  status: 'success' | 'failed';
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt: string;
}

export interface InstagramBroadcast {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  targetAccountIds: string[];
  createdAt: string;
  status: 'completed' | 'partial' | 'failed' | 'processing';
  results: InstagramPublishResult[];
}

export interface DatabaseSchema {
  accounts: InstagramAccount[];
  posts: InstagramBroadcast[];
}
