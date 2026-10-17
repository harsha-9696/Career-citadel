import React, { useState } from 'react';
import { Volume2, VolumeX, Key, Sparkles, Building2 } from 'lucide-react';
import { OfficeZone } from '../../types';
import { getApiKey, setApiKey } from '../../services/ai';
import { stopSpeaking } from '../../services/voice';

interface NavigationProps {
  activeZone: OfficeZone;
  onZoneSelect: (zone: OfficeZone) => void;
}

export function Navigation({ activeZone, onZoneSelect }: NavigationProps) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(getApiKey());
  const [isMuted, setIsMuted] = useState(false);

  const zones: { id: OfficeZone; label: string; agent: string; icon: string }[] = [
    { id: 'lobby', label: 'Mirror Lobby', agent: 'Veena', icon: '🌟' },
    { id: 'scanner', label: 'ATS Vault', agent: 'Babu', icon: '🔍' },
    { id: 'warroom', label: 'War Room', agent: 'Ravi & Radha', icon: '💻' },
    { id: 'corner', label: 'Corner Office', agent: 'Harsha', icon: '⚡' },
    { id: 'holodeck', label: 'HoloDeck', agent: 'Radha', icon: '🧭' },
  ];

  const handleSaveKey = () => {
    setApiKey(keyInput);
    setShowKeyModal(false);
  };

  const handleToggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-surface/80 backdrop-blur-md border-b border-white/10 z-50 px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="font-display italic text-xl text-accent tracking-wide flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            Career Citadel
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted border border-white/10 px-2 py-0.5 rounded">
            3D Office
          </span>
        </div>

        {/* Zone Selector Pills */}
        <nav className="flex items-center gap-1 bg-surface2/60 border border-white/5 p-1 rounded-xl">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => onZoneSelect(z.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeZone === z.id
                  ? 'bg-accent/15 text-accent border border-accent/30 font-semibold shadow-sm'
                  : 'text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              <span>{z.icon}</span>
              <span>{z.label}</span>
              <span className="text-[10px] opacity-60">({z.agent})</span>
            </button>
          ))}
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
              isMuted
                ? 'bg-brutal/10 border-brutal/30 text-brutal'
                : 'bg-surface2 border-white/10 text-muted hover:text-text'
            }`}
            title={isMuted ? 'Voice Muted' : 'Voice Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface2 hover:bg-surface border border-white/10 rounded-lg text-xs font-mono text-muted hover:text-accent transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Key</span>
          </button>
        </div>
      </header>

      {/* API Key Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-white/20">
            <h3 className="font-display italic text-xl text-text mb-2">Groq Free API Key</h3>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Get your free key with 800 tok/sec speeds at{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline"
              >
                console.groq.com/keys
              </a>
              . Your key is stored locally in your browser only.
            </p>

            <input
              type="password"
              className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-text font-mono focus:outline-none focus:border-accent mb-4"
              placeholder="gsk_..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-mono text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-5 py-2 bg-accent text-bg text-xs font-mono font-semibold rounded-lg hover:bg-accent/90"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
