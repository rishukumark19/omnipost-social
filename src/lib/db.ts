import fs from 'fs';
import path from 'path';
import { DatabaseSchema, InstagramAccount, InstagramBroadcast, User } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export const DEFAULT_USERS: User[] = [
  {
    id: 'google-rishu',
    name: 'Rishu Kumar',
    email: 'rishu.crosstech@gmail.com',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXOpsepvkP6jTzv7VpKBAj22SW31dVEct4RIblYzJe0U-C2S6H6aZD2jlXJRS3XBN1Js4rSwvib060J2r9NzjSQBjanjwVUmaXxohp-dHhdCclx9vUUzDwFA_uGIJy3YxhS05QE0ZWW84Cf67_alwoSVFhatDHJOcOW91rysD2q6P7FO2aAb-3nJBvMgdu72e5aAYgchcbQiqR2zn3LDK7l1RBdt6ZIFVUOw1LsdWOOZaLkDA386AHTjnaoGrEXJOK_RZE8YGI11U',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'google-alex',
    name: 'Alex Morgan',
    email: 'alex.m@linearstudio.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_DATA: DatabaseSchema = {
  users: DEFAULT_USERS,
  accounts: [
    {
      id: 'acc-insta-1',
      userId: 'google-rishu',
      name: 'Benjamin Tales',
      username: 'benjamin.taless',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      followers: '14.8K',
      credentials: {
        sessionFile: 'D:\\ai video editing with image\\insta_session.json',
        username: 'benjamin.taless',
      },
      isSimulated: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-insta-2',
      userId: 'google-alex',
      name: 'Design Digest',
      username: 'design.digest',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
      followers: '184.2K',
      credentials: {
        username: 'design.digest',
      },
      isSimulated: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-insta-3',
      userId: 'google-alex',
      name: 'Minimal Vibes Studio',
      username: 'minimalvibes.studio',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
      followers: '92.4K',
      credentials: {
        username: 'minimalvibes.studio',
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
    const data = JSON.parse(raw);
    if (!data.users || data.users.length === 0) {
      data.users = DEFAULT_USERS;
    }
    // ensure each account has a userId if missing
    if (data.accounts) {
      data.accounts = data.accounts.map((a: any) => ({
        ...a,
        userId: a.userId || 'google-rishu',
      }));
    }
    return data as DatabaseSchema;
  } catch (error) {
    console.error('Error reading db.json, returning initial state', error);
    return INITIAL_DATA;
  }
}

export function saveDb(data: DatabaseSchema): void {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getUsers(): User[] {
  return getDb().users || DEFAULT_USERS;
}

export function findOrCreateUser(email: string, name?: string, avatarUrl?: string): User {
  const db = getDb();
  if (!db.users) db.users = [];
  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: 'user-' + Buffer.from(email).toString('hex').slice(0, 10),
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb(db);
  }
  return user;
}

export function getAccounts(userId?: string): InstagramAccount[] {
  const db = getDb();
  const accounts = db.accounts || [];
  if (!userId) return accounts;
  return accounts.filter((a) => a.userId === userId);
}

export function addAccount(account: InstagramAccount, userId?: string): InstagramAccount {
  const db = getDb();
  if (!db.accounts) db.accounts = [];
  const assignedUserId = userId || account.userId || 'google-rishu';
  const newAcc: InstagramAccount = {
    ...account,
    userId: assignedUserId,
  };
  db.accounts.push(newAcc);
  saveDb(db);
  return newAcc;
}

export function removeAccount(id: string, userId?: string): boolean {
  const db = getDb();
  if (!db.accounts) return false;
  const initialLength = db.accounts.length;
  db.accounts = db.accounts.filter((a) => {
    if (userId) {
      return !(a.id === id && a.userId === userId);
    }
    return a.id !== id;
  });
  if (db.accounts.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

export function getPosts(userId?: string): InstagramBroadcast[] {
  const db = getDb();
  let posts = db.posts || [];
  if (userId) {
    posts = posts.filter((p) => !p.userId || p.userId === userId);
  }
  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function savePostBroadcast(post: InstagramBroadcast, userId?: string): void {
  const db = getDb();
  if (!db.posts) db.posts = [];
  const assignedPost = {
    ...post,
    userId: userId || post.userId || 'google-rishu',
  };
  const index = db.posts.findIndex((p) => p.id === assignedPost.id);
  if (index >= 0) {
    db.posts[index] = assignedPost;
  } else {
    db.posts.unshift(assignedPost);
  }
  saveDb(db);
}

export function getSettings(): Record<string, any> {
  const db = getDb();
  return db.settings || { simulationMode: false, publicAppUrl: 'http://localhost:3001' };
}

export function updateSettings(settings: Record<string, any>): Record<string, any> {
  const db = getDb();
  db.settings = { ...db.settings, ...settings };
  saveDb(db);
  return db.settings;
}

