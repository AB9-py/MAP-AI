'use client';

import React from 'react';
import { Sparkles, Download, RotateCcw, Cpu, DollarSign, Activity } from 'lucide-react';
import { TokenMetrics, LatencyBreakdown } from '@/lib/types';

interface HeaderProps {
  tokenMetrics: TokenMetrics;
  latencyMetrics: LatencyBreakdown;
  isRunning: boolean;
  onReset: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tokenMetrics,
  latencyMetrics,
  isRunning,
  onReset,
  onExport
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shrink-0">
      {/* Brand & Track */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white tracking-tight">Map AI</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full">
              Track 1: Glass Box
            </span>
          </div>
          <p className="text-xs text-neutral-400">Autonomous Coding & Observability Cockpit</p>
        </div>
      </div>

      {/* Live Telemetry Pills */}
      <div className="flex items-center gap-3 text-xs font-mono">
        {/* Model Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Gemini 1.5 Flash</span>
        </div>

        {/* Tokens & Savings */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {tokenMetrics.inputTokens + tokenMetrics.outputTokens} tok 
            <span className="text-emerald-400 ml-1 font-semibold">(-{tokenMetrics.compressionRatioPercent}%)</span>
          </span>
        </div>

        {/* Cost Meter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
          <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-yellow-300 font-semibold">${tokenMetrics.costUsd.toFixed(5)}</span>
        </div>

        {/* Latency */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400">
          <span>{latencyMetrics.totalMs} ms</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 transition-colors disabled:opacity-50"
          title="Reset session"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-colors"
          title="Download OpenTelemetry trace JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export OTel Trace</span>
        </button>
      </div>
    </header>
  );
};
