'use client';

import React, { useState } from 'react';
import { TraceSpan } from '@/lib/types';
import { traceEmitter } from '@/lib/trace-emitter';
import { Copy, Check, FileJson } from 'lucide-react';

interface TraceJsonViewerProps {
  spans: TraceSpan[];
}

export const TraceJsonViewer: React.FC<TraceJsonViewerProps> = ({ spans }) => {
  const [copied, setCopied] = useState(false);

  const otelJson = traceEmitter.exportOTelJson('session-current');
  const jsonString = JSON.stringify(otelJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <FileJson className="w-4 h-4 text-orange-400" />
            <span>OpenTelemetry JSON Export</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Compliant standard schema for external ingestion into Datadog, Jaeger, or Langfuse.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-black border border-neutral-800 max-h-[480px] overflow-auto font-mono text-[11px] text-neutral-300">
        <pre className="whitespace-pre">{jsonString}</pre>
      </div>
    </div>
  );
};
