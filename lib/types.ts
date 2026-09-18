export type SpanStatus = 'idle' | 'running' | 'success' | 'warning' | 'error' | 'healed';

export type NodeType = 
  | 'context_compaction'
  | 'intent_routing'
  | 'ast_analysis'
  | 'tool_execution'
  | 'sandbox_test'
  | 'failure_interception'
  | 'self_healing'
  | 'patch_verification'
  | 'response_synthesis';

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  rawUncompressedTokens: number;
  savedTokens: number;
  compressionRatioPercent: number;
  costUsd: number;
}

export interface LatencyBreakdown {
  contextCompactionMs: number;
  llmInferenceMs: number;
  sandboxExecutionMs: number;
  totalMs: number;
}

export interface TraceSpan {
  id: string;
  name: string;
  nodeType: NodeType;
  status: SpanStatus;
  startedAt: number;
  endedAt?: number;
  durationMs: number;
  tokens: {
    input: number;
    output: number;
  };
  costUsd: number;
  details: {
    title: string;
    description: string;
    inputPayload?: string | object;
    outputPayload?: string | object;
    errorSignature?: string;
    healingAction?: string;
  };
}

export interface ContextEntity {
  key: string;
  value: string;
  pinnedAtTurn: number;
  category: 'file' | 'function' | 'constraint' | 'env';
}

export interface EpisodicSummary {
  turnRange: string;
  summary: string;
  tokensSaved: number;
}

export interface ContextMemoryState {
  activeBufferTurns: number;
  activeBufferTokens: number;
  entityStore: ContextEntity[];
  entityTokens: number;
  episodicSummaries: EpisodicSummary[];
  summaryTokens: number;
  prunedNoiseItems: string[];
  prunedTokens: number;
  totalCompactedTokens: number;
  rawEquivalentTokens: number;
  compressionRatio: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  turnIndex: number;
  associatedTraceId?: string;
  codeDiff?: {
    filename: string;
    oldCode: string;
    newCode: string;
  };
  testOutput?: {
    passed: boolean;
    testsRun: number;
    testsFailed: number;
    stdout: string;
  };
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'Happy Path' | 'Failure & Healing' | 'Long Context (20 Turns)' | 'Tool Interception';
  prompt: string;
  targetFile: string;
}
