import { NextRequest, NextResponse } from 'next/server';
import { createSession, insertFile, updateSessionFileCount, getSession, getSessionFiles } from '@/lib/db';
import { randomUUID } from 'crypto';

const SKIP_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webp|pdf|zip|gz|tar|bin|exe|dll|so|dylib|pyc|pyo|class|o|a)$/i;
const SKIP_DIRS = /(node_modules|\.git|dist|build|\.next|__pycache__|\.cache|venv|\.venv|vendor)($|\/)/;
const MAX_FILES = 300;
const MAX_FILE_SIZE_BYTES = 150_000;

// Parse a GitHub URL into { owner, repo }
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace('.git', '') };
  } catch {
    return null;
  }
}

async function getDefaultBranch(owner: string, repo: string): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'map-ai-debugger',
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (response.status === 404) {
    throw new Error('Repository not found. Confirm the URL points to a public GitHub repository.');
  }
  if (response.status === 403) {
    throw new Error('GitHub is rate-limiting requests. Please wait a minute and try again.');
  }
  if (!response.ok) return null;

  const data = await response.json() as { default_branch?: string };
  return data.default_branch ?? null;
}

// Download via codeload, which is GitHub's archive host and avoids HTML redirects.
async function downloadRepoZip(owner: string, repo: string): Promise<ArrayBuffer> {
  const defaultBranch = await getDefaultBranch(owner, repo);
  const branches = [...new Set([defaultBranch, 'main', 'master'].filter((branch): branch is string => Boolean(branch)))];
  let lastStatus: number | undefined;

  for (const branch of branches) {
    const url = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${encodeURIComponent(branch)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'map-ai-debugger' },
      signal: AbortSignal.timeout(30_000),
    });
    lastStatus = response.status;
    if (response.ok) {
      return await response.arrayBuffer();
    }
  }

  throw new Error(
    lastStatus === 404
      ? 'Repository archive was not found. Confirm the repository is public and has commits.'
      : `GitHub could not provide the repository archive (HTTP ${lastStatus ?? 'network error'}). Please try again.`
  );
}

async function parseZipBuffer(buffer: ArrayBuffer, owner: string, repo: string): Promise<Map<string, string>> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const files = new Map<string, string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: Array<{ name: string; file: any }> = [];
  zip.forEach((relativePath, file) => {
    if (!file.dir) entries.push({ name: relativePath, file });
  });

  // GitHub archives have a leading folder like "repo-main/"
  const prefix = `${repo}-`;

  const filtered = entries.filter(({ name }) => {
    // Strip leading archive folder
    const withoutPrefix = name.replace(/^[^/]+\//, '');
    if (!withoutPrefix) return false;
    if (SKIP_EXTENSIONS.test(name)) return false;
    if (SKIP_DIRS.test(name)) return false;
    return true;
  }).slice(0, MAX_FILES);

  await Promise.all(
    filtered.map(async ({ name, file }) => {
      try {
        // Check size before downloading
        const metadata = file._data;
        if (metadata && metadata.uncompressedSize && metadata.uncompressedSize > MAX_FILE_SIZE_BYTES) return;

        const text = await file.async('text');
        if (!text.trim()) return;

        // Strip the leading "reponame-branch/" folder
        const cleanPath = name.replace(/^[^/]+\//, '');
        if (cleanPath) files.set(cleanPath, text);
      } catch {
        // Binary or unreadable — skip
      }
    })
  );

  return files;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json({ success: false, error: 'Missing repoUrl' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json({
        success: false,
        error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo'
      }, { status: 400 });
    }

    const { owner, repo } = parsed;
    const sessionName = `${owner}/${repo}`;

    // Download repo as ZIP directly (no GitHub API rate limits)
    const zipBuffer = await downloadRepoZip(owner, repo);

    // Parse ZIP
    const fileMap = await parseZipBuffer(zipBuffer, owner, repo);

    if (fileMap.size === 0) {
      return NextResponse.json({
        success: false,
        error: 'No readable files found in this repository.'
      }, { status: 400 });
    }

    // Store in DB
    const sessionId = randomUUID();
    createSession(sessionId, sessionName, 'github', repoUrl);

    for (const [filePath, content] of fileMap.entries()) {
      insertFile(randomUUID(), sessionId, filePath, content);
    }

    updateSessionFileCount(sessionId);

    const session = getSession(sessionId);
    const files = getSessionFiles(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      session,
      fileCount: fileMap.size,
      files,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
