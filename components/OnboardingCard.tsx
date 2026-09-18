'use client';

import React, { useState, useRef } from 'react';
import { Upload, GitBranch, Loader2, FolderOpen, ArrowRight, Zap } from 'lucide-react';

interface OnboardingCardProps {
  onSessionCreated: (sessionId: string, files: FileEntryLite[]) => void;
}

interface FileEntryLite {
  id: string;
  path: string;
  language: string;
  size_bytes: number;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({ onSessionCreated }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState<'github' | 'upload' | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setLoading('github');
    setError('');
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: githubUrl.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Could not load the repository (HTTP ${res.status}).`);
      }
      onSessionCreated(data.sessionId, data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repo');
    } finally {
      setLoading(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading('upload');
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', file.name.replace(/\.zip$/, ''));
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Could not upload the codebase (HTTP ${res.status}).`);
      }
      onSessionCreated(data.sessionId, data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const EXAMPLE_REPOS = [
    { label: 'pallets/flask', url: 'https://github.com/pallets/flask' },
    { label: 'fastapi/fastapi', url: 'https://github.com/tiangolo/fastapi' },
    { label: 'expressjs/express', url: 'https://github.com/expressjs/express' },
  ];

  return (
    <div className="flex items-center justify-center h-full w-full bg-neutral-950 p-6">
      <div className="w-full max-w-lg space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Map AI</h1>
          </div>
          <p className="text-sm text-neutral-400">Load a codebase. Ask anything. Get real answers.</p>
        </div>

        {/* GitHub URL */}
        <div className="space-y-2">
          <form onSubmit={handleGitHub} className="flex gap-2">
            <div className="relative flex-1">
              <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                disabled={!!loading}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!!loading || !githubUrl.trim()}
              className="px-4 py-2.5 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {loading === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Load
            </button>
          </form>

          {/* Quick examples */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-neutral-500">Try:</span>
            {EXAMPLE_REPOS.map(r => (
              <button
                key={r.url}
                onClick={() => setGithubUrl(r.url)}
                className="text-[11px] text-orange-400/70 hover:text-orange-400 font-mono transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-neutral-600 text-xs">
          <div className="flex-1 h-px bg-neutral-800" />
          <span>or upload a zip</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-orange-500 bg-orange-500/5'
              : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/30 hover:bg-neutral-900/50'
          }`}
        >
          {loading === 'upload' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
              <p className="text-sm text-neutral-400">Parsing files...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-neutral-500" />
              <p className="text-sm text-neutral-300">Drop a <span className="font-mono">.zip</span> file here</p>
              <p className="text-xs text-neutral-500">or click to browse</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.py,.ts,.js,.go,.rs,.java,.rb"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 text-center bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
