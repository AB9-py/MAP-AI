import { NextRequest, NextResponse } from 'next/server';
import { createRun, getRun, getTraceStep } from '@/lib/db';
import { randomUUID } from 'crypto';

/** Branch a run at a recorded step without modifying its history. */
export async function POST(req: NextRequest) {
  try {
    const { runId, stepId, prompt } = await req.json();
    if (!runId || !stepId) return NextResponse.json({ success: false, error: 'Missing runId or stepId' }, { status: 400 });
    const parent = getRun(runId);
    const step = getTraceStep(stepId);
    if (!parent || !step || step.run_id !== parent.id) {
      return NextResponse.json({ success: false, error: 'Run or step not found' }, { status: 404 });
    }
    const run = createRun({
      id: randomUUID(), session_id: parent.session_id, parent_run_id: parent.id,
      fork_step_id: step.id, prompt: prompt || parent.prompt, attempt: 1, model: parent.model,
    });
    return NextResponse.json({ success: true, run, forkedFrom: { runId: parent.id, stepId: step.id } });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid fork request' }, { status: 400 });
  }
}
