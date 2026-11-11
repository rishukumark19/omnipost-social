import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getAccounts, addAccount, removeAccount } from '@/lib/db';
import { InstagramAccount } from '@/lib/types';
import { getSessionUserIdFromRequest } from '@/lib/auth';

const execFileAsync = promisify(execFile);

export async function GET(req: NextRequest) {
  const userId = getSessionUserIdFromRequest(req);
  const accounts = getAccounts(userId);
  return NextResponse.json({ accounts, userId });
}

export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromRequest(req);
    const body = await req.json();
    const { name, username, credentials, isSimulated, followers } = body;

    const cleanUsername = (username || name || '').trim().replace(/^@/, '');

    if (!cleanUsername) {
      return NextResponse.json(
        { error: 'Instagram username is required.' },
        { status: 400 }
      );
    }

    let verifiedAvatarUrl = body.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop`;
    let verifiedFollowers = followers || '10K';
    let verifiedName = name || cleanUsername;
    let initialStatus: 'active' | 'expired' | 'error' = 'active';

    // If real credentials provided (sessionid or password) and not simulated, verify with engine
    if (!isSimulated && credentials && (credentials.sessionid || credentials.password)) {
      try {
        const enginePath = path.join(process.cwd(), 'src', 'lib', 'engine.py');
        const payloadFile = path.join(process.cwd(), 'data', `add_${Date.now()}.json`);
        
        const tempAccount = {
          username: cleanUsername,
          credentials,
          isSimulated: false,
        };

        fs.writeFileSync(payloadFile, JSON.stringify({ action: 'verify', account: tempAccount }), 'utf-8');
        const { stdout } = await execFileAsync('python', [enginePath, payloadFile]);
        
        try { fs.unlinkSync(payloadFile); } catch {}

        const result = JSON.parse(stdout.trim());
        if (result.status === 'valid') {
          if (result.avatarUrl) verifiedAvatarUrl = result.avatarUrl;
          if (result.followers) verifiedFollowers = String(result.followers);
          if (result.fullName) verifiedName = result.fullName;
          initialStatus = 'active';
        } else {
          // If session expired or invalid credentials
          console.warn(`[AddAccount] Verification notice for @${cleanUsername}:`, result.error);
        }
      } catch (verErr) {
        console.warn(`[AddAccount] Engine verification error:`, verErr);
      }
    }

    const newAccount: InstagramAccount = {
      id: 'acc-ig-' + Date.now(),
      userId,
      name: verifiedName,
      username: cleanUsername,
      followers: verifiedFollowers,
      avatarUrl: verifiedAvatarUrl,
      credentials: credentials || { username: cleanUsername },
      isSimulated: isSimulated ?? false,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    addAccount(newAccount, userId);
    return NextResponse.json({ success: true, account: newAccount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = getSessionUserIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing account id' }, { status: 400 });
  }

  const removed = removeAccount(id, userId);
  if (!removed) {
    return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
