import { NextRequest, NextResponse } from 'next/server';
import { dispatchInstagramBroadcast } from '@/lib/publishers';
import { getSessionUserIdFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserIdFromRequest(req);
    const body = await req.json();
    const { caption, mediaUrl, mediaType, targetAccountIds } = body;

    if (!mediaUrl) {
      return NextResponse.json(
        { error: 'Instagram requires a video file or photo to publish a Reel/Post.' },
        { status: 400 }
      );
    }

    if (!targetAccountIds || !Array.isArray(targetAccountIds) || targetAccountIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one Instagram account to publish to.' },
        { status: 400 }
      );
    }

    const broadcast = await dispatchInstagramBroadcast({
      userId,
      caption: caption || '',
      mediaUrl,
      mediaType: mediaType || 'video',
      targetAccountIds,
    });

    return NextResponse.json({ success: true, broadcast });
  } catch (error: any) {
    console.error('Instagram publish route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish to Instagram' },
      { status: 500 }
    );
  }
}
