import axios from 'axios';
import { SocialAccount, PublishResult } from '../types';

interface PublishParams {
  account: SocialAccount;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  publicAppUrl: string;
  isSimulation: boolean;
}

export async function publishToFacebook({
  account,
  caption,
  mediaUrl,
  mediaType,
  publicAppUrl,
  isSimulation,
}: PublishParams): Promise<PublishResult> {
  const publishedAt = new Date().toISOString();

  // If simulation is active or account is mock
  if (isSimulation || account.isSimulated || !account.credentials.accessToken) {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 600));
    const randomId = Math.floor(100000000000000 + Math.random() * 900000000000000);
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'facebook',
      status: 'success',
      postId: String(randomId),
      postUrl: `https://facebook.com/${randomId}`,
      publishedAt,
    };
  }

  const { accessToken, pageId } = account.credentials;

  if (!pageId || !accessToken) {
    throw new Error('Facebook Page ID or Page Access Token is missing.');
  }

  const absoluteMediaUrl = mediaUrl
    ? mediaUrl.startsWith('http')
      ? mediaUrl
      : `${publicAppUrl.replace(/\/$/, '')}${mediaUrl}`
    : undefined;

  try {
    let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const params: Record<string, string> = {
      access_token: accessToken,
    };

    if (mediaType === 'video' && absoluteMediaUrl) {
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
      params.description = caption;
      params.file_url = absoluteMediaUrl;
    } else if (mediaType === 'image' && absoluteMediaUrl) {
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      params.caption = caption;
      params.url = absoluteMediaUrl;
    } else {
      params.message = caption;
    }

    const res = await axios.post(endpoint, null, { params });
    const postId = res.data.id || res.data.post_id;

    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'facebook',
      status: 'success',
      postId,
      postUrl: `https://www.facebook.com/${postId}`,
      publishedAt,
    };
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error?.message || error.message || 'Unknown Facebook API error';
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'facebook',
      status: 'failed',
      error: errorMsg,
      publishedAt,
    };
  }
}

