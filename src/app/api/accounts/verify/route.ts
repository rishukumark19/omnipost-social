import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getAccounts, saveDb, getDb } from '@/lib/db';
import { InstagramAccount } from '@/lib/types';

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetId = body.id || body.accountId;
    let account = body.account as InstagramAccount | undefined;

    if (!account && targetId) {
      const allAccounts = getAccounts();
      account = allAccounts.find((a) => a.id === targetId);
    }

    if (!account && (body.username || body.credentials)) {
      account = {
        id: targetId || 'acc-temp-' + Date.now(),
        name: body.name || body.username,
        username: body.username || 'instagram',
        credentials: body.credentials || { username: body.username, password: body.password },
        isSimulated: body.isSimulated ?? false,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    }

    if (!account) {
      return NextResponse.json({ error: 'Account or credentials not found' }, { status: 404 });
    }

    const enginePath = path.join(process.cwd(), 'src', 'lib', 'engine.py');
    const payloadFile = path.join(process.cwd(), 'data', `verify_${Date.now()}.json`);

    fs.writeFileSync(payloadFile, JSON.stringify({ action: 'verify', account }), 'utf-8');

    const { stdout, stderr } = await execFileAsync('python', [enginePath, payloadFile]);

    try {
      fs.unlinkSync(payloadFile);
    } catch {}

    const result = JSON.parse(stdout.trim());

    if (result.status === 'valid' && targetId) {
      const db = getDb();
      const accIndex = db.accounts.findIndex((a) => a.id === targetId);
      if (accIndex >= 0) {
        db.accounts[accIndex].status = 'active';
        if (result.fullName) db.accounts[accIndex].name = result.fullName;
        if (result.avatarUrl) db.accounts[accIndex].avatarUrl = result.avatarUrl;
        if (result.followers) db.accounts[accIndex].followers = String(result.followers);
        saveDb(db);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
