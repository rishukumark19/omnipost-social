import path from 'path';
import fs from 'fs';
import { TwitterApi } from 'twitter-api-v2';
import { SocialAccount, PublishResult } from '../types';

interface PublishParams {
  account: SocialAccount;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  publicAppUrl: string;
  isSimulation: boolean;
}

export async function publishToTwitter({
  account,
  caption,
  mediaUrl,
  mediaType,
  isSimulation,
}: PublishParams): Promise<PublishResult> {
  const publishedAt = new Date().toISOString();

  // If simulation is active or account is mock
  if (
    isSimulation ||
    account.isSimulated ||
    (!account.credentials.twitterAccessToken && !account.credentials.bearerToken)
  ) {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));
    const randomId = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
    const handle = account.handle.replace('@', '') || 'user';
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'twitter',
      status: 'success',
      postId: String(randomId),
      postUrl: `https://x.com/${handle}/status/${randomId}`,
      publishedAt,
    };
  }

  const { apiKey, apiSecret, twitterAccessToken, twitterAccessSecret, bearerToken } =
    account.credentials;

  try {
    let client: TwitterApi;

    if (apiKey && apiSecret && twitterAccessToken && twitterAccessSecret) {
      client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: twitterAccessToken,
        accessSecret: twitterAccessSecret,
      });
    } else if (bearerToken) {
      client = new TwitterApi(bearerToken);
    } else {
      throw new Error('Missing valid Twitter API credentials.');
    }

    let mediaIds: string[] = [];

    // If media is provided and local file exists, upload to Twitter v1.1 endpoint
    if (mediaUrl && mediaType !== 'none' && client.v1) {
      const localFilePath = path.join(process.cwd(), 'public', mediaUrl.replace(/^\//, ''));
      if (fs.existsSync(localFilePath)) {
        const mediaId = await client.v1.uploadMedia(localFilePath, {
          mimeType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        });
        mediaIds.push(mediaId);
      }
    }

    // Publish tweet via Twitter API v2
    const tweetPayload: any = { text: caption };
    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds };
    }

    const res = await client.v2.tweet(tweetPayload);
    const tweetId = res.data.id;
    const handle = account.handle.replace('@', '') || 'x';

    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'twitter',
      status: 'success',
      postId: tweetId,
      postUrl: `https://x.com/${handle}/status/${tweetId}`,
      publishedAt,
    };
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown X/Twitter API error';
    return {
      accountId: account.id,
      accountName: account.name,
      platform: 'twitter',
      status: 'failed',
      error: errorMsg,
      publishedAt,
    };
  }
}

