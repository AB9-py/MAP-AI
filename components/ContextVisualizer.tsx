'use client';

import React from 'react';
import { ContextMemoryState } from '@/lib/types';
import { Layers, Database, FileText, Scissors, TrendingDown, Check } from 'lucide-react';

interface ContextVisualizerProps {
  contextState: ContextMemoryState | null;
}

export const ContextVisualizer: React.FC<ContextVisualizerProps> = ({ contextState }) => {
  if (!contextState) {
    return (
      <div className="p-8 text-center text-neutral-400 font-mono text-xs">
        No active context memory state.
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* Top Banner: Compression Ratio */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>4-Tier Memory Compactor</span>
          </div>
          <h4 className="text-lg font-bold text-white tracking-tight">
            {contextState.compressionRatio}% Token Reduction
          </h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Preserves 100% engineering precision across long conversations.
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <div className="text-neutral-400 line-through">
            {contextState.rawEquivalentTokens} raw tokens
          </div>
          <div className="text-emerald-400 font-bold text-base">
            {contextState.totalCompactedTokens} tokens
          </div>
        </div>
      </div>

      {/* Layer Stack */}
      <div className="space-y-3">
        {/* Tier 1: Active Buffer */}
        <div className="p-3.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-white">
                Tier 1: Active Focus Buffer (Last {contextState.activeBufferTurns} Turns)
              </span>
            </div>
            <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              {contextState.activeBufferTokens} tokens (100% Fidelity)
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Preserves raw code diffs, prompts, and PyTest terminal execution logs without compression.
          </p>
        </div>

        {/* Tier 2: Entity Store */}
        <div className="p-3.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">
                Tier 2: Semantic Entity Store ({contextState.entityStore.length} Pinned Facts)
              </span>
            </div>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {contextState.entityTokens} tokens
            </span>
          </div>
          <div className="space-y-1.5 mt-2">
            {contextState.entityStore.map((entity, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[11px] font-mono p-2 rounded bg-neutral-950 border border-neutral-850"
              >
                <span className="text-neutral-400 font-semibold">{entity.key}:</span>
                <span className="text-neutral-200 truncate max-w-[280px]">{entity.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 3: Episodic Summaries */}
        <div className="p-3.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-white">
                Tier 3: Episodic Summaries (Recursive Chunks)
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {contextState.summaryTokens} tokens (Saved ~84%)
            </span>
          </div>
          {contextState.episodicSummaries.length > 0 ? (
            <div className="space-y-1.5">
              {contextState.episodicSummaries.map((summary, idx) => (
                <div key={idx} className="p-2.5 rounded bg-neutral-950 border border-neutral-850 text-[11px] text-neutral-300">
                  <span className="font-mono font-semibold text-amber-400 mr-2">[{summary.turnRange}]:</span>
                  {summary.summary}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500 italic">No older turns compacted yet.</p>
          )}
        </div>

        {/* Tier 4: Noise Eviction */}
        <div className="p-3.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-white">
                Tier 4: Pruned Noise & Evicted Tokens
              </span>
            </div>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              -{contextState.prunedTokens} tokens pruned
            </span>
          </div>
          <ul className="space-y-1 text-[11px] text-neutral-400">
            {contextState.prunedNoiseItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 font-mono line-through opacity-75">
                <span className="text-rose-400">✕</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
