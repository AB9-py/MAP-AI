import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
  `);
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
