import { DemoScenario, Message, TraceSpan } from './types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'failure-healing',
    title: '💥 Live Test Failure & Self-Healing Loop',
    subtitle: 'Natural PyTest regression caught & resolved via reflection',
    category: 'Failure & Healing',
    description: 'Fix calculate_tax() in checkout.py. Patch v1 causes regression on tax-exempt states. Map AI catches the failure span, extracts error signature, and self-heals in 1 turn.',
    prompt: 'Fix calculate_tax() in services/checkout.py: Ensure tax-exempt states like Oregon and Delaware are handled properly.',
    targetFile: 'services/checkout.py'
  },
  {
    id: 'long-context-25-turns',
    title: '🧠 25-Turn Long Session Stress Test',
    subtitle: '4-Tier context compactor prevents token explosion & drift',
    category: 'Long Context (20 Turns)',
    description: 'Simulates a 25-turn deep engineering session. Demonstrates how Map AI keeps active turns in full detail, pins entity facts, and summarizes older turns, keeping token usage under 2.2k tokens.',
    prompt: 'Review checkout edge-case rules across our 25-turn session and verify all constraint requirements.',
    targetFile: 'services/checkout.py'
  },
  {
    id: 'happy-path',
    title: '⚡ Fast Deterministic Bug Patch',
    subtitle: 'AST parsing, patch generation, and green test suite',
    category: 'Happy Path',
    description: 'User reports discount coupon AUTUMN26 bypassed during checkout total. Map AI locates AST node, generates diff, and runs PyTest to verify.',
    prompt: 'Fix discount calculation in services/checkout.py where coupon AUTUMN26 is not applied if cart contains subscription items.',
    targetFile: 'services/checkout.py'
  },
  {
    id: 'tool-interception',
    title: '🚫 Hallucinated Path & Tool Interception',
    subtitle: 'Agent attempts non-existent path -> Intercepted & redirected',
    category: 'Tool Interception',
    description: 'Agent tries to open legacy file services/cart_v2.py. Tracer intercepts 404 FileNotFoundError, feeds repo tree AST, and agent self-corrects.',
    prompt: 'Refactor checkout discount handler in services/cart_v2.py to support multi-currency formatting.',
    targetFile: 'services/checkout.py'
  }
];

export const INITIAL_CHAT_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'system',
    content: 'Welcome to Map AI Cockpit. Select a demo scenario above or enter a repo debugging request below.',
    timestamp: '10:00 AM',
    turnIndex: 0
  }
];
