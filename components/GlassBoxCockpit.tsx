'use client';

import React, { useState } from 'react';
import { TraceSpan, ContextMemoryState, TokenMetrics, LatencyBreakdown } from '@/lib/types';
import { ExecutionDAG } from './ExecutionDAG';
import { ContextVisualizer } from './ContextVisualizer';
import { FailureCatcher } from './FailureCatcher';
import { TelemetryDashboard } from './TelemetryDashboard';
import { TraceJsonViewer } from './TraceJsonViewer';
import { Layers, Activity, AlertTriangle, FileJson, Gauge } from 'lucide-react';

interface GlassBoxCockpitProps {
  spans: TraceSpan[];
  contextState: ContextMemoryState | null;
  tokenMetrics: TokenMetrics;
  latencyMetrics: LatencyBreakdown;
  isRunning: boolean;
  onSelectSpan: (span: TraceSpan) => void;
}

type TabType = 'dag' | 'context' | 'failures' | 'telemetry' | 'json';

export const GlassBoxCockpit: React.FC<GlassBoxCockpitProps> = ({
  spans,
  contextState,
  tokenMetrics,
  latencyMetrics,
  isRunning,
  onSelectSpan
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dag');

  const errorCount = spans.filter(s => s.status === 'error').length;
  const healedCount = spans.filter(s => s.status === 'healed').length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-950 overflow-hidden">
      {/* Cockpit Tab Navigation Bar */}
      <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('dag')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'dag'
                ? 'bg-neutral-800 text-orange-400 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Execution DAG</span>
          </button>

          <button
            onClick={() => setActiveTab('context')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'context'
                ? 'bg-neutral-800 text-purple-400 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4-Tier Memory</span>
            {contextState && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 ml-1">
                {contextState.compressionRatio}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('failures')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'failures'
                ? 'bg-neutral-800 text-rose-400 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Failure Catcher</span>
            {errorCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 ml-1">
                {errorCount}
              </span>
            )}
            {healedCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 ml-1">
                {healedCount} healed
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'telemetry'
                ? 'bg-neutral-800 text-yellow-400 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Telemetry &amp; Cost</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'json'
                ? 'bg-neutral-800 text-blue-400 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>OTel JSON</span>
          </button>
        </div>
      </div>

      {/* Cockpit Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'dag' && (
          <ExecutionDAG spans={spans} isRunning={isRunning} onSelectSpan={onSelectSpan} />
        )}
        {activeTab === 'context' && (
          <ContextVisualizer contextState={contextState} />
        )}
        {activeTab === 'failures' && (
          <FailureCatcher spans={spans} />
        )}
        {activeTab === 'telemetry' && (
          <TelemetryDashboard tokenMetrics={tokenMetrics} latencyMetrics={latencyMetrics} />
        )}
        {activeTab === 'json' && (
          <TraceJsonViewer spans={spans} />
        )}
      </div>
    </div>
  );
};
