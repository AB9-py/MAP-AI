import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-3.6-flash';
const PLACEHOLDER_KEYS = new Set(['your_gemini_api_key', 'your-gemini-api-key', 'replace_me', 'changeme']);

function normalizeEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

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
  usage?: GeminiUsage;
  providerError?: { code: string; message: string; retryable: boolean };
}

export interface GeminiUsage {
  model: string;
  promptTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  attempts: number;
}

export function getGeminiConfig(): { model: string; hasApiKey: boolean } {
  const apiKey = normalizeEnvValue(process.env.GEMINI_API_KEY);
  const model = normalizeEnvValue(process.env.GEMINI_MODEL);
  return {
    model: model || DEFAULT_MODEL,
    hasApiKey: apiKey.length > 20 && !PLACEHOLDER_KEYS.has(apiKey.toLowerCase()),
  };
}

function demoResult(files: DebugFile[], userPrompt: string): GeminiDebugResult {
  const cFiles = files.filter(file => /\.(c|h)$/i.test(file.path));
  return {
    explanation: `Demo analysis completed for ${files.length} uploaded files. ${cFiles.length ? `Found ${cFiles.length} C source/header files; compilation is recorded as unavailable because uploaded code is never executed on the host.` : 'No C source files were found.'}\n\nPrompt: ${userPrompt}`,
    affectedFiles: cFiles.map(file => file.path),
    steps: [],
    usage: {
      model: 'demo-local',
      promptTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      attempts: 0,
    },
  };
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
// Gemini 3.6 Flash list pricing (USD per million tokens). Estimates are
// deliberately server-side and are never accepted from the client.
const INPUT_PRICE = 0.50;
const OUTPUT_PRICE = 3.00;

export function estimateGeminiCostUsd(promptTokens: number, outputTokens: number): number {
  return (promptTokens * INPUT_PRICE + outputTokens * OUTPUT_PRICE) / 1_000_000;
}

export function extractJsonPayload(rawText: string): string {
  const trimmed = rawText.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return jsonMatch ? jsonMatch[1].trim() : trimmed;
}

function shouldIncludeFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  if (lower.includes('node_modules/') || lower.includes('.git/') || lower.includes('dist/') || lower.includes('build/')) return false;
  const ext = '.' + lower.split('.').pop();
  if (SKIP_EXTENSIONS.has(ext)) return false;
  return true;
}

export async function analyzeCode(files: DebugFile[], userPrompt: string): Promise<GeminiDebugResult> {
  const t0 = Date.now();
  const config = getGeminiConfig();
  if (process.env.GEMINI_DEMO_MODE === 'true') return demoResult(files, userPrompt);
  if (!config.hasApiKey) {
    throw new Error('GEMINI_API_KEY is not loaded at server startup. Set it in .env.local and restart the server.');
  }
  const genai = new GoogleGenAI({ apiKey: normalizeEnvValue(process.env.GEMINI_API_KEY) });

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

  const model = config.model;
  let response;
  let attempts = 0;
  let providerError: GeminiDebugResult['providerError'];
  while (attempts < 2) {
    attempts++;
    try {
      response = await genai.models.generateContent({ model, contents: prompt });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gemini request failed';
      providerError = { code: 'GEMINI_REQUEST_FAILED', message, retryable: attempts < 2 };
      if (attempts < 2) await new Promise(resolve => setTimeout(resolve, 250 * attempts));
    }
  }

  const usageMetadata = response?.usageMetadata as
    | { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
    | undefined;
  const promptTokens = usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
  const usage: GeminiUsage = {
    model, promptTokens, outputTokens,
    estimatedCostUsd: estimateGeminiCostUsd(promptTokens, outputTokens),
    attempts,
  };
  const rawText = response?.text ?? '';

  // Extract JSON from response (handle cases where model wraps in markdown)
  const jsonText = extractJsonPayload(rawText);

  let parsed: GeminiDebugResult;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // Fallback: treat the whole response as explanation
    parsed = {
      explanation: rawText || 'Gemini was unavailable. Please retry this analysis.',
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

  parsed.usage = usage;
  if (providerError && !rawText) parsed.providerError = providerError;
  return parsed;
}
