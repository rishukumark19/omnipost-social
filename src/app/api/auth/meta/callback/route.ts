import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getSettings, addAccount } from '@/lib/db';
import { SocialAccount } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error || 'Authorization failed')}`, req.url)
    );
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const settings = getSettings();
  const baseUrl = settings.publicAppUrl || 'http://localhost:3000';
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/meta/callback`;

  try {
    // 1. Exchange code for Short-Lived User Access Token
    const tokenRes = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      }
    );

    const userToken = tokenRes.data.access_token;

    // 2. Exchange for Long-Lived User Access Token (60-day expiry)
    let longLivedToken = userToken;
    try {
      const longRes = await axios.get(
        'https://graph.facebook.com/v19.0/oauth/access_token',
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: userToken,
          },
        }
      );
      if (longRes.data.access_token) {
        longLivedToken = longRes.data.access_token;
      }
    } catch {
      // Fallback to userToken if exchange fails
    }

    // 3. Fetch all Facebook Pages & connected Instagram Business accounts
    const pagesRes = await axios.get(
      'https://graph.facebook.com/v19.0/me/accounts',
      {
        params: {
          access_token: longLivedToken,
          fields: 'name,id,access_token,instagram_business_account{id,username,profile_picture_url}',
        },
      }
    );

    const pages = pagesRes.data.data || [];

    for (const page of pages) {
      // Add Facebook Page
      const fbAccount: SocialAccount = {
        id: `acc-fb-${page.id}`,
        platform: 'facebook',
        name: page.name,
        handle: `fb.com/${page.id}`,
        credentials: {
          pageId: page.id,
          accessToken: page.access_token, // Page-scoped token
        },
        isSimulated: false,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      addAccount(fbAccount);

      // Add linked Instagram Business Account if exists
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        const igAccount: SocialAccount = {
          id: `acc-ig-${ig.id}`,
          platform: 'instagram',
          name: `${page.name} (IG)`,
          handle: ig.username ? `@${ig.username}` : `@ig_${ig.id}`,
          avatarUrl: ig.profile_picture_url,
          credentials: {
            instagramAccountId: ig.id,
            accessToken: page.access_token, // Page token is used for Instagram publishing
          },
          isSimulated: false,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        addAccount(igAccount);
      }
    }

    return NextResponse.redirect(new URL('/accounts?success=meta_connected', req.url));
  } catch (err: any) {
    console.error('Meta OAuth error:', err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.message || 'OAuth failure';
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(msg)}`, req.url)
    );
  }
}

