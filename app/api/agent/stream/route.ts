import { NextRequest, NextResponse } from 'next/server';
import { getSession, getFilesForContext, getFileContent } from '@/lib/db';
import { analyzeCode, getGeminiConfig } from '@/lib/gemini';
import { addFailureEvent, addTraceStep, createRun, getRun, getTraceSteps, updateRun } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  let runId: string | undefined;
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : typeof body.session_id === 'string' ? body.session_id : '';
    const userPrompt = typeof body.userPrompt === 'string' ? body.userPrompt.trim() : typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const focusFile = typeof body.focusFile === 'string' ? body.focusFile : undefined;

    if (!sessionId || !userPrompt) {
      return NextResponse.json({ success: false, error: 'Missing sessionId and prompt. Send { sessionId, userPrompt }.' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const run = createRun({ id: randomUUID(), session_id: sessionId, prompt: userPrompt });
    runId = run.id;
    const localStart = Date.now();
    // Get files for context — prioritise the focused file if one is selected
    let files = getFilesForContext(sessionId, 40);

    // If user clicked a specific file, ensure it's first + fully included
    if (focusFile) {
      const focusContent = getFileContent(sessionId, focusFile);
      if (focusContent) {
        files = files.filter(f => f.path !== focusFile);
        files.unshift({ path: focusFile, content: focusContent.content, language: 'text' });
      }
    }
    addTraceStep({
      id: randomUUID(), run_id: run.id, step_index: 0, name: 'Build context', kind: 'local',
      status: 'success', description: `Selected ${files.length} files for analysis`, duration_ms: Date.now() - localStart,
    });

    const geminiStart = Date.now();
    const result = await analyzeCode(files, userPrompt);
    const usage = result.usage;
    const cFiles = files.filter(file => /\.(c|h)$/i.test(file.path));
    const trace = [
      { name: 'Build context', kind: 'local' as const, description: `Discovered and selected ${files.length} uploaded files; context is bounded by server limits`, duration: Date.now() - localStart, status: 'success' as const, cost: 0 },
      { name: 'Inventory repository', kind: 'local' as const, description: `Indexed ${files.length} uploaded files and filtered binary/generated paths`, duration: 0, status: 'success' as const, cost: 0 },
      { name: 'Static safety scan', kind: 'local' as const, description: 'Inspected source as data; no uploaded code was executed on the host', duration: 0, status: 'success' as const, cost: 0 },
      { name: 'C compilation', kind: 'local' as const, description: cFiles.length ? 'Unavailable by host-execution policy; C source was not compiled or executed' : 'Not applicable: no C source files detected', duration: 0, status: 'warning' as const, cost: 0 },
      { name: 'Gemini analysis', kind: result.providerError ? 'fallback' as const : usage?.model === 'demo-local' ? 'local' as const : 'gemini' as const, description: result.providerError?.message ?? `Prompt constructed (${files.length} files); analyzed with ${usage?.model ?? getGeminiConfig().model}`, duration: Date.now() - geminiStart, status: result.providerError ? 'warning' as const : 'success' as const, cost: usage?.estimatedCostUsd ?? 0 },
      { name: 'Validate analysis output', kind: 'local' as const, description: result.explanation ? `Parsed findings, patch payload, and ${usage?.attempts ?? 0} Gemini attempt(s); verification remains host-safe` : 'Provider returned no explanation', duration: 0, status: result.explanation ? 'success' as const : 'warning' as const, cost: 0 },
    ];
    trace.slice(1).forEach((step, index) => addTraceStep({
      id: randomUUID(), run_id: run.id, step_index: index + 1, name: step.name,
      kind: step.kind, status: step.status, description: step.description, duration_ms: step.duration,
      prompt_tokens: index === 4 ? usage?.promptTokens ?? 0 : 0,
      output_tokens: index === 4 ? usage?.outputTokens ?? 0 : 0,
      estimated_cost_usd: step.cost,
      metadata_json: JSON.stringify({
        model: index === 4 ? usage?.model ?? null : null,
        attempts: index === 4 ? usage?.attempts ?? 0 : 0,
        promptChars: index === 4 ? userPrompt.length : 0,
        inputFileCount: index === 4 ? files.length : 0,
        outputShape: index === 4 ? 'explanation/affectedFiles/suggestedDiff/steps' : null,
      }),
    }));
    const persistedTraceSteps = getTraceSteps(run.id);
    const geminiStepId = persistedTraceSteps[4].id;
    if (result.providerError) {
      addFailureEvent({
        id: randomUUID(), run_id: run.id, step_id: geminiStepId, code: result.providerError.code,
        message: result.providerError.message, retryable: result.providerError.retryable ? 1 : 0, attempt: usage?.attempts ?? 1,
        root_cause: result.providerError.message.includes('API_KEY_INVALID')
          ? 'The configured Gemini credential was rejected by the provider.'
          : 'The Gemini provider did not return a usable response.',
        recovery: 'Check .env.local, remove placeholder/extra quotes, restart npm run dev, or enable GEMINI_DEMO_MODE=true.',
      });
    }
    updateRun(run.id, {
      status: result.providerError ? 'failed' : 'success', model: usage?.model ?? null, prompt_tokens: usage?.promptTokens ?? 0,
      output_tokens: usage?.outputTokens ?? 0, estimated_cost_usd: usage?.estimatedCostUsd ?? 0,
      error_message: result.providerError?.message ?? null,
      completed_at: new Date().toISOString(),
    });

    if (result.providerError) {
      return NextResponse.json({
        success: false,
        error: 'Gemini unavailable after retry',
        detail: `${result.providerError.message} Check GEMINI_API_KEY, GEMINI_MODEL, quota, or provider status and retry.`,
        runId: run.id,
        steps: persistedTraceSteps.map(step => ({
          id: step.id, name: step.name, status: step.status === 'failed' ? 'error' : step.status,
          description: step.description, durationMs: step.duration_ms,
          kind: step.kind === 'fallback' ? 'fallback' : step.kind,
          apiCostUsd: step.estimated_cost_usd, runId: run.id,
        })),
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      runId: run.id,
      explanation: result.explanation,
      suggestedDiff: result.suggestedDiff ?? null,
      affectedFiles: result.affectedFiles ?? [],
      steps: persistedTraceSteps.map(step => ({
        id: step.id, name: step.name, status: step.status === 'failed' ? 'error' : step.status,
        description: step.description, durationMs: step.duration_ms, kind: step.kind === 'fallback' ? 'fallback' : step.kind,
        apiCostUsd: step.estimated_cost_usd, runId: run.id,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (runId) {
      const existingSteps = getTraceSteps(runId);
      const nextSteps = [
        'Inventory repository',
        'Static safety scan',
        'C compilation',
        'Gemini analysis',
        'Validate analysis output',
      ];
      for (let index = existingSteps.length; index < 6; index++) {
        addTraceStep({
          id: randomUUID(),
          run_id: runId,
          step_index: index,
          name: nextSteps[index - 1] ?? 'Analysis step',
          kind: index === 4 ? 'fallback' : 'local',
          status: 'failed',
          description: index === 4 ? message : 'Skipped because an earlier analysis step failed',
          duration_ms: 0,
          estimated_cost_usd: 0,
        });
      }
      addFailureEvent({
        id: randomUUID(), run_id: runId, code: 'ANALYSIS_FAILED', message, retryable: 1, attempt: 1,
        root_cause: 'The analysis pipeline failed before producing a complete provider result.',
        recovery: 'Review the failure details, restart the run, or use GEMINI_DEMO_MODE=true for a deterministic local demo.',
      });
      updateRun(runId, { status: 'failed', error_message: message, completed_at: new Date().toISOString() });
    }
    // A run may have been created before a local or provider failure. Keep the
    // failure durable and return a stable error rather than leaking internals.
    return NextResponse.json({
      success: false,
      error: 'Analysis failed',
      detail: message,
      runId,
      steps: runId ? getTraceSteps(runId).map(step => ({
        id: step.id,
        name: step.name,
        status: step.status === 'failed' ? 'error' : step.status,
        description: step.description,
        durationMs: step.duration_ms,
        kind: step.kind === 'fallback' ? 'fallback' : step.kind,
        apiCostUsd: step.estimated_cost_usd,
        runId,
      })) : [],
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const runId = new URL(req.url).searchParams.get('runId');
  if (!runId) return NextResponse.json({ success: false, error: 'Missing runId' }, { status: 400 });
  const run = getRun(runId);
  if (!run) return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
  return NextResponse.json({ success: true, run, steps: getTraceSteps(runId) });
}
