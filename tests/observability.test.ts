import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { estimateGeminiCostUsd, extractJsonPayload } from '../lib/gemini';
import { POST as restartRun } from '../app/api/runs/restart/route';
import { POST as forkRun } from '../app/api/runs/fork/route';
import {
  addTraceStep,
  createRun,
  createSession,
  insertFile,
  getRun,
  getTraceStep,
  deleteSession,
} from '../lib/db';

describe('Map AI 2.1 observability', () => {
  const sessionIds: string[] = [];

  afterEach(() => {
    for (const sessionId of sessionIds.splice(0)) deleteSession(sessionId);
  });

  it('calculates server-side Gemini cost from token usage', () => {
    expect(estimateGeminiCostUsd(1_000_000, 1_000_000)).toBe(3.5);
    expect(estimateGeminiCostUsd(0, 0)).toBe(0);
  });

  it('keeps malformed provider output isolated for safe fallback handling', () => {
    expect(() => JSON.parse(extractJsonPayload('not valid json'))).toThrow();
    expect(extractJsonPayload('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it('persists immutable run lineage and trace steps', () => {
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    createSession(sessionId, 'test', 'upload');
    const root = createRun({ id: randomUUID(), session_id: sessionId, prompt: 'find bug' });
    const step = addTraceStep({
      id: randomUUID(),
      run_id: root.id,
      step_index: 0,
      name: 'Build context',
      kind: 'local',
      status: 'success',
      description: 'selected files',
      duration_ms: 2,
      estimated_cost_usd: 0,
    });
    const fork = createRun({
      id: randomUUID(),
      session_id: sessionId,
      parent_run_id: root.id,
      fork_step_id: step.id,
      prompt: 'try alternate fix',
    });

    expect(getRun(fork.id)?.parent_run_id).toBe(root.id);
    expect(getRun(fork.id)?.fork_step_id).toBe(step.id);
    expect(getTraceStep(step.id)?.estimated_cost_usd).toBe(0);
  });

  it('validates restart and fork API inputs and preserves lineage', async () => {
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    createSession(sessionId, 'api test', 'upload');
    const root = createRun({ id: randomUUID(), session_id: sessionId, prompt: 'trace' });
    const step = addTraceStep({
      id: randomUUID(), run_id: root.id, step_index: 0, name: 'local',
      kind: 'local', status: 'success', description: 'safe', duration_ms: 1,
    });

    const invalid = await restartRun(new NextRequest('http://localhost/api/runs/restart', {
      method: 'POST', body: JSON.stringify({}), headers: { 'content-type': 'application/json' },
    }));
    expect(invalid.status).toBe(400);

    const forkResponse = await forkRun(new NextRequest('http://localhost/api/runs/fork', {
      method: 'POST',
      body: JSON.stringify({ runId: root.id, stepId: step.id }),
      headers: { 'content-type': 'application/json' },
    }));
    const forkBody = await forkResponse.json();
    expect(forkResponse.status).toBe(200);
    expect(getRun(forkBody.run.id)?.parent_run_id).toBe(root.id);
  });

  it('runs a deterministic six-stage C demo without executing uploaded code', async () => {
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    createSession(sessionId, 'C_miniprojekt', 'upload');
    insertFile(randomUUID(), sessionId, 'main.c', 'int main(void) { return 0; }');
    const previousDemoMode = process.env.GEMINI_DEMO_MODE;
    process.env.GEMINI_DEMO_MODE = 'true';
    try {
      const { POST } = await import('../app/api/agent/stream/route');
      const response = await POST(new NextRequest('http://localhost/api/agent/stream', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          prompt: 'Run the complete trace for C_miniprojekt and do not execute uploaded code.',
        }),
        headers: { 'content-type': 'application/json' },
      }));
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.steps).toHaveLength(6);
      expect(body.steps.find((step: { name: string }) => step.name === 'C compilation').description).toContain('not compiled');
      expect(body.steps.every((step: { apiCostUsd: number }) => step.apiCostUsd === 0)).toBe(true);
    } finally {
      if (previousDemoMode === undefined) delete process.env.GEMINI_DEMO_MODE;
      else process.env.GEMINI_DEMO_MODE = previousDemoMode;
    }
  });
});
