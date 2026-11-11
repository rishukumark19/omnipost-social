import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { SocialAccount, PostBroadcast, PublishResult } from '../types';
import { getAccounts, getSettings, savePostBroadcast } from '../db';
import { publishToInstagram } from './instagram';
import { publishToFacebook } from './facebook';
import { publishToTwitter } from './twitter';
import { publishToYouTube } from './youtube';

const execFileAsync = promisify(execFile);

interface DispatchOptions {
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  targetAccountIds: string[];
}

export async function dispatchMultiPost({
  caption,
  mediaUrl,
  mediaType = 'none',
  targetAccountIds,
}: DispatchOptions): Promise<PostBroadcast> {
  const allAccounts = getAccounts();
  const settings = getSettings();
  const isSimulation = settings.simulationMode;
  const publicAppUrl = settings.publicAppUrl || 'http://localhost:3000';

  const selectedAccounts = allAccounts.filter((acc) =>
    targetAccountIds.includes(acc.id)
  );

  const broadcastId = 'post_' + Date.now();
  const newPost: PostBroadcast = {
    id: broadcastId,
    caption,
    mediaUrl,
    mediaType,
    targetAccountIds,
    createdAt: new Date().toISOString(),
    status: 'processing',
    results: [],
  };

  savePostBroadcast(newPost);

  // If there is media and real python engine is available
  let localFilePath = '';
  if (mediaUrl) {
    const cleanUrl = mediaUrl.replace(/^\//, '');
    localFilePath = path.join(process.cwd(), 'public', cleanUrl);
  }

  // If simulation mode is OFF, run the REAL Python publisher engine!
  if (!isSimulation) {
    try {
      const enginePath = path.join(process.cwd(), 'src', 'lib', 'engine.py');
      const payloadFile = path.join(process.cwd(), 'data', `payload_${Date.now()}.json`);

      const payload = {
        action: 'publish',
        filePath: localFilePath,
        caption,
        accounts: selectedAccounts,
      };

      fs.writeFileSync(payloadFile, JSON.stringify(payload), 'utf-8');

      // Call Python engine
      const { stdout, stderr } = await execFileAsync('python', [enginePath, payloadFile]);

      // Clean up temp payload
      try {
        fs.unlinkSync(payloadFile);
      } catch {}

      if (stderr) {
        console.warn('[Engine STDERR]:', stderr);
      }

      const parsed = JSON.parse(stdout.trim());
      const results: PublishResult[] = (parsed.results || []).map((r: any) => ({
        accountId: r.accountId,
        accountName: r.accountName,
        platform: r.platform,
        status: r.status,
        postId: r.postId,
        postUrl: r.postUrl,
        error: r.error,
        publishedAt: new Date().toISOString(),
      }));

      const successCount = results.filter((r) => r.status === 'success').length;
      let finalStatus: PostBroadcast['status'] = 'completed';
      if (successCount === 0 && results.length > 0) {
        finalStatus = 'failed';
      } else if (successCount < results.length) {
        finalStatus = 'partial';
      }

      const finishedPost: PostBroadcast = {
        ...newPost,
        status: finalStatus,
        results,
      };

      savePostBroadcast(finishedPost);
      return finishedPost;
    } catch (engineErr: any) {
      console.error('Python engine execution failed, falling back to HTTP publishers:', engineErr);
    }
  }

  // Fallback / Simulation dispatcher
  const publishPromises = selectedAccounts.map(async (account): Promise<PublishResult> => {
    try {
      switch (account.platform) {
        case 'instagram':
          return await publishToInstagram({
            account,
            caption,
            mediaUrl,
            mediaType,
            publicAppUrl,
            isSimulation,
          });
        case 'facebook':
          return await publishToFacebook({
            account,
            caption,
            mediaUrl,
            mediaType,
            publicAppUrl,
            isSimulation,
          });
        case 'twitter':
          return await publishToTwitter({
            account,
            caption,
            mediaUrl,
            mediaType,
            publicAppUrl,
            isSimulation,
          });
        case 'youtube':
          return await publishToYouTube({
            account,
            caption,
            mediaUrl,
            mediaType,
            publicAppUrl,
            isSimulation,
          });
        default:
          return {
            accountId: account.id,
            accountName: account.name,
            platform: account.platform,
            status: 'failed',
            error: `Unsupported platform: ${account.platform}`,
            publishedAt: new Date().toISOString(),
          };
      }
    } catch (err: any) {
      return {
        accountId: account.id,
        accountName: account.name,
        platform: account.platform,
        status: 'failed',
        error: err.message || 'Execution failed',
        publishedAt: new Date().toISOString(),
      };
    }
  });

  const settledResults = await Promise.allSettled(publishPromises);
  const results: PublishResult[] = settledResults.map((r, index) => {
    if (r.status === 'fulfilled') {
      return r.value;
    }
    const acc = selectedAccounts[index];
    return {
      accountId: acc.id,
      accountName: acc.name,
      platform: acc.platform,
      status: 'failed',
      error: r.reason?.message || 'Unhandled dispatch error',
      publishedAt: new Date().toISOString(),
    };
  });

  const successCount = results.filter((r) => r.status === 'success').length;
  let finalStatus: PostBroadcast['status'] = 'completed';
  if (successCount === 0 && results.length > 0) {
    finalStatus = 'failed';
  } else if (successCount < results.length) {
    finalStatus = 'partial';
  }

  const finishedPost: PostBroadcast = {
    ...newPost,
    status: finalStatus,
    results,
  };

  savePostBroadcast(finishedPost);
  return finishedPost;
}
