import React, { useState } from 'react';
import { Sparkles, Cpu, Check, AlertCircle, X, ExternalLink, Key, RefreshCw } from 'lucide-react';
import { 
  getActiveProvider, 
  setActiveProvider, 
  getGeminiApiKey, 
  setGeminiApiKey, 
  getGroqApiKey, 
  setGroqApiKey,
  AiProvider
} from '../../services/ai';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSettingsModal({ isOpen, onClose }: AiSettingsModalProps) {
  const [provider, setProvider] = useState<AiProvider>(() => getActiveProvider());
  const [geminiKey, setGeminiKey] = useState(() => getGeminiApiKey());
  const [groqKey, setGroqKey] = useState(() => getGroqApiKey());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setActiveProvider(provider);
    setGeminiApiKey(geminiKey);
    setGroqApiKey(groqKey);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => {
      setSaveStatus(null);
      onClose();
    }, 1200);
  };

  const hasGemini = Boolean(geminiKey.trim());
  const hasGroq = Boolean(groqKey.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display italic text-xl text-slate-900">Citadel AI Brain Engine</h3>
              <p className="text-[11px] font-mono text-slate-500">Configure Google Gemini & Groq Providers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Selection Tabs */}
        <div className="mb-5">
          <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">
            Active Provider Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setProvider('auto')}
              className={`p-3 rounded-xl border text-left transition-all ${
                provider === 'auto'
                  ? 'border-blue-500 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Smart Auto</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">Gemini first, Groq fallback</p>
            </button>

            <button
              onClick={() => setProvider('gemini')}
              className={`p-3 rounded-xl border text-left transition-all ${
                provider === 'gemini'
                  ? 'border-indigo-500 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Google Gemini</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">Gemini 2.0 Flash</p>
            </button>

            <button
              onClick={() => setProvider('groq')}
              className={`p-3 rounded-xl border text-left transition-all ${
                provider === 'groq'
                  ? 'border-purple-500 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                <span>Groq LPU</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">High-speed inference</p>
            </button>
          </div>
        </div>

        {/* API Key Inputs */}
        <div className="space-y-4 mb-5">
          {/* Google Gemini Key */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" /> Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-slate-500">
              <span>Supports Gemini 2.0 Flash (1M tokens/min free)</span>
              {hasGemini ? (
                <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="text-slate-400">Not set</span>
              )}
            </div>
          </div>

          {/* Groq Key */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" /> Groq API Key
              </span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <span>Groq Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-500"
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-slate-500">
              <span>Used as automatic backup or primary engine</span>
              {hasGroq ? (
                <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="text-slate-400">Not set</span>
              )}
            </div>
          </div>
        </div>

        {saveStatus && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-700 flex items-center gap-2 mb-4 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold shadow-md shadow-slate-900/10 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
