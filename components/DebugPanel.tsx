'use client';

import React, { useState, useEffect } from 'react';
import { FileExplorer } from './FileExplorer';
import { CheckCircle2, XCircle, AlertTriangle, Zap, FileCode, ChevronRight } from 'lucide-react';
import type { AnalysisStep, FileEntry } from '@/lib/types';

interface DebugPanelProps {
  files: FileEntry[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  sessionId: string | null;
  lastDiff?: {
    filePath: string;
    oldCode: string;
    newCode: string;
    description: string;
  } | null;
  lastSteps?: AnalysisStep[];
}

type Tab = 'files' | 'trace';

function FileViewer({ sessionId, filePath }: { sessionId: string; filePath: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId || !filePath) return;
    setLoading(true);
    fetch(`/api/file?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(filePath)}`)
      .then(r => r.json())
      .then(d => setContent(d.content ?? null))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [sessionId, filePath]);

  if (loading) return <div className="p-4 text-xs text-neutral-500 font-mono animate-pulse">Loading...</div>;
  if (!content) return <div className="p-4 text-xs text-neutral-600">Could not load file.</div>;

  return (
    <pre className="p-4 text-[11px] font-mono text-neutral-300 whitespace-pre overflow-auto leading-relaxed">
      {content}
    </pre>
  );
}

function StepIcon({ status }: { status: AnalysisStep['status'] }) {
  if (status === 'error') return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
  if (status === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
  if (status === 'healed') return <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  files,
  selectedFile,
  onSelectFile,
  sessionId,
  lastDiff,
  lastSteps,
}) => {
  const [tab, setTab] = useState<Tab>('files');
  const [viewMode, setViewMode] = useState<'tree' | 'file'>('tree');

  const handleSelectFile = (path: string) => {
    onSelectFile(path);
    setViewMode('file');
  };

  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        tab === id
          ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
          : 'text-neutral-500 hover:text-neutral-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-950 border-l border-neutral-800/60 overflow-hidden">
      {/* Tab bar */}
      <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center gap-1.5 shrink-0">
        <TabBtn id="files" label="Files" />
        <TabBtn id="trace" label="Trace" />
      </div>

      {/* Files tab */}
      {tab === 'files' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Back button when viewing file */}
          {viewMode === 'file' && selectedFile && (
            <div className="px-3 py-1.5 border-b border-neutral-800 flex items-center gap-1 text-xs text-neutral-400 shrink-0">
              <button
                onClick={() => setViewMode('tree')}
                className="hover:text-neutral-200 transition-colors"
              >
                Files
              </button>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
              <span className="text-neutral-300 font-mono truncate">{selectedFile.split('/').pop()}</span>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-auto">
            {viewMode === 'tree' || !selectedFile ? (
              <FileExplorer files={files} selectedFile={selectedFile} onSelectFile={handleSelectFile} />
            ) : (
              sessionId && <FileViewer sessionId={sessionId} filePath={selectedFile} />
            )}
          </div>
        </div>
      )}

      {/* Trace tab */}
      {tab === 'trace' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {/* Last diff */}
          {lastDiff && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 overflow-hidden">
              <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-neutral-300 font-mono">{lastDiff.filePath}</span>
              </div>
              <div className="p-3 space-y-2 font-mono text-[11px]">
                <div className="text-red-400/90 bg-red-950/20 rounded p-2 border border-red-900/30">
                  <div className="text-[10px] text-red-500 uppercase font-bold mb-1">Before</div>
                  <pre className="whitespace-pre-wrap">{lastDiff.oldCode}</pre>
                </div>
                <div className="text-emerald-400/90 bg-emerald-950/20 rounded p-2 border border-emerald-900/30">
                  <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">After</div>
                  <pre className="whitespace-pre-wrap">{lastDiff.newCode}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Steps */}
          {lastSteps && lastSteps.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-2">Analysis Steps</p>
              {lastSteps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/60">
                  <StepIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-neutral-200 font-medium">{step.name}</span>
                      <span className="text-[10px] text-neutral-600 font-mono shrink-0">{step.durationMs}ms</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !lastDiff && (
              <p className="text-xs text-neutral-600 text-center py-8">
                Ask a question to see the analysis trace here.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
};
