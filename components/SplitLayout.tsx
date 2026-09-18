'use client';

import React, { useState, useEffect } from 'react';
import { 
  Message, 
  TraceSpan, 
  ContextMemoryState, 
  TokenMetrics, 
  LatencyBreakdown, 
  DemoScenario 
} from '@/lib/types';
import { DEMO_SCENARIOS, INITIAL_CHAT_MESSAGES } from '@/lib/demo-scenarios';
import { Header } from './Header';
import { ScenarioSelector } from './ScenarioSelector';
import { ChatPanel } from './ChatPanel';
import { GlassBoxCockpit } from './GlassBoxCockpit';
import { TimeTravelModal } from './TimeTravelModal';

export const SplitLayout: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_CHAT_MESSAGES);
  const [spans, setSpans] = useState<TraceSpan[]>([]);
  const [contextState, setContextState] = useState<ContextMemoryState | null>(null);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics>({
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    rawUncompressedTokens: 0,
    savedTokens: 0,
    compressionRatioPercent: 0,
    costUsd: 0
  });
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyBreakdown>({
    contextCompactionMs: 0,
    llmInferenceMs: 0,
    sandboxExecutionMs: 0,
    totalMs: 0
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('failure-healing');
  const [selectedSpanForModal, setSelectedSpanForModal] = useState<TraceSpan | null>(null);

  // Auto-run default scenario on initial mount for instant live demo experience
  useEffect(() => {
    executeAgentRun('failure-healing');
  }, []);

  const executeAgentRun = async (scenarioId: string, customPrompt?: string) => {
    setIsRunning(true);
    setActiveScenarioId(scenarioId);

    try {
      const response = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          existingMessages: messages,
          customPrompt
        })
      });

      const data = await response.json();
      if (data.success) {
        setSpans(data.spans);
        setMessages(data.messages);
        setContextState(data.contextState);
        setTokenMetrics(data.tokenMetrics);
        setLatencyMetrics(data.latencyMetrics);
      }
    } catch (err) {
      console.error('Agent run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSelectScenario = (scenario: DemoScenario) => {
    executeAgentRun(scenario.id, scenario.prompt);
  };

  const handleSendMessage = (text: string) => {
    executeAgentRun('custom-run', text);
  };

  const handleReset = () => {
    setMessages(INITIAL_CHAT_MESSAGES);
    setSpans([]);
    setContextState(null);
    setTokenMetrics({
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      rawUncompressedTokens: 0,
      savedTokens: 0,
      compressionRatioPercent: 0,
      costUsd: 0
    });
    setLatencyMetrics({
      contextCompactionMs: 0,
      llmInferenceMs: 0,
      sandboxExecutionMs: 0,
      totalMs: 0
    });
  };

  const handleExport = () => {
    window.open('/api/trace/export', '_blank');
  };

  const handleForkRun = (span: TraceSpan) => {
    const forkPrompt = `[FORKED FROM STEP: ${span.name}] Re-evaluating logic with altered assumption: ${span.details.title}`;
    executeAgentRun('custom-fork', forkPrompt);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        tokenMetrics={tokenMetrics}
        latencyMetrics={latencyMetrics}
        isRunning={isRunning}
        onReset={handleReset}
        onExport={handleExport}
      />

      {/* 1-Click Scenario Bar */}
      <ScenarioSelector
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        isRunning={isRunning}
      />

      {/* 50/50 Split Screen Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Side: Developer Chat & Code Sandbox */}
        <ChatPanel
          messages={messages}
          isRunning={isRunning}
          onSendMessage={handleSendMessage}
        />

        {/* Right Side: Glass Box Observability Engine */}
        <GlassBoxCockpit
          spans={spans}
          contextState={contextState}
          tokenMetrics={tokenMetrics}
          latencyMetrics={latencyMetrics}
          isRunning={isRunning}
          onSelectSpan={(span) => setSelectedSpanForModal(span)}
        />
      </div>

      {/* Time Travel Replay Modal */}
      <TimeTravelModal
        span={selectedSpanForModal}
        onClose={() => setSelectedSpanForModal(null)}
        onForkRun={handleForkRun}
      />
    </div>
  );
};
