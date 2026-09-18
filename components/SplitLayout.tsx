'use client';

import React, { useState } from 'react';
import type { FailureEvent, Message, FileEntry, AnalysisStep, RunSummary } from '@/lib/types';
import { Header } from './Header';
import { OnboardingCard } from './OnboardingCard';
import { ChatPanel } from './ChatPanel';
import { DebugPanel } from './DebugPanel';

interface SessionInfo {
  id: string;
  name: string;
  source: 'upload' | 'github';
  file_count: number;
}

const WELCOME_MSG: Message = {
  id: 'welcome',
  role: 'system',
  content: 'Codebase loaded. Ask anything — find a bug, explain a function, trace a flow.',
  timestamp: '',
};

export const SplitLayout: React.FC = () => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastDiff, setLastDiff] = useState<Message['codeDiff'] | null>(null);
  const [lastSteps, setLastSteps] = useState<AnalysisStep[]>([]);
  const [failures, setFailures] = useState<FailureEvent[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [lastRunId, setLastRunId] = useState<string | undefined>();

  const refreshObservability = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/runs?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) return;
      const data = await res.json();
      setRuns((data.runs ?? []).map((run: {
        id: string;
        parent_run_id: string | null;
        fork_step_id: string | null;
        status: RunSummary['status'];
        prompt: string;
        estimated_cost_usd: number;
        started_at: string;
      }) => ({
        id: run.id,
        parentRunId: run.parent_run_id,
        forkedFromStepId: run.fork_step_id,
        status: (run.status as string) === 'failed' ? 'error' : run.status,
        prompt: run.prompt,
        totalCostUsd: run.estimated_cost_usd,
        createdAt: run.started_at,
      })));
      setFailures((data.failures ?? []).map((failure: {
        id: string;
        run_id: string;
        step_id: string | null;
        code: string;
        message: string;
        created_at: string;
        file_path?: string | null;
        line_number?: number | null;
        root_cause?: string | null;
        recovery?: string | null;
      }) => ({
        id: failure.id,
        runId: failure.run_id,
        stepId: failure.step_id ?? undefined,
        kind: failure.code === 'GEMINI_REQUEST_FAILED' ? 'retry' : 'failure',
        message: failure.message,
        createdAt: failure.created_at,
        filePath: failure.file_path ?? undefined,
        lineNumber: failure.line_number ?? undefined,
        rootCause: failure.root_cause ?? undefined,
        recovery: failure.recovery ?? undefined,
      })));
      if (!lastRunId && data.runs?.[0]?.id) setLastRunId(data.runs[0].id);
    } catch {
      // The analysis result remains usable when optional observability refresh fails.
    }
  };

  const handleSessionCreated = (sessionId: string, loadedFiles: FileEntry[]) => {
    // We need the session info — derive it from files response or re-fetch
    setSession({
      id: sessionId,
      name: 'Loading...',
      source: 'upload',
      file_count: loadedFiles.length,
    });
    // Immediately fetch full session details
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        const found = data.sessions?.find((s: SessionInfo) => s.id === sessionId);
        if (found) setSession(found);
      });
    setFiles(loadedFiles);
    setMessages([WELCOME_MSG]);
    setSelectedFile(null);
    setLastDiff(null);
    setLastSteps([]);
    setFailures([]);
    setRuns([]);
    setLastRunId(undefined);
    void refreshObservability(sessionId);
  };

  const handleNewSession = () => {
    setSession(null);
    setFiles([]);
    setMessages([]);
    setSelectedFile(null);
    setLastDiff(null);
    setLastSteps([]);
    setFailures([]);
    setRuns([]);
    setLastRunId(undefined);
  };

  const handleSendMessage = async (text: string) => {
    if (!session || isRunning) return;

    const userMsg: Message = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsRunning(true);

    try {
      const res = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          userPrompt: text,
          focusFile: selectedFile,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg: Message = {
          id: `msg-a-${Date.now()}`,
          role: 'assistant',
          content: data.explanation ?? 'Analysis complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          codeDiff: data.suggestedDiff ?? undefined,
          affectedFiles: data.affectedFiles ?? [],
          steps: data.steps ?? [],
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (data.suggestedDiff) setLastDiff(data.suggestedDiff);
        if (data.steps?.length) setLastSteps(data.steps);
        setLastRunId(data.runId);
        void refreshObservability(session.id);
      } else {
        if (data.steps?.length) setLastSteps(data.steps);
        if (data.runId) {
          setLastRunId(data.runId);
          void refreshObservability(session.id);
        }
        setMessages(prev => [...prev, {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: ${data.error ?? 'Analysis failed. Please try again.'}${data.detail ? `\n\n${data.detail}` : ''}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          steps: data.steps ?? [],
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Network error. Please check your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const restartRun = async (runId?: string) => {
    if (!session || isRunning) return;
    setIsRunning(true);
    try {
      const res = await fetch('/api/runs/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: runId ?? lastRunId }),
      });
      const data = await res.json();
      if (data.success) {
        setLastSteps(data.steps ?? []);
        if (data.explanation) {
          setMessages(prev => [...prev, {
            id: `msg-restart-${Date.now()}`,
            role: 'assistant',
            content: data.explanation,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            steps: data.steps ?? [],
          }]);
        }
      }
      await refreshObservability(session.id);
    } finally {
      setIsRunning(false);
    }
  };

  const forkFromStep = async (stepId: string) => {
    if (!session || isRunning) return;
    try {
      const res = await fetch('/api/runs/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: lastRunId, stepId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: `msg-fork-${Date.now()}`,
          role: 'system',
          content: `Fork created from step ${stepId.slice(0, 8)}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        await refreshObservability(session.id);
      }
    } catch {
      // Fork controls are best-effort and never interrupt the active session.
    }
  };

  const applyPatch = async () => {
    if (!session || !lastDiff) return;
    const response = await fetch('/api/patch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, ...lastDiff }),
    });
    const data = await response.json();
    setMessages(prev => [...prev, {
      id: `msg-patch-${Date.now()}`,
      role: 'system',
      content: data.success ? `Applied patch to ${lastDiff.filePath} in the session snapshot.` : `Patch rejected: ${data.error}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden">
      <Header
        sessionName={session?.name ?? null}
        source={session?.source ?? null}
        fileCount={session?.file_count}
        onNewSession={handleNewSession}
      />

      {!session ? (
        <div className="flex-1 min-h-0">
          <OnboardingCard onSessionCreated={handleSessionCreated} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          <ChatPanel
            messages={messages}
            isRunning={isRunning}
            selectedFile={selectedFile}
            onSendMessage={handleSendMessage}
          />
          <DebugPanel
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            sessionId={session.id}
            lastDiff={lastDiff}
            lastSteps={lastSteps}
            failures={failures}
            runs={runs}
            onRestart={restartRun}
            onFork={forkFromStep}
            onApplyPatch={applyPatch}
          />
        </div>
      )}
    </div>
  );
};
