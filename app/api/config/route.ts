import { NextResponse } from 'next/server';
import { getGeminiConfig } from '@/lib/gemini';

export async function GET() {
  const config = getGeminiConfig();
  return NextResponse.json({
    success: true,
    model: config.model,
    apiKeyConfigured: config.hasApiKey,
    demoMode: process.env.GEMINI_DEMO_MODE === 'true',
    setup: config.hasApiKey || process.env.GEMINI_DEMO_MODE === 'true'
      ? 'ready'
      : 'Set GEMINI_API_KEY in .env.local and restart npm run dev, or enable GEMINI_DEMO_MODE=true.',
  });
}
