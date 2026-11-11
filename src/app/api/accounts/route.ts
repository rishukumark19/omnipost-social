import { NextRequest, NextResponse } from 'next/server';
import { getAccounts, addAccount, removeAccount } from '@/lib/db';
import { InstagramAccount } from '@/lib/types';
import { getSessionUserIdFromRequest } from '@/lib/auth';

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

    const newAccount: InstagramAccount = {
      id: 'acc-ig-' + Date.now(),
      userId,
      name: name || cleanUsername,
      username: cleanUsername,
      followers: followers || '0',
      avatarUrl:
        body.avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop`,
      credentials: credentials || { username: cleanUsername },
      isSimulated: isSimulated ?? false,
      status: 'active',
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
