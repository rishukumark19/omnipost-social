import fs from 'fs';
import path from 'path';
import { DatabaseSchema, SocialAccount, PostBroadcast, AppSettings } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_DATA: DatabaseSchema = {
  settings: {
    simulationMode: true,
    publicAppUrl: 'http://localhost:3000',
  },
  accounts: [
    {
      id: 'acc-insta-1',
      platform: 'instagram',
      name: 'CrossTech Instagram',
      handle: '@crosstech_official',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
      credentials: {
        instagramAccountId: '17841400000000001',
        accessToken: 'mock_insta_token_1',
      },
      isSimulated: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-insta-2',
      platform: 'instagram',
      name: 'AI Video Edits',
      handle: '@aivideo_creators',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      credentials: {
        instagramAccountId: '17841400000000002',
        accessToken: 'mock_insta_token_2',
      },
      isSimulated: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-fb-1',
      platform: 'facebook',
      name: 'CrossTech Facebook Page',
      handle: 'fb.com/CrossTechPage',
      avatarUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&h=120&fit=crop',
      credentials: {
        pageId: '1098765432101',
        accessToken: 'mock_fb_token_1',
      },
      isSimulated: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-x-1',
      platform: 'twitter',
      name: 'CrossTech X',
      handle: '@crosstech_ai',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      credentials: {
        bearerToken: 'mock_x_bearer',
      },
      isSimulated: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-yt-1',
      platform: 'youtube',
      name: 'AI Video Studios (YT)',
      handle: '@AIVideoStudios',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
      credentials: {
        youtubeChannelId: 'UCmockchannel123',
      },
      isSimulated: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ],
  posts: [],
};

function ensureDbExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
}

export function getDb(): DatabaseSchema {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading db.json, returning initial state', error);
    return INITIAL_DATA;
  }
}

export function saveDb(data: DatabaseSchema): void {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAccounts(): SocialAccount[] {
  return getDb().accounts;
}

export function addAccount(account: SocialAccount): SocialAccount {
  const db = getDb();
  db.accounts.push(account);
  saveDb(db);
  return account;
}

export function removeAccount(id: string): boolean {
  const db = getDb();
  const initialLength = db.accounts.length;
  db.accounts = db.accounts.filter((a) => a.id !== id);
  if (db.accounts.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

export function getPosts(): PostBroadcast[] {
  const db = getDb();
  return db.posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function savePostBroadcast(post: PostBroadcast): void {
  const db = getDb();
  const index = db.posts.findIndex((p) => p.id === post.id);
  if (index >= 0) {
    db.posts[index] = post;
  } else {
    db.posts.unshift(post);
  }
  saveDb(db);
}

export function getSettings(): AppSettings {
  return getDb().settings;
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const db = getDb();
  db.settings = { ...db.settings, ...settings };
  saveDb(db);
  return db.settings;
}

