import { NextRequest, NextResponse } from 'next/server';
import { applySessionPatch, getSession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId?: string;
      filePath?: string;
      oldCode?: string;
      newCode?: string;
    };
    if (!body.sessionId || !body.filePath || typeof body.oldCode !== 'string' || typeof body.newCode !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId, filePath, oldCode, and newCode are required.' }, { status: 400 });
    }
    if (!getSession(body.sessionId)) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    const result = applySessionPatch(body.sessionId, body.filePath, body.oldCode, body.newCode);
    if (!result.success) return NextResponse.json(result, { status: 409 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Patch application failed.' }, { status: 500 });
  }
}
