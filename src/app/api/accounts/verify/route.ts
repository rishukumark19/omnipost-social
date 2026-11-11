import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getAccounts, saveDb, getDb } from '@/lib/db';

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    const accounts = getAccounts();
    const account = accounts.find((a) => a.id === id);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const enginePath = path.join(process.cwd(), 'src', 'lib', 'engine.py');
    const payloadFile = path.join(process.cwd(), 'data', `verify_${Date.now()}.json`);

    fs.writeFileSync(payloadFile, JSON.stringify({ action: 'verify', account }), 'utf-8');

    const { stdout, stderr } = await execFileAsync('python', [enginePath, payloadFile]);

    try {
      fs.unlinkSync(payloadFile);
    } catch {}

    const result = JSON.parse(stdout.trim());

    if (result.status === 'valid') {
      const db = getDb();
      const accIndex = db.accounts.findIndex((a) => a.id === id);
      if (accIndex >= 0) {
        db.accounts[accIndex].status = 'active';
        if (result.fullName) db.accounts[accIndex].name = result.fullName;
        if (result.avatarUrl) db.accounts[accIndex].avatarUrl = result.avatarUrl;
        saveDb(db);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}

