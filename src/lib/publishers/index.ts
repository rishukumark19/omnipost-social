import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { InstagramAccount, InstagramBroadcast, InstagramPublishResult } from '../types';
import { getAccounts, savePostBroadcast } from '../db';

const execFileAsync = promisify(execFile);

interface DispatchOptions {
  caption: string;
  mediaUrl: string;
  mediaType?: 'video' | 'image';
  targetAccountIds: string[];
}

export async function dispatchInstagramBroadcast({
  caption,
  mediaUrl,
  mediaType = 'video',
  targetAccountIds,
}: DispatchOptions): Promise<InstagramBroadcast> {
  const allAccounts = getAccounts();
  const selectedAccounts = allAccounts.filter((acc) =>
    targetAccountIds.includes(acc.id)
  );

  const broadcastId = 'post_' + Date.now();
  const newPost: InstagramBroadcast = {
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

  // Determine local file path
  let localFilePath = '';
  if (mediaUrl) {
    const cleanUrl = mediaUrl.replace(/^\//, '');
    localFilePath = path.join(process.cwd(), 'public', cleanUrl);
  }

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

    // Run Python engine
    const { stdout, stderr } = await execFileAsync('python', [enginePath, payloadFile]);

    try {
      fs.unlinkSync(payloadFile);
    } catch {}

    if (stderr) {
      console.warn('[Instagram Engine STDERR]:', stderr);
    }

    const parsed = JSON.parse(stdout.trim());
    const results: InstagramPublishResult[] = (parsed.results || []).map((r: any) => ({
      accountId: r.accountId,
      username: r.username || 'instagram',
      status: r.status,
      postId: r.postId,
      postUrl: r.postUrl,
      error: r.error,
      publishedAt: new Date().toISOString(),
    }));

    const successCount = results.filter((r) => r.status === 'success').length;
    let finalStatus: InstagramBroadcast['status'] = 'completed';
    if (successCount === 0 && results.length > 0) {
      finalStatus = 'failed';
    } else if (successCount < results.length) {
      finalStatus = 'partial';
    }

    const finishedPost: InstagramBroadcast = {
      ...newPost,
      status: finalStatus,
      results,
    };

    savePostBroadcast(finishedPost);
    return finishedPost;
  } catch (err: any) {
    console.error('Instagram dispatch execution error:', err);

    // Fallback: mark as failed
    const fallbackResults: InstagramPublishResult[] = selectedAccounts.map((acc) => ({
      accountId: acc.id,
      username: acc.username,
      status: 'failed',
      error: err.message || 'Engine execution failed',
      publishedAt: new Date().toISOString(),
    }));

    const failedPost: InstagramBroadcast = {
      ...newPost,
      status: 'failed',
      results: fallbackResults,
    };

    savePostBroadcast(failedPost);
    return failedPost;
  }
}
