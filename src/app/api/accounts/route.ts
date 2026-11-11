import { NextRequest, NextResponse } from 'next/server';
import { getAccounts, addAccount, removeAccount } from '@/lib/db';
import { SocialAccount } from '@/lib/types';

export async function GET() {
  const accounts = getAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, name, handle, avatarUrl, credentials, isSimulated } = body;

    if (!platform || !name || !handle) {
      return NextResponse.json(
        { error: 'Platform, account name, and handle are required.' },
        { status: 400 }
      );
    }

    const newAccount: SocialAccount = {
      id: 'acc-' + Date.now(),
      platform,
      name,
      handle: handle.startsWith('@') ? handle : `@${handle}`,
      avatarUrl:
        avatarUrl ||
        (platform === 'instagram'
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop'
          : platform === 'facebook'
          ? 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&h=120&fit=crop'
          : platform === 'twitter'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'),
      credentials: credentials || {},
      isSimulated: isSimulated ?? false,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    addAccount(newAccount);
    return NextResponse.json({ success: true, account: newAccount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing account id' }, { status: 400 });
  }

  const removed = removeAccount(id);
  if (!removed) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}

