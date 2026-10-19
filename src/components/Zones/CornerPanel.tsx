import React, { useState } from 'react';
import { Skull, Flame, Loader2, Volume2, ShieldAlert, X } from 'lucide-react';
import { getBrutalRoastWithHarsha } from '../../services/ai';
import { speakAsAgent } from '../../services/voice';
import { UserProfile } from '../../types';

interface CornerPanelProps {
  userProfile: UserProfile;
  dossierStats?: {
    resumeScore?: number;
    resumeVerdict?: string;
    interviewScore?: number;
    interviewGrade?: string;
    missingSkills?: string[];
    weaknesses?: string[];
  };
  onRoastComplete?: (roastText: string) => void;
  onClose: () => void;
}

export function CornerPanel({ userProfile, dossierStats, onRoastComplete, onClose }: CornerPanelProps) {
  const [roast, setRoast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestRealityCheck = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const text = await getBrutalRoastWithHarsha(userProfile, dossierStats);
      setRoast(text);
      setIsLoading(false);

      onRoastComplete?.(text);
      speakAsAgent('harsha', text.slice(0, 300));
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Harsha is unavailable right now.');
    }
  };

  const hasAuditMemory = dossierStats?.resumeScore !== undefined;
  const hasInterviewMemory = dossierStats?.interviewScore !== undefined;

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-xl w-full text-left max-h-[85vh] overflow-y-auto shadow-2xl border border-red-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-200 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-red-600 uppercase flex items-center gap-1.5 font-semibold">
            <Skull className="w-3.5 h-3.5" /> Penthouse // The Corner Office
          </span>
          <h2 className="font-display italic text-2xl text-slate-900">Harsha's Brutal Reality Check</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full flex items-center gap-1 font-semibold">
            <Flame className="w-3 h-3 text-red-500" /> Uncensored Truth
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Harsha does not do polite feedback. He evaluates your actual trajectory against real hiring bars at top engineering organizations. If you want sugarcoated validation, stay in the lobby.
      </p>

      {/* Cross-Agent Memory Card */}
      {(hasAuditMemory || hasInterviewMemory) && (
        <div className="p-3 bg-slate-900 text-slate-100 rounded-xl mb-4 text-xs font-mono border border-slate-700 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-red-400 font-bold flex items-center gap-1">
            <span>⚡ Citadel Brain: Memory Synchronized</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
            {hasAuditMemory && (
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Babu's ATS: <strong className="text-amber-400">{dossierStats?.resumeScore}%</strong> ({dossierStats?.resumeVerdict})
              </span>
            )}
            {hasInterviewMemory && (
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Ravi's Interview: <strong className="text-purple-400">{dossierStats?.interviewScore}%</strong> ({dossierStats?.interviewGrade})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Target Info preview */}
      <div className="p-3 bg-red-50/60 border border-red-150 rounded-xl mb-4 text-xs font-mono flex items-center justify-between">
        <div>
          <span className="text-slate-500">Candidate: </span>
          <span className="text-slate-900 font-bold">{userProfile.name || 'Anonymous'}</span>
        </div>
        <div>
          <span className="text-slate-500">Target: </span>
          <span className="text-red-600 font-bold">{userProfile.targetRole || 'Not set'}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg mb-4">
          {error}
        </div>
      )}

      {!roast && (
        <button
          onClick={handleRequestRealityCheck}
          disabled={isLoading}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
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
          <div className="p-4 bg-slate-50 rounded-xl border border-red-200 relative">
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-red-600 font-bold">
              <span>EXECUTIVE VERDICT</span>
              <button
                onClick={() => speakAsAgent('harsha', roast.slice(0, 300))}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" /> Replay Speech
              </button>
            </div>
            <div className="mt-2">
              {(() => {
                if (roast.includes('### ')) {
                  const parts = roast.split(/(?=### )/g).filter((p) => p.trim());
                  return (
                    <div className="space-y-3">
                      {parts.map((part, idx) => {
                        const lines = part.trim().split('\n');
                        const header = lines[0].replace(/^###\s*/, '').trim();
                        const body = lines.slice(1).join('\n').trim();

                        return (
                          <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm text-left">
                            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-red-900 border-b border-slate-100 pb-2 mb-2">
                              {header}
                            </h4>
                            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line space-y-2 font-sans">
                              {body}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="text-xs text-slate-800 leading-relaxed space-y-3 whitespace-pre-line font-body p-3 bg-white rounded-xl border border-slate-200">
                    {roast}
                  </div>
                );
              })()}
            </div>
          </div>

          <button
            onClick={() => setRoast(null)}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono text-slate-700 rounded-lg transition-colors font-semibold"
          >
            ↺ Re-evaluate with Updated Profile
          </button>
        </div>
      )}
    </div>
  );
}
