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

export async function publishToInstagram({
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
    // Simulate real network delay for processing video
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const randomId = Math.floor(100000000000000 + Math.random() * 900000000000000);
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'instagram',
      status: 'success',
      postId: String(randomId),
      postUrl: `https://instagram.com/p/sim_${randomId}`,
      publishedAt,
    };
  }

  const { accessToken, instagramAccountId } = account.credentials;

  if (!instagramAccountId || !accessToken) {
    throw new Error('Instagram Account ID or Access Token is missing.');
  }

  // Instagram REQUIRES media (an image or a video)
  if (!mediaUrl || mediaType === 'none') {
    throw new Error('Instagram Graph API requires an image or video to create a post.');
  }

  // Construct absolute public URL
  const absoluteMediaUrl = mediaUrl.startsWith('http')
    ? mediaUrl
    : `${publicAppUrl.replace(/\/$/, '')}${mediaUrl}`;

  try {
    // Step 1: Create media container
    const containerParams: Record<string, string> = {
      caption,
      access_token: accessToken,
    };

    if (mediaType === 'video') {
      containerParams.media_type = 'REELS';
      containerParams.video_url = absoluteMediaUrl;
    } else {
      containerParams.image_url = absoluteMediaUrl;
    }

    const containerRes = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
      null,
      { params: containerParams }
    );

    const creationId = containerRes.data.id;
    if (!creationId) {
      throw new Error('Failed to retrieve Instagram media container ID.');
    }

    // Step 2: If video/reels, poll container status until READY
    if (mediaType === 'video') {
      let isReady = false;
      let attempts = 0;
      while (!isReady && attempts < 15) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await axios.get(
          `https://graph.facebook.com/v19.0/${creationId}`,
          {
            params: {
              fields: 'status_code',
              access_token: accessToken,
            },
          }
        );

        const status = statusRes.data.status_code;
        if (status === 'FINISHED') {
          isReady = true;
        } else if (status === 'ERROR' || status === 'EXPIRED') {
          throw new Error(`Instagram container failed processing with status: ${status}`);
        }
      }

      if (!isReady) {
        throw new Error('Instagram container processing timed out.');
      }
    }

    // Step 3: Publish container
    const publishRes = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
      }
    );

    const finalPostId = publishRes.data.id;

    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'instagram',
      status: 'success',
      postId: finalPostId,
      postUrl: `https://www.instagram.com/p/${finalPostId}`,
      publishedAt,
    };
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error?.message || error.message || 'Unknown Instagram API error';
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'instagram',
      status: 'failed',
      error: errorMsg,
      publishedAt,
    };
  }
}

