import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/agent-orchestrator';
import { traceEmitter } from '@/lib/trace-emitter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, existingMessages = [], customPrompt } = body;

    const result = await agentOrchestrator.executeScenario(
      scenarioId || 'failure-healing',
      existingMessages,
      customPrompt
    );

    const tokenMetrics = traceEmitter.calculateMetrics(result.contextState.rawEquivalentTokens);
    const latencyMetrics = traceEmitter.calculateLatency();

    return NextResponse.json({
      success: true,
      spans: result.spans,
      messages: result.messages,
      contextState: result.contextState,
      tokenMetrics,
      latencyMetrics,
      finalMessage: result.finalMessage
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
