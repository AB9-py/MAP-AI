'use client';

import React, { useState } from 'react';
import type { Message, FileEntry, AnalysisStep } from '@/lib/types';
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
  };

  const handleNewSession = () => {
    setSession(null);
    setFiles([]);
    setMessages([]);
    setSelectedFile(null);
    setLastDiff(null);
    setLastSteps([]);
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
      } else {
        setMessages(prev => [...prev, {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: ${data.error ?? 'Analysis failed. Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      }
    } catch (err) {
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
          />
        </div>
      )}
    </div>
  );
};
