import { NextRequest, NextResponse } from 'next/server';
import { dispatchMultiPost } from '@/lib/publishers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caption, mediaUrl, mediaType, targetAccountIds } = body;

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

