import { TraceSpan, Message, ContextMemoryState } from './types';
import { contextCompactor } from './context-compactor';
import { traceEmitter } from './trace-emitter';

export interface OrchestratorRunResult {
  spans: TraceSpan[];
  messages: Message[];
  contextState: ContextMemoryState;
  finalMessage: Message;
}

export class AgentOrchestrator {
  /**
   * Generates execution steps for the chosen scenario or custom prompt
   */
  public async executeScenario(
    scenarioId: string,
    existingMessages: Message[],
    customPrompt?: string
  ): Promise<OrchestratorRunResult> {
    const prompt = customPrompt || (
      scenarioId === 'failure-healing' 
        ? 'Fix calculate_tax() in services/checkout.py: Ensure tax-exempt states like Oregon and Delaware are handled properly.'
        : scenarioId === 'long-context-25-turns'
        ? 'Review checkout edge-case rules across our 25-turn session and verify all constraint requirements.'
        : scenarioId === 'tool-interception'
        ? 'Refactor checkout discount handler in services/cart_v2.py to support multi-currency formatting.'
        : 'Fix discount calculation in services/checkout.py where coupon AUTUMN26 is not applied.'
    );

    const turnIndex = existingMessages.length + 1;
    const userMsg: Message = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      turnIndex
    };

    const allMessages = [...existingMessages, userMsg];
    const { state: contextState } = contextCompactor.compact(allMessages);

    const spans: TraceSpan[] = [];
    const baseTime = Date.now();

    // STEP 1: Context Compaction
    spans.push({
      id: `span-1-${Date.now()}`,
      name: '4-Tier Context Compaction',
      nodeType: 'context_compaction',
      status: 'success',
      startedAt: baseTime,
      endedAt: baseTime + 18,
      durationMs: 18,
      tokens: { input: 120, output: 0 },
      costUsd: 0.000009,
      details: {
        title: 'Context Optimization Complete',
        description: `Reduced raw history from ${contextState.rawEquivalentTokens} tokens down to ${contextState.totalCompactedTokens} tokens (${contextState.compressionRatio}% savings).`,
        inputPayload: { rawTurns: allMessages.length, uncompressedTokens: contextState.rawEquivalentTokens },
        outputPayload: { compactedTokens: contextState.totalCompactedTokens, activeEntities: contextState.entityStore.length }
      }
    });

    // STEP 2: Intent & AST Router
    spans.push({
      id: `span-2-${Date.now()}`,
      name: 'AST Target Locator',
      nodeType: 'ast_analysis',
      status: 'success',
      startedAt: baseTime + 22,
      endedAt: baseTime + 140,
      durationMs: 118,
      tokens: { input: 450, output: 85 },
      costUsd: 0.000059,
      details: {
        title: 'AST Located in services/checkout.py',
        description: 'Parsed repository syntax tree. Identified function `calculate_tax` at L62-L89 with 3 caller dependencies.',
        inputPayload: { query: 'calculate_tax', targetRepo: 'ecommerce-core' },
        outputPayload: { file: 'services/checkout.py', lines: '62-89', complexityScore: 4 }
      }
    });

    if (scenarioId === 'tool-interception') {
      // Scenario: Tool Interception (Bad path)
      spans.push({
        id: `span-3-err-${Date.now()}`,
        name: 'Tool Execution: open_file()',
        nodeType: 'tool_execution',
        status: 'error',
        startedAt: baseTime + 150,
        endedAt: baseTime + 190,
        durationMs: 40,
        tokens: { input: 210, output: 25 },
        costUsd: 0.000023,
        details: {
          title: '404 FileNotFoundError: services/cart_v2.py',
          description: 'Agent requested non-existent file path from legacy hallucination.',
          errorSignature: 'FileNotFoundError: [Errno 2] No such file or directory: "services/cart_v2.py"',
          inputPayload: { path: 'services/cart_v2.py' }
        }
      });

      spans.push({
        id: `span-4-heal-${Date.now()}`,
        name: 'Tracer Intercept & Path Resolution',
        nodeType: 'failure_interception',
        status: 'healed',
        startedAt: baseTime + 200,
        endedAt: baseTime + 360,
        durationMs: 160,
        tokens: { input: 580, output: 140 },
        costUsd: 0.000085,
        details: {
          title: 'Path Redirected to services/checkout.py',
          description: 'Tracer intercepted 404, looked up repo directory index, and redirected agent to active module.',
          healingAction: 'Injected real file tree index and warned agent against deprecated v2 path.',
          outputPayload: { resolvedPath: 'services/checkout.py', status: 'healed' }
        }
      });
    }

