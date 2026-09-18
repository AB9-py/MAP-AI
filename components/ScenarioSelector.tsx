'use client';

import React from 'react';
import { DEMO_SCENARIOS } from '@/lib/demo-scenarios';
import { DemoScenario } from '@/lib/types';
import { Flame, Brain, Zap, ShieldAlert } from 'lucide-react';

interface ScenarioSelectorProps {
  activeScenarioId: string;
  onSelectScenario: (scenario: DemoScenario) => void;
  isRunning: boolean;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  activeScenarioId,
  onSelectScenario,
  isRunning
}) => {
  const getIcon = (category: DemoScenario['category']) => {
    switch (category) {
      case 'Failure & Healing':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'Long Context (20 Turns)':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'Happy Path':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Tool Interception':
        return <ShieldAlert className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-neutral-900/60 border-b border-neutral-800 px-6 py-2.5 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">
            Judges Test Scenarios (1-Click Evaluation):
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {DEMO_SCENARIOS.map((scenario) => {
          const isSelected = activeScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              disabled={isRunning}
              className={`text-left p-3 rounded-lg border transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-neutral-800/90 border-orange-500/60 shadow-sm ring-1 ring-orange-500/30'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40'
              } disabled:opacity-60`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {getIcon(scenario.category)}
                <span className="text-xs font-medium text-white truncate">{scenario.title}</span>
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                {scenario.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
