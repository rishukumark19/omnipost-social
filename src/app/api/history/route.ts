import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/lib/db';
import { getSessionUserIdFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = getSessionUserIdFromRequest(req);
  const posts = getPosts(userId);
  return NextResponse.json({ posts, userId });
}
