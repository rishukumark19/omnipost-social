import { NextRequest, NextResponse } from 'next/server';
import { getUsers, findOrCreateUser, DEFAULT_USERS } from '@/lib/db';
import { SESSION_COOKIE_NAME, getSessionUserIdFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const currentUserId = getSessionUserIdFromRequest(req);
  const allUsers = getUsers();
  const user = allUsers.find((u) => u.id === currentUserId) || DEFAULT_USERS[0];

  return NextResponse.json({
    user,
    users: allUsers,
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // fallback
    }

    const { searchParams } = new URL(req.url);
    const userId = body.userId || searchParams.get('userId');
    const email = body.email || searchParams.get('email');
    const name = body.name || searchParams.get('name');
    const avatarUrl = body.avatarUrl;

    let targetUser;
    const allUsers = getUsers();

    if (userId) {
      targetUser = allUsers.find((u) => u.id === userId);
    }

    if (!targetUser && email) {
      targetUser = findOrCreateUser(
        email,
        name || email.split('@')[0],
        avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`
      );
    }

    if (!targetUser) {
      targetUser = DEFAULT_USERS[0];
    }

    const res = NextResponse.json({ success: true, user: targetUser });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: targetUser.id,
      path: '/',
      httpOnly: false, // Accessible to client-side scripts as well
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, message: 'Signed out' });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
