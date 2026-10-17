import React, { useState } from 'react';
import { Compass, Sparkles, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { simulateSkillWithRadha } from '../../services/ai';
import { speakAsAgent } from '../../services/voice';
import { CareerSimulation, UserProfile } from '../../types';

interface HolodeckPanelProps {
  userProfile: UserProfile;
}

export function HolodeckPanel({ userProfile }: HolodeckPanelProps) {
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
        70, // Base match score baseline
        skillToTest.trim()
      );

      setSimulations(prev => [result, ...prev]);
      setSkill('');
      setIsLoading(false);

      speakAsAgent('radha', `Mastering ${result.skill} shifts your readiness by ${result.scoreDelta > 0 ? '+' : ''}${result.scoreDelta} percent. ${result.verdict}`);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Simulation failed.');
    }
  };

  const quickSkills = ['Kubernetes', 'System Design', 'Rust', 'GraphQL', 'AWS Cloud', 'Docker'];

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full text-left max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#7fff6e] uppercase flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Deck 04 // Quantum HoloDeck
          </span>
          <h2 className="font-display italic text-2xl text-[#f0efe8]">Radha's What-If Simulator</h2>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full">
          Trajectory Forecasting
        </span>
      </div>

      <p className="text-xs text-muted mb-4 leading-relaxed">
        Test how learning high-demand technologies branches out your career timeline, jumps your role match percentage, and unlocks senior titles.
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          className="flex-1 bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
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
          className="px-5 py-2 bg-accent hover:bg-accent/90 disabled:opacity-40 text-bg font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-accent/20"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Simulate</span>
        </button>
      </div>

      {/* Quick Pills */}
      <div className="flex flex-wrap gap-1.5 mb-5 items-center">
        <span className="text-[10px] font-mono text-muted mr-1">Quick Picks:</span>
        {quickSkills.map((qs, i) => (
          <button
            key={i}
            onClick={() => handleSimulate(qs)}
            disabled={isLoading}
            className="text-[10px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded text-muted hover:text-text transition-colors"
          >
            + {qs}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-brutal/10 border border-brutal/30 text-brutal text-xs rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Simulation Feed */}
      <div className="space-y-3">
        {simulations.map((sim, i) => (
          <div key={i} className="p-4 bg-surface2 rounded-xl border border-white/10 animate-fade-in space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                {sim.skill}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                {sim.scoreDelta > 0 ? `+${sim.scoreDelta}%` : `${sim.scoreDelta}%`} → {sim.newScore}%
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{sim.impact}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {sim.newOpportunities.map((op, idx) => (
                <span key={idx} className="text-[10px] font-mono bg-accent2/10 text-accent2 border border-accent2/20 px-2 py-0.5 rounded">
                  ✦ {op}
                </span>
              ))}
            </div>
            <p className="text-[11px] font-serif italic text-muted pt-1">
              "{sim.verdict}"
            </p>
          </div>
        ))}

        {simulations.length === 0 && !isLoading && (
          <div className="text-center py-8 text-xs text-muted font-mono">
            Type any skill or click a quick pick above to calculate trajectory branching.
          </div>
        )}
      </div>
    </div>
  );
}
