import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionFiles, getFilesForContext, getFileContent } from '@/lib/db';
import { analyzeCode } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userPrompt, focusFile } = body;

    if (!sessionId || !userPrompt) {
      return NextResponse.json({ success: false, error: 'Missing sessionId or userPrompt' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

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

    const result = await analyzeCode(files, userPrompt);

    return NextResponse.json({
      success: true,
      explanation: result.explanation,
      suggestedDiff: result.suggestedDiff ?? null,
      affectedFiles: result.affectedFiles ?? [],
      steps: result.steps ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
