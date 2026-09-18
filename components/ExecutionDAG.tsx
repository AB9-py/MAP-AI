'use client';

import React from 'react';
import { TraceSpan } from '@/lib/types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Clock, 
  Layers, 
  Search, 
  Wrench, 
  Cpu, 
  Play
} from 'lucide-react';

interface ExecutionDAGProps {
  spans: TraceSpan[];
  isRunning: boolean;
  onSelectSpan: (span: TraceSpan) => void;
}

export const ExecutionDAG: React.FC<ExecutionDAGProps> = ({
  spans,
  isRunning,
  onSelectSpan
}) => {
  const getNodeIcon = (nodeType: TraceSpan['nodeType'], status: TraceSpan['status']) => {
    if (status === 'healed') return <RefreshCw className="w-4 h-4 text-blue-400" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-rose-400" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />;

    switch (nodeType) {
      case 'context_compaction':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'ast_analysis':
        return <Search className="w-4 h-4 text-indigo-400" />;
      case 'tool_execution':
        return <Wrench className="w-4 h-4 text-cyan-400" />;
      case 'sandbox_test':
        return <Play className="w-4 h-4 text-emerald-400" />;
      case 'failure_interception':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'self_healing':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'patch_verification':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Cpu className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusBadge = (status: TraceSpan['status']) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">PASS</span>;
      case 'error':
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">FAIL (CAUGHT)</span>;
      case 'healed':
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">SELF-HEALED</span>;
      case 'running':
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">RUNNING</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-800 text-neutral-400">IDLE</span>;
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">Execution Graph (DAG)</h3>
          <p className="text-xs text-neutral-400">Click any step to inspect raw payloads & time-travel replay</p>
        </div>
        <div className="text-xs font-mono text-neutral-400">
          Total Spans: <span className="text-white font-semibold">{spans.length}</span>
        </div>
      </div>

      {spans.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
          <Layers className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs text-neutral-400 font-mono">No active trace. Run a scenario to stream the DAG.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-800">
          {spans.map((span, idx) => {
            const isError = span.status === 'error';
            const isHealed = span.status === 'healed';

            return (
              <div
                key={span.id}
                onClick={() => onSelectSpan(span)}
                className={`group relative p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isError
                    ? 'bg-rose-950/20 border-rose-800/60 hover:bg-rose-950/30 hover:border-rose-600'
                    : isHealed
                    ? 'bg-blue-950/20 border-blue-800/60 hover:bg-blue-950/30 hover:border-blue-600'
                    : 'bg-neutral-900/80 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                {/* Node Dot on vertical connector */}
                <div
                  className={`absolute -left-[27px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isError
                      ? 'bg-rose-950 border-rose-500'
                      : isHealed
                      ? 'bg-blue-950 border-blue-400'
                      : 'bg-neutral-950 border-neutral-600 group-hover:border-orange-500'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-rose-400' : isHealed ? 'bg-blue-300' : 'bg-neutral-400'}`} />
                </div>

                {/* Step Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-neutral-800/80 border border-neutral-700">
                      {getNodeIcon(span.nodeType, span.status)}
                    </div>
                    <span className="text-xs font-mono font-medium text-white">
                      Step {idx + 1}: {span.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(span.status)}
                  </div>
                </div>

                {/* Step Details */}
                <p className="text-xs text-neutral-300 mb-2 leading-relaxed">
                  {span.details.title}
                </p>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans line-clamp-2">
                  {span.details.description}
                </p>

                {/* Micro Telemetry Footer */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      {span.durationMs}ms
                    </span>
                    <span>
                      {span.tokens.input + span.tokens.output} tok ({span.tokens.input}in / {span.tokens.output}out)
                    </span>
                  </div>
                  <span className="text-yellow-400/90 font-medium">
                    ${span.costUsd.toFixed(6)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
