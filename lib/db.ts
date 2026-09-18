import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'debug.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('upload', 'github')),
      repo_url TEXT,
      file_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'text',
      size_bytes INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_files_session ON files(session_id);

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      parent_run_id TEXT REFERENCES runs(id),
      fork_step_id TEXT,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'success', 'failed', 'cancelled')),
      attempt INTEGER NOT NULL DEFAULT 1,
      model TEXT,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      estimated_cost_usd REAL NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_runs_session ON runs(session_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_runs_parent ON runs(parent_run_id);

    CREATE TABLE IF NOT EXISTS trace_steps (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      step_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('local', 'gemini', 'fallback')),
      status TEXT NOT NULL CHECK(status IN ('running', 'success', 'failed', 'warning', 'healed')),
      description TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      estimated_cost_usd REAL NOT NULL DEFAULT 0,
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(run_id, step_index)
    );
    CREATE INDEX IF NOT EXISTS idx_trace_steps_run ON trace_steps(run_id, step_index);

    CREATE TABLE IF NOT EXISTS failure_events (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      step_id TEXT REFERENCES trace_steps(id),
      code TEXT NOT NULL,
      message TEXT NOT NULL,
      retryable INTEGER NOT NULL DEFAULT 0,
      attempt INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_failure_events_run ON failure_events(run_id, created_at);
  `);
  const failureColumns = db.prepare(`PRAGMA table_info(failure_events)`).all() as Array<{ name: string }>;
  const existing = new Set(failureColumns.map(column => column.name));
  for (const [name, definition] of [
    ['file_path', 'TEXT'],
    ['line_number', 'INTEGER'],
    ['root_cause', 'TEXT'],
    ['recovery', 'TEXT'],
  ] as const) {
    if (!existing.has(name)) db.exec(`ALTER TABLE failure_events ADD COLUMN ${name} ${definition}`);
  }
}

export interface Run {
  id: string; session_id: string; parent_run_id: string | null; fork_step_id: string | null;
  prompt: string; status: 'running' | 'success' | 'failed' | 'cancelled'; attempt: number;
  model: string | null; prompt_tokens: number; output_tokens: number; estimated_cost_usd: number;
  error_message: string | null; started_at: string; completed_at: string | null;
}
export interface TraceStep {
  id: string; run_id: string; step_index: number; name: string;
  kind: 'local' | 'gemini' | 'fallback'; status: string; description: string;
  duration_ms: number; prompt_tokens: number; output_tokens: number;
  estimated_cost_usd: number; metadata_json: string | null; created_at: string;
}
export interface FailureEvent {
  id: string; run_id: string; step_id: string | null; code: string; message: string;
  retryable: number; attempt: number; created_at: string; file_path?: string | null;
  line_number?: number | null; root_cause?: string | null; recovery?: string | null;
}

export type NewRun = Pick<Run, 'id' | 'session_id' | 'prompt'> &
  Partial<Pick<Run, 'parent_run_id' | 'fork_step_id' | 'status' | 'attempt' | 'model'>>;
export function createRun(run: NewRun) {
  const db = getDb();
  db.prepare(`INSERT INTO runs (id, session_id, parent_run_id, fork_step_id, prompt, status, attempt, model)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(run.id, run.session_id, run.parent_run_id ?? null, run.fork_step_id ?? null,
    run.prompt, run.status ?? 'running', run.attempt ?? 1, run.model ?? null);
  return getRun(run.id)!;
}
export function getRun(id: string) { return getDb().prepare('SELECT * FROM runs WHERE id = ?').get(id) as Run | undefined; }
export function getRuns(sessionId: string) { return getDb().prepare('SELECT * FROM runs WHERE session_id = ? ORDER BY started_at DESC').all(sessionId) as Run[]; }
export function updateRun(id: string, values: Partial<Pick<Run, 'status' | 'model' | 'prompt_tokens' | 'output_tokens' | 'estimated_cost_usd' | 'error_message' | 'completed_at'>>) {
  const allowed = Object.keys(values);
  if (!allowed.length) return;
  const set = allowed.map(k => `${k} = @${k}`).join(', ');
  getDb().prepare(`UPDATE runs SET ${set} WHERE id = @id`).run({ ...values, id });
}
export function addTraceStep(step: Omit<TraceStep, 'created_at' | 'prompt_tokens' | 'output_tokens' | 'estimated_cost_usd' | 'metadata_json'> & Partial<Pick<TraceStep, 'prompt_tokens' | 'output_tokens' | 'estimated_cost_usd' | 'metadata_json'>>) {
  getDb().prepare(`INSERT INTO trace_steps (id, run_id, step_index, name, kind, status, description, duration_ms, prompt_tokens, output_tokens, estimated_cost_usd, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(step.id, step.run_id, step.step_index, step.name, step.kind, step.status,
    step.description, step.duration_ms, step.prompt_tokens ?? 0, step.output_tokens ?? 0, step.estimated_cost_usd ?? 0, step.metadata_json ?? null);
  return getTraceStep(step.id)!;
}
export function getTraceStep(id: string) { return getDb().prepare('SELECT * FROM trace_steps WHERE id = ?').get(id) as TraceStep | undefined; }
export function getTraceSteps(runId: string) { return getDb().prepare('SELECT * FROM trace_steps WHERE run_id = ? ORDER BY step_index').all(runId) as TraceStep[]; }
export function addFailureEvent(event: Omit<FailureEvent, 'created_at' | 'step_id'> & Partial<Pick<FailureEvent, 'step_id'>>) {
  getDb().prepare(`INSERT INTO failure_events (id, run_id, step_id, code, message, retryable, attempt, file_path, line_number, root_cause, recovery) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(event.id, event.run_id, event.step_id ?? null, event.code, event.message, event.retryable ? 1 : 0, event.attempt,
      event.file_path ?? null, event.line_number ?? null, event.root_cause ?? null, event.recovery ?? null);
}
export function getFailureEvents(runId: string) { return getDb().prepare('SELECT * FROM failure_events WHERE run_id = ? ORDER BY created_at').all(runId) as FailureEvent[]; }
export function getSessionFailureEvents(sessionId: string) {
  return getDb().prepare(`
    SELECT failure_events.*
    FROM failure_events
    JOIN runs ON runs.id = failure_events.run_id
    WHERE runs.session_id = ?
    ORDER BY failure_events.created_at DESC
  `).all(sessionId) as FailureEvent[];
}

export function createSession(id: string, name: string, source: 'upload' | 'github', repoUrl?: string) {
  const db = getDb();
  db.prepare(`
    INSERT INTO sessions (id, name, source, repo_url, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(id, name, source, repoUrl ?? null);
}

export function insertFile(id: string, sessionId: string, filePath: string, content: string) {
  const db = getDb();
  const language = detectLanguage(filePath);
  db.prepare(`
    INSERT OR REPLACE INTO files (id, session_id, path, content, language, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, sessionId, filePath, content, language, Buffer.byteLength(content, 'utf8'));
}

export function updateSessionFileCount(sessionId: string) {
  const db = getDb();
  db.prepare(`
    UPDATE sessions SET file_count = (SELECT COUNT(*) FROM files WHERE session_id = ?)
    WHERE id = ?
  `).run(sessionId, sessionId);
}

export function getSessions() {
  const db = getDb();
  return db.prepare(`SELECT * FROM sessions ORDER BY created_at DESC`).all() as Session[];
}

export function getSession(id: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as Session | undefined;
}

export function getSessionFiles(sessionId: string) {
  const db = getDb();
  return db.prepare(`SELECT id, path, language, size_bytes FROM files WHERE session_id = ? ORDER BY path`).all(sessionId) as FileEntry[];
}

export function getFileContent(sessionId: string, filePath: string) {
  const db = getDb();
  return db.prepare(`SELECT content FROM files WHERE session_id = ? AND path = ?`).get(sessionId, filePath) as { content: string } | undefined;
}

export function applySessionPatch(sessionId: string, filePath: string, oldCode: string, newCode: string) {
  const db = getDb();
  const file = db.prepare(`SELECT content FROM files WHERE session_id = ? AND path = ?`).get(sessionId, filePath) as { content: string } | undefined;
  if (!file) return { success: false, error: 'File is not part of this session snapshot.' };
  const firstIndex = file.content.indexOf(oldCode);
  if (!oldCode || firstIndex < 0) return { success: false, error: 'Patch rejected: the expected original code was not found.' };
  if (file.content.indexOf(oldCode, firstIndex + oldCode.length) >= 0) {
    return { success: false, error: 'Patch rejected: original code is ambiguous; include a more specific snippet.' };
  }
  const content = file.content.slice(0, firstIndex) + newCode + file.content.slice(firstIndex + oldCode.length);
  db.prepare(`UPDATE files SET content = ?, size_bytes = ? WHERE session_id = ? AND path = ?`)
    .run(content, Buffer.byteLength(content, 'utf8'), sessionId, filePath);
  return { success: true, filePath, applied: true };
}

export function getFilesForContext(sessionId: string, limit = 30) {
  const db = getDb();
  // Prefer smaller, text-like files for AI context
  return db.prepare(`
    SELECT path, content, language FROM files
    WHERE session_id = ? AND language != 'binary'
    ORDER BY size_bytes ASC
    LIMIT ?
  `).all(sessionId, limit) as { path: string; content: string; language: string }[];
}

export function deleteSession(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
}

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
    '.py': 'python', '.rb': 'ruby', '.go': 'go', '.rs': 'rust', '.java': 'java',
    '.c': 'c', '.cpp': 'cpp', '.h': 'c', '.cs': 'csharp', '.php': 'php',
    '.swift': 'swift', '.kt': 'kotlin', '.md': 'markdown', '.json': 'json',
    '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml', '.env': 'env',
    '.html': 'html', '.css': 'css', '.scss': 'scss', '.sh': 'bash',
    '.sql': 'sql', '.xml': 'xml', '.tf': 'terraform', '.dockerfile': 'dockerfile',
  };
  if (filePath.toLowerCase().includes('dockerfile')) return 'dockerfile';
  return map[ext] ?? 'text';
}

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
