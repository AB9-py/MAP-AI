import { NextRequest, NextResponse } from 'next/server';
import { getRuns, getSession, getSessionFailureEvents, getTraceSteps } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
  if (!getSession(sessionId)) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  const runs = getRuns(sessionId);
  return NextResponse.json({
    success: true,
    runs: runs.map(run => ({ ...run, steps: getTraceSteps(run.id) })),
    failures: getSessionFailureEvents(sessionId),
  });
}
