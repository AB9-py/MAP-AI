import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionFiles } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const files = getSessionFiles(sessionId);
  const export_data = {
    session,
    files: files.map(f => ({ path: f.path, language: f.language, sizeBytes: f.size_bytes })),
    exportedAt: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(export_data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="map-ai-session-${sessionId.slice(0, 8)}.json"`,
    },
  });
}
