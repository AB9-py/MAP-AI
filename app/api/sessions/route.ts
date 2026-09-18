import { NextRequest, NextResponse } from 'next/server';
import { getSessions, deleteSession } from '@/lib/db';

export async function GET() {
  try {
    const sessions = getSessions();
    return NextResponse.json({ success: true, sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'Missing session id' }, { status: 400 });
    deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