    if (scenarioId === 'failure-healing' || scenarioId === 'Happy Path' || !scenarioId) {
      // STEP 3: Initial Patch Application (V1)
      spans.push({
        id: `span-3-${Date.now()}`,
        name: 'Patch Synthesizer (v1)',
        nodeType: 'tool_execution',
        status: 'success',
        startedAt: baseTime + 160,
        endedAt: baseTime + 410,
        durationMs: 250,
        tokens: { input: 780, output: 190 },
        costUsd: 0.000115,
        details: {
          title: 'Generated Patch v1 (Naive Tax Rule)',
          description: 'Formulated diff checking standard state codes with 7% default rate.',
          inputPayload: { strategy: 'conditional_lookup', defaultTaxRate: 0.07 }
        }
      });

      // STEP 4: Sandboxed PyTest Execution (THE NATURAL FAILURE)
      spans.push({
        id: `span-4-${Date.now()}`,
        name: 'Sandboxed PyTest Runner',
        nodeType: 'sandbox_test',
        status: 'error',
        startedAt: baseTime + 420,
        endedAt: baseTime + 610,
        durationMs: 190,
        tokens: { input: 320, output: 60 },
        costUsd: 0.000042,
        details: {
          title: '❌ PyTest Failed: 1 Assertion Error',
          description: 'Test `test_tax_exempt_states_or_de` failed with unexpected non-zero tax.',
          errorSignature: 'AssertionError: assert calculate_tax(100.0, "OR") == 0.00 (got 7.00)',
          inputPayload: { command: 'pytest tests/test_checkout.py -k test_tax' },
          outputPayload: { exitCode: 1, failedTests: ['test_tax_exempt_states_or_de'], passedTests: 12 }
        }
      });

      // STEP 5: Failure Interception & Reflection Prompt Injection
      spans.push({
        id: `span-5-${Date.now()}`,
        name: 'Tracer Fault Intercept & Reflection',
        nodeType: 'failure_interception',
        status: 'healed',
        startedAt: baseTime + 620,
        endedAt: baseTime + 910,
        durationMs: 290,
        tokens: { input: 890, output: 220 },
        costUsd: 0.000132,
        details: {
          title: 'Reflection Triggered on Failure Signature',
          description: 'Tracer intercepted `AssertionError`. Formulated reflection prompt targeting tax-exempt set `{"OR", "DE", "NH", "MT", "AK"}`.',
          healingAction: 'Injected AST context for exempt territory constants into prompt context.',
          outputPayload: { correctedStrategy: 'explicit_tax_exempt_whitelist', stateWhitelist: ['OR', 'DE', 'NH', 'MT', 'AK'] }
        }
      });

      // STEP 6: Re-run PyTest & Verification (GREEN)
      spans.push({
        id: `span-6-${Date.now()}`,
        name: 'Patch Verification (v2)',
        nodeType: 'patch_verification',
        status: 'success',
        startedAt: baseTime + 920,
        endedAt: baseTime + 1110,
        durationMs: 190,
        tokens: { input: 410, output: 40 },
        costUsd: 0.000042,
        details: {
          title: '✅ PyTest Suite 100% Green (14/14 Passed)',
          description: 'All unit and regression tests passed without errors.',
          inputPayload: { command: 'pytest tests/test_checkout.py -v' },
          outputPayload: { exitCode: 0, testsPassed: 14, duration: '0.18s' }
        }
      });
    }

    // FINAL STEP: Synthesis
    spans.push({
      id: `span-final-${Date.now()}`,
      name: 'Response Synthesizer',
      nodeType: 'response_synthesis',
      status: 'success',
      startedAt: baseTime + 1120,
      endedAt: baseTime + 1380,
      durationMs: 260,
      tokens: { input: 620, output: 180 },
      costUsd: 0.000100,
      details: {
        title: 'Response Generated for User',
        description: 'Delivered summary of AST patch and test verification output.',
        outputPayload: { status: 'COMPLETE_GREEN' }
      }
    });

    // Populate trace emitter
    traceEmitter.reset();
    spans.forEach(s => traceEmitter.addSpan(s));

    const assistantMsg: Message = {
      id: `msg-a-${Date.now()}`,
      role: 'assistant',
      content: scenarioId === 'long-context-25-turns'
        ? `✅ **25-Turn Engineering Context Verified**\n\nI have reviewed our full debugging history across all 25 turns. Thanks to the **4-Tier Context Compactor**, all constraints (tax-exempt whitelists, coupon precedence, and negative cart prevention) remain pinned in active memory while 84.2% of raw log boilerplate was safely pruned.`
        : `✅ **Bug Identified & Healed in \`services/checkout.py\`**\n\n1. **Root Cause:** Naive tax calculation applied the 7% default rate to all state codes, causing a regression in tax-exempt jurisdictions (\`OR\`, \`DE\`, \`NH\`, \`MT\`, \`AK\`).\n2. **Traced Failure:** First patch attempt failed \`test_tax_exempt_states_or_de\` (AssertionError: expected $0.00, got $7.00).\n3. **Self-Healing:** Map AI intercepted the failure span, reflected on the state exemptions, and applied **Patch v2**.\n4. **Verification:** All 14 PyTest unit tests are now **100% Green**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      turnIndex: turnIndex + 1,
      associatedTraceId: spans[0].id,
      codeDiff: {
        filename: 'services/checkout.py',
        oldCode: `def calculate_tax(subtotal: float, state_code: str) -> float:
    # BUG: Applies flat 7% tax to all states
    return round(subtotal * 0.07, 2)`,
        newCode: `TAX_EXEMPT_STATES = {"OR", "DE", "NH", "MT", "AK"}

def calculate_tax(subtotal: float, state_code: str) -> float:
    """Calculates tax with proper jurisdiction exemption handling."""
    if state_code.upper() in TAX_EXEMPT_STATES:
        return 0.0
    return round(subtotal * 0.07, 2)`
      },
      testOutput: {
        passed: true,
        testsRun: 14,
        testsFailed: 0,
        stdout: `============================= test session starts ==============================
rootdir: /app/ecommerce-core, configfile: pytest.ini
collected 14 items

tests/test_checkout.py::test_cart_total_basic PASSED                     [  7%]
tests/test_checkout.py::test_coupon_autumn26 PASSED                       [ 14%]
tests/test_checkout.py::test_tax_standard_ca PASSED                       [ 21%]
tests/test_checkout.py::test_tax_exempt_states_or_de PASSED              [ 28%]
tests/test_checkout.py::test_negative_cart_rejection PASSED               [ 35%]
tests/test_checkout.py::test_multi_item_discounts PASSED                  [100%]

============================== 14 passed in 0.18s ==============================`
      }
    };

    return {
      spans,
      messages: [...allMessages, assistantMsg],
      contextState,
      finalMessage: assistantMsg
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
