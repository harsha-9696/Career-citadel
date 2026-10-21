import React, { useState } from 'react';
import { Volume2, VolumeX, Building2, FileDown, Printer, ShieldCheck, Sparkles } from 'lucide-react';
import { OfficeZone, CitadelDossier } from '../../types';
import { stopSpeaking, isVoiceMuted, setVoiceMuted } from '../../services/voice';
import { calculateReadinessScore, downloadDossierMarkdown, printDossierExecutiveReport } from '../../services/dossierExport';
import { getGeminiApiKey, getActiveProvider } from '../../services/ai';
import { AiSettingsModal } from '../UI/AiSettingsModal';

interface NavigationProps {
  activeZone: OfficeZone | null;
  dossier: CitadelDossier;
  onZoneSelect: (zone: OfficeZone) => void;
}

export function Navigation({ activeZone, dossier, onZoneSelect }: NavigationProps) {
  const [isMuted, setIsMuted] = useState(() => isVoiceMuted());
  const [showDossierMenu, setShowDossierMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const readiness = calculateReadinessScore(dossier);
  const activeProvider = getActiveProvider();
  const hasGemini = Boolean(getGeminiApiKey());

  const engineLabel = activeProvider === 'groq' 
    ? 'Groq LPU' 
    : (activeProvider === 'gemini' ? 'Gemini Flash' : 'Smart Auto');

  const zones: { id: OfficeZone; label: string; agent: string; icon: string }[] = [
    { id: 'lobby', label: 'Reception', agent: 'Veena', icon: '🌟' },
    { id: 'scanner', label: 'ATS Vault', agent: 'Babu', icon: '🔍' },
    { id: 'warroom', label: 'War Room', agent: 'Ravi', icon: '💻' },
    { id: 'corner', label: 'Corner Office', agent: 'Harsha', icon: '⚡' },
    { id: 'holodeck', label: 'HoloDeck', agent: 'Radha', icon: '🧭' },
  ];

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setVoiceMuted(nextMuted);
    if (nextMuted) {
      stopSpeaking();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 flex items-center justify-between shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="font-display italic text-2xl text-slate-900 tracking-wide flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            The Career Citadel
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full hidden sm:inline-block">
            3D Office Simulator
          </span>
        </div>

        {/* Zone Selector Pills */}
        <nav className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => onZoneSelect(z.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeZone === z.id
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{z.icon}</span>
              <span>{z.label}</span>
              <span className="text-[10px] text-slate-400 font-normal hidden md:inline">({z.agent})</span>
            </button>
          ))}
        </nav>

        {/* Right Tools: AI Engine + Readiness Score + Dossier Export + Voice Toggle */}
        <div className="flex items-center gap-2.5">
          {/* AI Engine Selector */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 rounded-lg text-xs font-mono text-blue-900 transition-all shadow-sm font-semibold"
            title="Configure Citadel AI Brain (Google Gemini / Groq)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">{engineLabel}</span>
          </button>

          {/* Citadel Readiness Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono shadow-sm">
            <ShieldCheck className={`w-3.5 h-3.5 ${readiness >= 75 ? 'text-emerald-500' : readiness >= 50 ? 'text-blue-500' : 'text-amber-500'}`} />
            <span className="text-slate-500 hidden lg:inline">Readiness:</span>
            <span className="font-bold text-slate-800">{readiness}%</span>
          </div>

          {/* Dossier Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDossierMenu(!showDossierMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono transition-all shadow-sm"
              title="Download or Print Executive Dossier"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold hidden sm:inline">Dossier</span>
            </button>

            {showDossierMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-fade-in text-left">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Citadel Brain Export
                </div>
                <button
                  onClick={() => {
                    setShowDossierMenu(false);
                    printDossierExecutiveReport(dossier);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>Print / Save PDF Report</span>
                </button>
                <button
                  onClick={() => {
                    setShowDossierMenu(false);
                    downloadDossierMarkdown(dossier);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-emerald-600" />
                  <span>Export Markdown (.md)</span>
                </button>
              </div>
            )}
          </div>

          {/* Voice Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
              isMuted
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
            }`}
            title={isMuted ? 'Voice Muted (Click to Unmute)' : 'Voice Active (Click to Mute)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* AI Settings Modal */}
      <AiSettingsModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </>
  );
}
