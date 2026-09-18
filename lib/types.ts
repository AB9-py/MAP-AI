export type SpanStatus = 'idle' | 'running' | 'success' | 'warning' | 'error' | 'healed';

// ─── Session & File Types ───────────────────────────────────────────────

export interface Session {
  id: string;
  name: string;
  source: 'upload' | 'github';
  repo_url: string | null;
  file_count: number;
  created_at: string;
}

export interface FileEntry {
  id: string;
  path: string;
  language: string;
  size_bytes: number;
}

// ─── Message Types ──────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeDiff?: {
    filePath: string;
    oldCode: string;
    newCode: string;
    description: string;
  };
  affectedFiles?: string[];
  steps?: AnalysisStep[];
}

// ─── Analysis Step (replaces TraceSpan for real use) ───────────────────

export interface AnalysisStep {
  id: string;
  name: string;
  status: 'success' | 'error' | 'warning' | 'healed';
  description: string;
  durationMs: number;
}
