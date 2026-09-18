'use client';

import React from 'react';
import { Zap, RotateCcw, GitBranch, Upload } from 'lucide-react';

interface HeaderProps {
  sessionName: string | null;
  source?: 'upload' | 'github' | null;
  fileCount?: number;
  onNewSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sessionName,
  source,
  fileCount,
  onNewSession,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm px-5 py-2.5 flex items-center justify-between gap-4 shrink-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
          <Zap className="w-4 h-4 text-orange-400" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Map AI</span>
      </div>

      {/* Session info */}
      {sessionName && (
        <div className="flex items-center gap-2 min-w-0">
          {source === 'github' ? (
            <GitBranch className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          ) : source === 'upload' ? (
            <Upload className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          ) : null}
          <span className="text-sm text-neutral-300 font-mono truncate">{sessionName}</span>
          {fileCount != null && (
            <span className="text-[11px] text-neutral-600 shrink-0">{fileCount} files</span>
          )}
        </div>
      )}

      {/* Actions */}
      <button
        onClick={onNewSession}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 transition-colors shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        New Session
      </button>
    </header>
  );
};
