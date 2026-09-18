'use client';

import React, { useState } from 'react';
import { Message } from '@/lib/types';
import { Send, Terminal, FileCode, CheckCircle2, XCircle, Bot, User } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  isRunning: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isRunning,
  error,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isRunning) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-950 border-r border-neutral-800 overflow-hidden">
      {/* Panel Title */}
      <div className="px-5 py-3 border-b border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-orange-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Developer Chat & Sandbox
          </h2>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          Turns: {messages.filter(m => m.role !== 'system').length}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div
                key={msg.id}
                className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 font-mono"
              >
                {msg.content}
              </div>
            );
          }

          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-4 ${
                  isUser
                    ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                    : 'bg-neutral-900 text-neutral-200 border border-neutral-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-2 text-[11px] text-neutral-400 font-mono">
                  <span>{isUser ? 'Developer' : 'Map AI Agent'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {msg.content}
                </div>

                {/* Optional Code Diff Block */}
                {msg.codeDiff && (
                  <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden font-mono text-[11px]">
                    <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2 text-neutral-300">
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      <span>{msg.codeDiff.filename} (Patch Applied)</span>
                    </div>
                    <div className="p-3 overflow-x-auto space-y-2">
                      <div className="text-red-400 bg-red-950/30 p-2 rounded border border-red-900/40">
                        <div className="text-[10px] uppercase font-bold text-red-400 mb-1">- Previous Code:</div>
                        <pre className="whitespace-pre">{msg.codeDiff.oldCode}</pre>
                      </div>
                      <div className="text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                        <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">+ Healed Patch:</div>
                        <pre className="whitespace-pre">{msg.codeDiff.newCode}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional PyTest Output Block */}
                {msg.testOutput && (
                  <div className="mt-3 rounded-lg border border-neutral-800 bg-black/80 overflow-hidden font-mono text-[11px]">
                    <div className="px-3 py-1.5 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PyTest Sandbox Runner</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>14/14 Green</span>
                      </div>
                    </div>
                    <div className="p-3 overflow-x-auto text-neutral-300">
                      <pre className="whitespace-pre text-emerald-400/90">{msg.testOutput.stdout}</pre>
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isRunning && (
          <div className="flex gap-3 items-center text-xs text-neutral-400 font-mono animate-pulse">
            <div className="w-7 h-7 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span>Agent executing pipeline & streaming spans...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800 bg-neutral-900/40">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isRunning}
            placeholder="Type a debugging instruction (e.g., 'Fix calculate_discount in checkout.py')..."
            className="w-full pl-4 pr-12 py-3 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 font-sans"
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
