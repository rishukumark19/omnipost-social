import { NextRequest, NextResponse } from 'next/server';
import { dispatchMultiPost } from '@/lib/publishers';
import { getDb, savePostBroadcast, getPosts } from '@/lib/db';
import { PostBroadcast } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caption, mediaUrl, mediaType, targetAccountIds, scheduledFor } = body;

    if (!caption && !mediaUrl) {
      return NextResponse.json(
        { error: 'Post must have a caption or media attached.' },
        { status: 400 }
      );
    }

    if (!targetAccountIds || !Array.isArray(targetAccountIds) || targetAccountIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one social media account to publish to.' },
        { status: 400 }
      );
    }

    // If post is scheduled for later
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future.' },
          { status: 400 }
        );
      }

      const scheduledPost: PostBroadcast = {
        id: 'post_' + Date.now(),
        caption: caption || '',
        mediaUrl,
        mediaType: mediaType || 'none',
        targetAccountIds,
        createdAt: new Date().toISOString(),
        scheduledFor: scheduledDate.toISOString(),
        status: 'scheduled',
        results: [],
      };

      savePostBroadcast(scheduledPost);
      return NextResponse.json({ success: true, broadcast: scheduledPost, scheduled: true });
    }

    // Publish immediately
    const broadcast = await dispatchMultiPost({
      caption: caption || '',
      mediaUrl,
      mediaType: mediaType || 'none',
      targetAccountIds,
    });

    return NextResponse.json({ success: true, broadcast });
  } catch (error: any) {
    console.error('Multi-post dispatch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch post' },
      { status: 500 }
    );
  }
}

// Background scheduler runner check: triggers due scheduled posts
export async function GET() {
  try {
    const posts = getPosts();
    const now = Date.now();
    const duePosts = posts.filter(
      (p) => p.status === 'scheduled' && p.scheduledFor && new Date(p.scheduledFor).getTime() <= now
    );

    const executed = [];
    for (const post of duePosts) {
      const result = await dispatchMultiPost({
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        targetAccountIds: post.targetAccountIds,
      });
      executed.push(result);
    }

    return NextResponse.json({ checked: posts.length, executed: executed.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
