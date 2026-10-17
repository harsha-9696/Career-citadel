import React, { useState } from 'react';
import { Volume2, VolumeX, Building2 } from 'lucide-react';
import { OfficeZone } from '../../types';
import { stopSpeaking } from '../../services/voice';

interface NavigationProps {
  activeZone: OfficeZone | null;
  onZoneSelect: (zone: OfficeZone) => void;
}

export function Navigation({ activeZone, onZoneSelect }: NavigationProps) {
  const [isMuted, setIsMuted] = useState(false);

  const zones: { id: OfficeZone; label: string; agent: string; icon: string }[] = [
    { id: 'lobby', label: 'Reception', agent: 'Veena', icon: '🌟' },
    { id: 'scanner', label: 'ATS Vault', agent: 'Babu', icon: '🔍' },
    { id: 'warroom', label: 'War Room', agent: 'Ravi', icon: '💻' },
    { id: 'corner', label: 'Corner Office', agent: 'Harsha', icon: '⚡' },
    { id: 'holodeck', label: 'HoloDeck', agent: 'Radha', icon: '🧭' },
  ];

  const handleToggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 flex items-center justify-between shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="font-display italic text-2xl text-slate-900 tracking-wide flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          The Career Citadel
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
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
            <span className="text-[10px] text-slate-400 font-normal">({z.agent})</span>
          </button>
        ))}
      </nav>

      {/* Right Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
            isMuted
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
          }`}
          title={isMuted ? 'Voice Muted' : 'Voice Active'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
