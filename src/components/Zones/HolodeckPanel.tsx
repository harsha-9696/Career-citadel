import React, { useState } from 'react';
import { Compass, Sparkles, TrendingUp, Loader2, X } from 'lucide-react';
import { simulateSkillWithRadha } from '../../services/ai';
import { speakAsAgent } from '../../services/voice';
import { CareerSimulation, UserProfile } from '../../types';

interface HolodeckPanelProps {
  userProfile: UserProfile;
  onSimulationComplete?: (sim: CareerSimulation) => void;
  onClose: () => void;
}

export function HolodeckPanel({ userProfile, onSimulationComplete, onClose }: HolodeckPanelProps) {
  const [skill, setSkill] = useState('');
  const [simulations, setSimulations] = useState<CareerSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (skillToTest: string) => {
    if (!skillToTest.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await simulateSkillWithRadha(
        userProfile.targetRole || 'Software Engineer',
        userProfile.skills,
        70,
        skillToTest.trim()
      );

      setSimulations(prev => [result, ...prev]);
      setSkill('');
      setIsLoading(false);

      onSimulationComplete?.(result);
      speakAsAgent('radha', `Mastering ${result.skill} shifts your readiness by ${result.scoreDelta > 0 ? '+' : ''}${result.scoreDelta} percent. ${result.verdict}`);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Simulation failed.');
    }
  };

  const quickSkills = ['Kubernetes', 'System Design', 'Rust', 'GraphQL', 'AWS Cloud', 'Docker'];

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-xl w-full text-left max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-cyan-600 uppercase flex items-center gap-1.5 font-semibold">
            <Compass className="w-3.5 h-3.5" /> Deck 04 // Quantum HoloDeck
          </span>
          <h2 className="font-display italic text-2xl text-slate-900">Radha's What-If Simulator</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full font-semibold">
            Trajectory Forecasting
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-1"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Test how learning high-demand technologies branches out your career timeline, jumps your role match percentage, and unlocks senior titles.
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
          placeholder="e.g. Apache Kafka, Go, Large Language Models..."
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSimulate(skill);
          }}
        />
        <button
          onClick={() => handleSimulate(skill)}
          disabled={isLoading || !skill.trim()}
          className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Simulate</span>
        </button>
      </div>

      {/* Quick Pills */}
      <div className="flex flex-wrap gap-1.5 mb-5 items-center">
        <span className="text-[10px] font-mono text-slate-500 mr-1 font-semibold">Quick Picks:</span>
        {quickSkills.map((qs, i) => (
          <button
            key={i}
            onClick={() => handleSimulate(qs)}
            disabled={isLoading}
            className="text-[10px] font-mono bg-slate-100 hover:bg-cyan-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600 hover:text-cyan-700 transition-colors"
          >
            + {qs}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Simulation Feed */}
      <div className="space-y-3">
        {simulations.map((sim, i) => (
          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                {sim.skill}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                {sim.scoreDelta > 0 ? `+${sim.scoreDelta}%` : `${sim.scoreDelta}%`} → {sim.newScore}%
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{sim.impact}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {sim.newOpportunities.map((op, idx) => (
                <span key={idx} className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                  ✦ {op}
                </span>
              ))}
            </div>
            <p className="text-[11px] font-serif italic text-slate-500 pt-1">
              "{sim.verdict}"
            </p>
          </div>
        ))}

        {simulations.length === 0 && !isLoading && (
          <div className="text-center py-8 text-xs text-slate-400 font-mono">
            Type any skill or click a quick pick above to calculate trajectory branching.
          </div>
        )}
      </div>
    </div>
  );
}
