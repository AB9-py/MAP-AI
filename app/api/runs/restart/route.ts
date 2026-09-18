import { NextRequest, NextResponse } from 'next/server';
import { createRun, getRun } from '@/lib/db';
import { randomUUID } from 'crypto';

/** Create a new immutable attempt for an existing run. */
export async function POST(req: NextRequest) {
  try {
    const { runId, prompt } = await req.json();
    if (!runId) return NextResponse.json({ success: false, error: 'Missing runId' }, { status: 400 });
    const previous = getRun(runId);
    if (!previous) return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
    const run = createRun({
      id: randomUUID(), session_id: previous.session_id, parent_run_id: previous.id,
      fork_step_id: null, prompt: prompt || previous.prompt,
      attempt: previous.attempt + 1, model: previous.model,
    });
    return NextResponse.json({ success: true, run });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid restart request' }, { status: 400 });
  }
}
