export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
}

export interface InstagramAccount {
  id: string;
  userId?: string; // ID of the Google user who owns this account
  name: string;
  username: string; // e.g. "benjamin.taless"
  avatarUrl?: string;
  followers?: string;
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
  userId?: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  targetAccountIds: string[];
  createdAt: string;
  status: 'completed' | 'partial' | 'failed' | 'processing';
  results: InstagramPublishResult[];
}

export interface AppSettings {
  simulationMode?: boolean;
  publicAppUrl?: string;
  [key: string]: any;
}

export interface DatabaseSchema {
  users: User[];
  accounts: InstagramAccount[];
  posts: InstagramBroadcast[];
  settings?: AppSettings;
}
