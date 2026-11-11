import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/db';

export async function GET() {
  const posts = getPosts();
  return NextResponse.json({ posts });
}

