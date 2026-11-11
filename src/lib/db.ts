import fs from 'fs';
import path from 'path';
import { DatabaseSchema, InstagramAccount, InstagramBroadcast } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_DATA: DatabaseSchema = {
  accounts: [
    {
      id: 'acc-insta-1',
      name: 'Benjamin Tales',
      username: 'benjamin.taless',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      credentials: {
        sessionFile: 'D:\\ai video editing with image\\insta_session.json',
        username: 'benjamin.taless',
      },
      isSimulated: false,
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

export function getAccounts(): InstagramAccount[] {
  return getDb().accounts || [];
}

export function addAccount(account: InstagramAccount): InstagramAccount {
  const db = getDb();
  if (!db.accounts) db.accounts = [];
  db.accounts.push(account);
  saveDb(db);
  return account;
}

export function removeAccount(id: string): boolean {
  const db = getDb();
  if (!db.accounts) return false;
  const initialLength = db.accounts.length;
  db.accounts = db.accounts.filter((a) => a.id !== id);
  if (db.accounts.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

export function getPosts(): InstagramBroadcast[] {
  const db = getDb();
  return (db.posts || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function savePostBroadcast(post: InstagramBroadcast): void {
  const db = getDb();
  if (!db.posts) db.posts = [];
  const index = db.posts.findIndex((p) => p.id === post.id);
  if (index >= 0) {
    db.posts[index] = post;
  } else {
    db.posts.unshift(post);
  }
  saveDb(db);
}
