import { NextRequest, NextResponse } from 'next/server';
import { traceEmitter } from '@/lib/trace-emitter';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId') || `sess_${Date.now()}`;
  
  const otelData = traceEmitter.exportOTelJson(sessionId);
  return NextResponse.json(otelData, {
    headers: {
      'Content-Disposition': `attachment; filename="map-ai-trace-${sessionId}.json"`
    }
  });
}
