import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Target, Layers, ArrowRight, X, Mic, MicOff } from 'lucide-react';
import { chatWithVeena } from '../../services/ai';
import { speakAsAgent, startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported } from '../../services/voice';
import { OfficeZone, UserProfile } from '../../types';

interface LobbyPanelProps {
  userProfile: UserProfile;
  dossierSummary?: string;
  onProfileUpdate: (updated: Partial<UserProfile>) => void;
  onNavigateZone: (zone: OfficeZone) => void;
  onClose: () => void;
}

export function LobbyPanel({ userProfile, dossierSummary, onProfileUpdate, onNavigateZone, onClose }: LobbyPanelProps) {
  const [skillInput, setSkillInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: `Hello ${userProfile.name || 'there'}! I am Veena, your Citadel Concierge. What career goals are we mapping out today?`
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const stopRecRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopRecRef.current) stopRecRef.current();
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (isListening) {
      if (stopRecRef.current) {
        stopRecRef.current();
        stopRecRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) return;
      const stopFn = startSpeechRecognition({
        onStart: () => setIsListening(true),
        onFinal: (text) => {
          setChatInput(prev => (prev ? prev + ' ' + text : text));
        },
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false),
      });
      stopRecRef.current = stopFn;
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault();
      const val = skillInput.replace(',', '').trim();
      if (!userProfile.skills.includes(val)) {
        onProfileUpdate({ skills: [...userProfile.skills, val] });
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    onProfileUpdate({ skills: userProfile.skills.filter(s => s !== skill) });
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userText = chatInput.trim();
    setChatInput('');

    if (isListening && stopRecRef.current) {
      stopRecRef.current();
      setIsListening(false);
    }

    const newMsgs = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMsgs);
    setIsTyping(true);

    try {
      const reply = await chatWithVeena(userText, userProfile, newMsgs, dossierSummary);
      setMessages([...newMsgs, { role: 'assistant', content: reply }]);
      setIsTyping(false);

      speakAsAgent('veena', reply);
    } catch (err: any) {
      setIsTyping(false);
      setMessages([...newMsgs, { role: 'assistant', content: 'Connection issue. Please verify your connection.' }]);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-xl w-full text-left max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-600 uppercase font-semibold">Reception // Station 01</span>
          <h2 className="font-display italic text-2xl text-slate-900">Veena's Concierge Desk</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title="Close (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Setup Form */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-emerald-600" /> Your Name
          </label>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            placeholder="e.g. Harsh"
            value={userProfile.name}
            onChange={(e) => onProfileUpdate({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-600" /> Target Role
          </label>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            placeholder="e.g. Senior Full-Stack Engineer"
            value={userProfile.targetRole}
            onChange={(e) => onProfileUpdate({ targetRole: e.target.value })}
          />
        </div>
      </div>

      {/* Skills Pill Input */}
      <div className="mb-5">
        <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-emerald-600" /> Skills Stack (Type and press Enter)
        </label>
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[44px]">
          {userProfile.skills.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-mono">
              {s}
              <button onClick={() => handleRemoveSkill(s)} className="hover:text-red-500 opacity-70">✕</button>
            </span>
          ))}
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-xs text-slate-700 focus:outline-none min-w-[120px]"
            placeholder="Add skill (e.g. React, Node, Python)..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleAddSkill}
          />
        </div>
      </div>

      {/* Quick Office Teleport */}
      <div className="mb-6">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">Office Directory</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigateZone('scanner')}
            className="p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-blue-600">Babu's ATS Vault</div>
              <div className="text-[10px] text-slate-500">PDF resume extraction & audit</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigateZone('warroom')}
            className="p-2.5 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-purple-600">The War Room</div>
              <div className="text-[10px] text-slate-500">Ravi & Radha mock panel</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigateZone('corner')}
            className="p-2.5 bg-slate-50 hover:bg-red-50/50 border border-slate-200 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-red-600">The Corner Office</div>
              <div className="text-[10px] text-slate-500">Harsha's brutal review</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigateZone('holodeck')}
            className="p-2.5 bg-slate-50 hover:bg-cyan-50/50 border border-slate-200 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-cyan-600">Quantum HoloDeck</div>
              <div className="text-[10px] text-slate-500">Radha's What-If Simulator</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* Chat with Veena */}
      <div className="border-t border-slate-200 pt-4">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Consult Veena</span>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
        </div>

        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 ml-8'
              }`}
            >
              {m.content}
            </div>
          ))}
          {isTyping && (
            <div className="text-xs font-mono text-slate-400 italic">Veena is thinking...</div>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            placeholder={isListening ? "Listening... Speak to Veena..." : "Ask Veena for career guidance..."}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
          />
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-2 rounded-lg text-xs font-mono transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
            title="Speak your question hands-free"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
          </button>
          <button
            onClick={handleSendChat}
            disabled={isTyping || !chatInput.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
