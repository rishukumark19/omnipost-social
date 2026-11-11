import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID;
  const settings = getSettings();
  const baseUrl = settings.publicAppUrl || 'http://localhost:3000';
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/meta/callback`;

  if (!appId) {
    // If no App ID configured in .env, redirect back with helpful error
    return NextResponse.redirect(
      new URL('/accounts?error=META_APP_ID_MISSING', req.url)
    );
  }

  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
  ].join(',');

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&response_type=code`;

  return NextResponse.redirect(authUrl);
}

