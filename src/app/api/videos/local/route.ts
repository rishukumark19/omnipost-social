import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AI_PROJECTS_DIR = 'D:\\ai video editing with image';

interface LocalVideoItem {
  id: string;
  name: string;
  folder: string;
  filePath: string;
  sizeBytes: number;
  sizeMb: string;
  modifiedAt: string;
  suggestedTitle: string;
}

export async function GET() {
  if (!fs.existsSync(AI_PROJECTS_DIR)) {
    return NextResponse.json({ videos: [] });
  }

  const results: LocalVideoItem[] = [];

  function scanDir(dir: string, depth = 0) {
    if (depth > 3) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.venv') {
            scanDir(fullPath, depth + 1);
          }
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp4')) {
          const stats = fs.statSync(fullPath);
          const sizeMb = (stats.size / (1024 * 1024)).toFixed(1) + ' MB';
          const relativeFolder = path.relative(AI_PROJECTS_DIR, dir) || 'root';

          // Format clean suggested title from filename
          let cleanTitle = entry.name
            .replace(/\.mp4$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\bfinal\b|\bmaster\b|\bai\b|\bvideo\b/gi, '')
            .trim();
          
          cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

          results.push({
            id: Buffer.from(fullPath).toString('base64url'),
            name: entry.name,
            folder: relativeFolder,
            filePath: fullPath,
            sizeBytes: stats.size,
            sizeMb,
            modifiedAt: stats.mtime.toISOString(),
            suggestedTitle: cleanTitle,
          });
        }
      }
    } catch (err) {
      console.warn('Scan directory error:', err);
    }
  }

  scanDir(AI_PROJECTS_DIR);

  // Sort by newest modified first
  results.sort(
    (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
  );

  return NextResponse.json({ videos: results });
}

export async function POST(req: NextRequest) {
  try {
    const { filePath, suggestedTitle } = await req.json();

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File does not exist' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const baseName = path.basename(filePath);
    const safeName = `${Date.now()}_${baseName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const destinationPath = path.join(uploadsDir, safeName);

    // Copy file
    fs.copyFileSync(filePath, destinationPath);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeName}`,
      mediaType: 'video',
      suggestedTitle,
      fileName: baseName,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to import video' },
      { status: 500 }
    );
  }
}
