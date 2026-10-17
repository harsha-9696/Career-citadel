import React, { useState } from 'react';
import { Skull, Flame, Loader2, Volume2, ShieldAlert } from 'lucide-react';
import { getBrutalRoastWithHarsha } from '../../services/ai';
import { speakAsAgent } from '../../services/voice';
import { UserProfile } from '../../types';

interface CornerPanelProps {
  userProfile: UserProfile;
}

export function CornerPanel({ userProfile }: CornerPanelProps) {
  const [roast, setRoast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestRealityCheck = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const text = await getBrutalRoastWithHarsha(userProfile);
      setRoast(text);
      setIsLoading(false);

      speakAsAgent('harsha', text.slice(0, 300));
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Harsha is unavailable right now.');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full text-left max-h-[80vh] overflow-y-auto border-brutal/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brutal/20 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-brutal uppercase flex items-center gap-1.5">
            <Skull className="w-3.5 h-3.5" /> Penthouse // The Corner Office
          </span>
          <h2 className="font-display italic text-2xl text-[#f0efe8]">Harsha's Brutal Reality Check</h2>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 bg-brutal/10 text-brutal border border-brutal/30 rounded-full flex items-center gap-1">
          <Flame className="w-3 h-3" /> Uncensored Truth
        </span>
      </div>

      <p className="text-xs text-muted mb-4 leading-relaxed">
        Harsha does not do polite feedback. He evaluates your actual trajectory against real hiring bars at top engineering organizations. If you want sugarcoated validation, stay in the lobby.
      </p>

      {/* Target Info preview */}
      <div className="p-3 bg-surface2/60 border border-white/5 rounded-xl mb-4 text-xs font-mono flex items-center justify-between">
        <div>
          <span className="text-muted">Candidate: </span>
          <span className="text-text font-bold">{userProfile.name || 'Anonymous'}</span>
        </div>
        <div>
          <span className="text-muted">Target: </span>
          <span className="text-accent font-bold">{userProfile.targetRole || 'Not set'}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-brutal/10 border border-brutal/30 text-brutal text-xs rounded-lg mb-4">
          {error}
        </div>
      )}

      {!roast && (
        <button
          onClick={handleRequestRealityCheck}
          disabled={isLoading}
          className="w-full py-3 bg-brutal hover:bg-red-600 disabled:opacity-40 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brutal/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Harsha is Reviewing Your Dossier...</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>Receive Brutal Reality Check</span>
            </>
          )}
        </button>
      )}

      {roast && (
        <div className="space-y-4 animate-fade-in mt-2">
          <div className="p-4 bg-surface2 rounded-xl border border-brutal/30 relative">
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-brutal">
              <span>EXECUTIVE VERDICT</span>
              <button
                onClick={() => speakAsAgent('harsha', roast.slice(0, 300))}
                className="text-muted hover:text-white flex items-center gap-1 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" /> Replay Speech
              </button>
            </div>
            <div className="text-xs text-text/90 leading-relaxed space-y-3 whitespace-pre-line font-body">
              {roast}
            </div>
          </div>

          <button
            onClick={() => setRoast(null)}
            className="w-full py-2.5 bg-surface2 hover:bg-surface border border-white/10 text-xs font-mono text-muted hover:text-text rounded-lg transition-colors"
          >
            ↺ Re-evaluate with Updated Profile
          </button>
        </div>
      )}
    </div>
  );
}
