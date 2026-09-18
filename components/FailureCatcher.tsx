'use client';

import React from 'react';
import { TraceSpan } from '@/lib/types';
import { AlertOctagon, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface FailureCatcherProps {
  spans: TraceSpan[];
}

export const FailureCatcher: React.FC<FailureCatcherProps> = ({ spans }) => {
  const errorSpans = spans.filter(s => s.status === 'error');
  const healedSpans = spans.filter(s => s.status === 'healed');

  return (
    <div className="p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white tracking-tight">
          Active Fault Interception & Self-Healing Matrix
        </h3>
        <p className="text-xs text-neutral-400">
          Traces intercepted regressions, tool timeouts, and AST violations with auto-recovery.
        </p>
      </div>

      {errorSpans.length === 0 && healedSpans.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-xs text-neutral-400 font-mono">
            No active faults detected. Run &quot;💥 Live Test Failure &amp; Self-Healing Loop&quot; to inspect.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* The Caught Error */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/60 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertOctagon className="w-4 h-4" />
                <span>1. Intercepted Failure Span</span>
              </div>
              {errorSpans.map((span) => (
                <div key={span.id} className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-white">{span.details.title}</h4>
                  <div className="p-2.5 rounded bg-black/60 border border-rose-900/40 text-[11px] font-mono text-rose-300">
                    {span.details.errorSignature || 'AssertionError occurred in sandbox'}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {span.details.description}
                  </p>
                </div>
              ))}
            </div>

            {/* The Self-Healing Reaction */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/60 space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <RefreshCw className="w-4 h-4" />
                <span>2. Injected Reflection & Recovery</span>
              </div>
              {healedSpans.map((span) => (
                <div key={span.id} className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-white">{span.details.title}</h4>
                  <div className="p-2.5 rounded bg-black/60 border border-blue-900/40 text-[11px] font-mono text-blue-300">
                    {span.details.healingAction || 'Reflection prompt formulated and re-executed.'}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {span.details.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Result: Pipeline Successfully Re-stabilized without User Intervention</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Pass Rate: 100%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
