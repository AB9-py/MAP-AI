import { NextRequest, NextResponse } from 'next/server';
import { getFileContent } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const filePath = searchParams.get('path');

  if (!sessionId || !filePath) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const result = getFileContent(sessionId, filePath);
  if (!result) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({ content: result.content });
}
