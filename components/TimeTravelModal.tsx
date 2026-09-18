'use client';

import React from 'react';
import { TraceSpan } from '@/lib/types';
import { X, GitFork, Clock, Cpu, DollarSign, Layers } from 'lucide-react';

interface TimeTravelModalProps {
  span: TraceSpan | null;
  onClose: () => void;
  onForkRun: (span: TraceSpan) => void;
}

export const TimeTravelModal: React.FC<TimeTravelModalProps> = ({
  span,
  onClose,
  onForkRun
}) => {
  if (!span) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-600/20 border border-orange-500/40 text-orange-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Time-Travel Span Inspector: {span.name}
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                Span ID: {span.id} · Type: {span.nodeType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px]">Execution Latency</span>
              <span className="text-white font-semibold">{span.durationMs} ms</span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px]">Tokens (In / Out)</span>
              <span className="text-emerald-400 font-semibold">{span.tokens.input} / {span.tokens.output}</span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px]">Micro Cost</span>
              <span className="text-yellow-400 font-semibold">${span.costUsd.toFixed(6)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-neutral-300">Step Objective</h4>
            <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              {span.details.description}
            </p>
          </div>

          {/* Input Payload */}
          {span.details.inputPayload && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-neutral-300 font-mono">Input Context Payload:</h4>
              <div className="p-3 rounded-lg bg-black border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto">
                <pre className="whitespace-pre">
                  {typeof span.details.inputPayload === 'object'
                    ? JSON.stringify(span.details.inputPayload, null, 2)
                    : span.details.inputPayload}
                </pre>
              </div>
            </div>
          )}

          {/* Output Payload */}
          {span.details.outputPayload && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-neutral-300 font-mono">Output Result Payload:</h4>
              <div className="p-3 rounded-lg bg-black border border-neutral-800 font-mono text-[11px] text-emerald-300/90 overflow-x-auto">
                <pre className="whitespace-pre">
                  {typeof span.details.outputPayload === 'object'
                    ? JSON.stringify(span.details.outputPayload, null, 2)
                    : span.details.outputPayload}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Immutable snapshot captured at step completion.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onForkRun(span);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork & Replay From Here</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
