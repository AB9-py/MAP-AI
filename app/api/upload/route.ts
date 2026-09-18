import { NextRequest, NextResponse } from 'next/server';
import { createSession, insertFile, updateSessionFileCount, getSession, getSessionFiles } from '@/lib/db';
import { randomUUID } from 'crypto';

// We use dynamic import for JSZip to avoid issues with the edge runtime
async function parseZip(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const files = new Map<string, string>();

  const SKIP = /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webp|pdf|zip|gz|tar|bin|exe|dll|so|dylib)$/i;
  const SKIP_DIRS = /(node_modules|\.git|dist|build|\.next|__pycache__|\.cache)\//;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: Array<{ name: string; file: any }> = [];
  zip.forEach((relativePath, file) => {
    if (!file.dir) entries.push({ name: relativePath, file });
  });

  // Process in parallel but cap concurrency
  const tasks = entries
    .filter(({ name }) => !SKIP.test(name) && !SKIP_DIRS.test(name))
    .slice(0, 500); // hard cap

  await Promise.all(
    tasks.map(async ({ name, file }) => {
      try {
        const text = await file.async('text');
        // Strip leading zip root folder if present
        const cleanPath = name.replace(/^[^/]+\//, '');
        if (cleanPath) files.set(cleanPath, text);
      } catch {
        // Binary file that failed text decode — skip
      }
    })
  );

  return files;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sessionName = (formData.get('name') as string) || 'Uploaded Codebase';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const sessionId = randomUUID();
    createSession(sessionId, sessionName, 'upload');

    const buffer = await file.arrayBuffer();
    let fileMap: Map<string, string>;

    if (file.name.endsWith('.zip')) {
      fileMap = await parseZip(buffer);
    } else {
      // Single file upload
      const content = new TextDecoder().decode(buffer);
      fileMap = new Map([[file.name, content]]);
    }

    let count = 0;
    for (const [filePath, content] of fileMap.entries()) {
      if (content.trim()) {
        insertFile(randomUUID(), sessionId, filePath, content);
        count++;
      }
    }

    updateSessionFileCount(sessionId);

    const session = getSession(sessionId);
    const files = getSessionFiles(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      session,
      fileCount: count,
      files
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
