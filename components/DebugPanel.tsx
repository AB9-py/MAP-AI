'use client';

import React, { useState, useEffect } from 'react';
import { FileExplorer } from './FileExplorer';
import { CheckCircle2, XCircle, AlertTriangle, Zap, FileCode, ChevronRight, RotateCcw, GitFork, ShieldAlert } from 'lucide-react';
import type { AnalysisStep, FailureEvent, FileEntry, RunSummary } from '@/lib/types';

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
  failures?: FailureEvent[];
  runs?: RunSummary[];
  onRestart?: (runId?: string) => void;
  onFork?: (stepId: string) => void;
  onApplyPatch?: () => void;
}

type Tab = 'files' | 'trace' | 'failures' | 'forks';

function FileViewer({ sessionId, filePath }: { sessionId: string; filePath: string }) {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !filePath) return;
    // The selected path changes infrequently; clear stale content before loading its replacement.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(null);
    fetch(`/api/file?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(filePath)}`)
      .then(r => r.json())
      .then(d => setContent(d.content ?? null))
      .catch(() => setContent(null));
  }, [sessionId, filePath]);

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

function TabButton({ id, label, active, onSelect }: { id: Tab; label: string; active: boolean; onSelect: (id: Tab) => void }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
          : 'text-neutral-500 hover:text-neutral-300'
      }`}
    >
      {label}
    </button>
  );
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  files,
  selectedFile,
  onSelectFile,
  sessionId,
  lastDiff,
  lastSteps,
  failures = [],
  runs = [],
  onRestart,
  onFork,
  onApplyPatch,
}) => {
  const [tab, setTab] = useState<Tab>('files');
  const [viewMode, setViewMode] = useState<'tree' | 'file'>('tree');

  const handleSelectFile = (path: string) => {
    onSelectFile(path);
    setViewMode('file');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-950 border-l border-neutral-800/60 overflow-hidden">
      {/* Tab bar */}
      <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center gap-1.5 shrink-0">
        <TabButton id="files" label="Files" active={tab === 'files'} onSelect={setTab} />
        <TabButton id="trace" label="Trace" active={tab === 'trace'} onSelect={setTab} />
        <TabButton id="failures" label="Failure Catcher" active={tab === 'failures'} onSelect={setTab} />
        <TabButton id="forks" label="Forks" active={tab === 'forks'} onSelect={setTab} />
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
          {lastSteps && lastSteps.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-medium">Run cost</p>
                <p className="text-xs text-neutral-300 font-mono">
                  ${lastSteps.reduce((sum, step) => sum + (step.apiCostUsd ?? 0), 0).toFixed(6)} estimated API · local steps $0
                </p>
              </div>
              {onRestart && (
                <button onClick={() => onRestart()} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-2 py-1 text-[10px] text-neutral-300 hover:bg-neutral-800">
                  <RotateCcw className="h-3 w-3" /> Restart
                </button>
              )}
              {lastDiff && onApplyPatch && (
                <button onClick={onApplyPatch} className="rounded-md border border-orange-700/60 px-2 py-1 text-[10px] text-orange-300 hover:bg-orange-950/30">
                  Apply patch to snapshot
                </button>
              )}
            </div>
          )}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-medium">Memory tiers</p>
            <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[9px] text-neutral-500">
              <span className="rounded bg-neutral-800 px-1 py-1">session</span>
              <span className="rounded bg-neutral-800 px-1 py-1">files</span>
              <span className="rounded bg-neutral-800 px-1 py-1">trace</span>
              <span className="rounded bg-neutral-800 px-1 py-1">failures</span>
            </div>
          </div>
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
              {lastSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/60">
                  <StepIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-neutral-200 font-medium">{step.name}</span>
                      <span className="text-[10px] text-neutral-600 font-mono shrink-0">{step.durationMs}ms</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{step.description}</p>
                    <p className="text-[10px] text-neutral-600 mt-1 font-mono">
                      {step.kind === 'local' ? 'local · $0.000000' : `${step.kind ?? 'analysis'} · $${(step.apiCostUsd ?? 0).toFixed(6)}`}
                    </p>
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

      {tab === 'failures' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          {failures.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-600">
              <ShieldAlert className="mx-auto mb-2 h-5 w-5 text-emerald-500/70" />
              No failures, retries, or fallbacks recorded.
            </div>
          ) : failures.map((failure) => (
            <div key={failure.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <div className="flex items-center gap-2">
                {failure.kind === 'failure' ? <XCircle className="h-3.5 w-3.5 text-red-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />}
                <span className="text-xs text-neutral-200 capitalize">{failure.kind}</span>
                {failure.resolved && <span className="ml-auto text-[10px] text-emerald-400">resolved</span>}
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-400">{failure.message}</p>
              {(failure.filePath || failure.lineNumber || failure.rootCause || failure.recovery) && (
                <div className="mt-2 space-y-1 text-[10px] text-neutral-500">
                  {failure.filePath && <p>Location: <span className="font-mono text-neutral-300">{failure.filePath}{failure.lineNumber ? `:${failure.lineNumber}` : ''}</span></p>}
                  {failure.rootCause && <p>Root cause: {failure.rootCause}</p>}
                  {failure.recovery && <p>Recovery: {failure.recovery}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'forks' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-[11px] text-neutral-500">
            Forks preserve the original run. Start a new immutable lineage from any completed trace step.
          </div>
          {runs.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-600">No runs yet.</p>
          ) : runs.map((run) => (
            <div key={run.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <div className="flex items-center gap-2">
                <GitFork className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-neutral-200 font-mono">{run.id.slice(0, 8)}</span>
                <span className="ml-auto text-[10px] text-neutral-500">{run.status}</span>
              </div>
              <p className="mt-1 text-[10px] text-neutral-600">
                {run.parentRunId ? `child of ${run.parentRunId.slice(0, 8)}` : 'root run'}
                {run.totalCostUsd != null ? ` · $${run.totalCostUsd.toFixed(6)}` : ''}
              </p>
              {onFork && lastSteps?.filter(step => step.id).map(step => (
                <button key={`${run.id}-${step.id}`} onClick={() => onFork(step.id)} className="mt-2 mr-1 inline-flex items-center gap-1 rounded border border-neutral-700 px-2 py-1 text-[10px] text-neutral-400 hover:bg-neutral-800">
                  <GitFork className="h-3 w-3" /> Fork from {step.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
