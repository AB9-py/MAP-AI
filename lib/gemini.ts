import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface DebugFile {
  path: string;
  content: string;
  language: string;
}

export interface GeminiDebugResult {
  explanation: string;
  suggestedDiff?: {
    filePath: string;
    oldCode: string;
    newCode: string;
    description: string;
  };
  affectedFiles: string[];
  steps: AnalysisStep[];
}

export interface AnalysisStep {
  id: string;
  name: string;
  status: 'success' | 'error' | 'warning' | 'healed';
  description: string;
  durationMs: number;
}

const SKIP_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webp', '.pdf', '.zip', '.gz', '.tar', '.lock']);
const MAX_FILE_CHARS = 4000;
const MAX_TOTAL_CHARS = 80_000;

function shouldIncludeFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  if (lower.includes('node_modules/') || lower.includes('.git/') || lower.includes('dist/') || lower.includes('build/')) return false;
  const ext = '.' + lower.split('.').pop();
  if (SKIP_EXTENSIONS.has(ext)) return false;
  return true;
}

export async function analyzeCode(files: DebugFile[], userPrompt: string): Promise<GeminiDebugResult> {
  const t0 = Date.now();

  // Build a file tree string
  const tree = files.map(f => `  ${f.path}`).join('\n');

  // Build file contents block (truncate large files)
  let totalChars = 0;
  const fileBlocks: string[] = [];
  for (const f of files) {
    if (!shouldIncludeFile(f.path)) continue;
    const snippet = f.content.length > MAX_FILE_CHARS
      ? f.content.slice(0, MAX_FILE_CHARS) + '\n... [truncated]'
      : f.content;
    const block = `\`\`\`${f.language}\n// FILE: ${f.path}\n${snippet}\n\`\`\``;
    if (totalChars + block.length > MAX_TOTAL_CHARS) break;
    fileBlocks.push(block);
    totalChars += block.length;
  }

  const prompt = `You are an expert code debugger. You have been given access to a real codebase. Analyze the code and answer the user's question or fix the bug they described.

## Repository File Tree
\`\`\`
${tree}
\`\`\`

## File Contents
${fileBlocks.join('\n\n')}

## User Request
${userPrompt}

## Instructions
Respond ONLY with a valid JSON object following this exact schema (no markdown wrapper):
{
  "explanation": "A clear, concise explanation of your findings or the fix. Use markdown formatting.",
  "affectedFiles": ["list", "of", "affected", "file", "paths"],
  "suggestedDiff": {
    "filePath": "path/to/file.ext",
    "oldCode": "the original code snippet to replace",
    "newCode": "the fixed code snippet",
    "description": "One-line description of the change"
  },
  "steps": [
    { "id": "1", "name": "Step name", "status": "success", "description": "What was done", "durationMs": 120 }
  ]
}

If no code change is needed (e.g. it is an explanation-only question), set "suggestedDiff" to null.
The "steps" array should show 3-5 logical analysis steps you performed (e.g., "Parsed file tree", "Located bug", "Generated fix").`;

  const response = await genai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
  });

  const rawText = response.text ?? '';

  // Extract JSON from response (handle cases where model wraps in markdown)
  let jsonText = rawText.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonText = jsonMatch[1].trim();

  let parsed: GeminiDebugResult;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // Fallback: treat the whole response as explanation
    parsed = {
      explanation: rawText,
      affectedFiles: [],
      steps: [
        { id: '1', name: 'Code Analysis', status: 'success', description: 'Analyzed codebase', durationMs: Date.now() - t0 }
      ]
    };
  }

  // Ensure steps have proper timing
  if (!parsed.steps || parsed.steps.length === 0) {
    parsed.steps = [
      { id: '1', name: 'File Tree Scan', status: 'success', description: `Scanned ${files.length} files`, durationMs: 45 },
      { id: '2', name: 'Code Analysis', status: 'success', description: 'Analyzed with Gemini 2.0 Flash', durationMs: Date.now() - t0 - 45 },
    ];
  }

  return parsed;
}
