'use client';

import React from 'react';
import { TokenMetrics, LatencyBreakdown } from '@/lib/types';
import { DollarSign, Clock, Zap, TrendingDown, Cpu, Shield } from 'lucide-react';

interface TelemetryDashboardProps {
  tokenMetrics: TokenMetrics;
  latencyMetrics: LatencyBreakdown;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  tokenMetrics,
  latencyMetrics
}) => {
  return (
    <div className="p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white tracking-tight">
          Live Telemetry & Economics
        </h3>
        <p className="text-xs text-neutral-400">
          Sub-cent micro-costing, token economics, and execution latency profiling.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
            <span>Session Cost</span>
          </div>
          <div className="text-base font-bold text-yellow-300">
            ${tokenMetrics.costUsd.toFixed(5)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Gemini 1.5 Flash Pricing
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Token Savings</span>
          </div>
          <div className="text-base font-bold text-emerald-400">
            {tokenMetrics.compressionRatioPercent}%
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Saved {tokenMetrics.savedTokens} tokens
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mb-1">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Prompt Tokens</span>
          </div>
          <div className="text-base font-bold text-white">
            {tokenMetrics.inputTokens}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Completion: {tokenMetrics.outputTokens} tok
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Latency</span>
          </div>
          <div className="text-base font-bold text-white">
            {latencyMetrics.totalMs} ms
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Sub-second execution
          </div>
        </div>
      </div>

      {/* Latency Waterfall Breakdown */}
      <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <h4 className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span>Execution Latency Waterfall</span>
        </h4>

        <div className="space-y-2 text-xs font-mono">
          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Context Compactor</span>
              <span className="text-purple-400">{latencyMetrics.contextCompactionMs} ms</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full" 
                style={{ width: `${Math.min(100, (latencyMetrics.contextCompactionMs / Math.max(1, latencyMetrics.totalMs)) * 100)}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Gemini 1.5 Flash Inference</span>
              <span className="text-blue-400">{latencyMetrics.llmInferenceMs} ms</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.min(100, (latencyMetrics.llmInferenceMs / Math.max(1, latencyMetrics.totalMs)) * 100)}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Sandboxed PyTest Execution</span>
              <span className="text-emerald-400">{latencyMetrics.sandboxExecutionMs} ms</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${Math.min(100, (latencyMetrics.sandboxExecutionMs / Math.max(1, latencyMetrics.totalMs)) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
