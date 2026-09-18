'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Message, AnalysisStep } from '@/lib/types';
import { Send, Bot, User, FileCode, CheckCircle2, Loader2 } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  isRunning: boolean;
  selectedFile: string | null;
  onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isRunning,
  selectedFile,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRunning]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isRunning) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const placeholder = selectedFile
    ? `Ask about ${selectedFile.split('/').pop()}...`
    : 'Ask anything about the codebase...';

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-950 border-r border-neutral-800/60 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="text-[11px] text-neutral-600 text-center font-mono py-2">
                {msg.content}
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-orange-400" />
                </div>
              )}

              <div className={`max-w-[88%] rounded-xl p-3.5 text-sm ${
                isUser
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700/60'
                  : 'bg-neutral-900 text-neutral-200 border border-neutral-800'
              }`}>
                <div className="text-[11px] text-neutral-500 font-mono mb-1.5">
                  {isUser ? 'You' : 'Map AI'} · {msg.timestamp}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs">{msg.content}</div>

                {/* Affected files pills */}
                {msg.affectedFiles && msg.affectedFiles.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {msg.affectedFiles.map(f => (
                      <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {f.split('/').pop()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Code diff */}
                {msg.codeDiff && (
                  <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden font-mono text-[11px]">
                    <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2 text-neutral-300">
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      <span>{msg.codeDiff.filePath}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="text-red-400 bg-red-950/20 p-2 rounded border border-red-900/30">
                        <div className="text-[10px] text-red-500 font-bold mb-1 uppercase">Before</div>
                        <pre className="whitespace-pre-wrap">{msg.codeDiff.oldCode}</pre>
                      </div>
                      <div className="text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                        <div className="text-[10px] text-emerald-500 font-bold mb-1 uppercase">After</div>
                        <pre className="whitespace-pre-wrap">{msg.codeDiff.newCode}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps (collapsed summary) */}
                {msg.steps && msg.steps.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-neutral-500">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{msg.steps.length} analysis steps — see Trace tab</span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                </div>
              )}
            </div>
          );
        })}

        {isRunning && (
          <div className="flex gap-3 items-center text-xs text-neutral-500 font-mono">
            <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
            </div>
            <span>Analyzing codebase with Gemini...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800 bg-neutral-900/20 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isRunning}
            placeholder={placeholder}
            className="w-full pl-4 pr-12 py-2.5 text-sm bg-neutral-900 border border-neutral-700/60 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-orange-500/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isRunning || !inputText.trim()}
            className="absolute right-2 p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
