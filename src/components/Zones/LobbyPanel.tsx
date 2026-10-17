import React, { useState } from 'react';
import { Send, Sparkles, User, Target, Layers, ArrowRight, Volume2 } from 'lucide-react';
import { chatWithVeena } from '../../services/ai';
import { speakAsAgent } from '../../services/voice';
import { OfficeZone, UserProfile } from '../../types';

interface LobbyPanelProps {
  userProfile: UserProfile;
  onProfileUpdate: (updated: Partial<UserProfile>) => void;
  onNavigateZone: (zone: OfficeZone) => void;
}

export function LobbyPanel({ userProfile, onProfileUpdate, onNavigateZone }: LobbyPanelProps) {
  const [skillInput, setSkillInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: `Welcome to the Career Citadel. I am Veena, your Navigator. What goal are we strategizing today?`
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

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

    const newMsgs = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMsgs);
    setIsTyping(true);

    try {
      const reply = await chatWithVeena(userText, userProfile, newMsgs);
      setMessages([...newMsgs, { role: 'assistant', content: reply }]);
      setIsTyping(false);

      speakAsAgent('veena', reply);
    } catch (err: any) {
      setIsTyping(false);
      setMessages([...newMsgs, { role: 'assistant', content: 'Connection issue. Check your API settings in the top right.' }]);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full text-left max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#7fff6e] uppercase">Grand Atrium // Lobby</span>
          <h2 className="font-display italic text-2xl text-[#f0efe8]">Veena's Career Mirror</h2>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full">
          Citadel Concierge
        </span>
      </div>

      {/* Profile Setup Form */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[11px] font-mono text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Your Name
          </label>
          <input
            type="text"
            className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            placeholder="e.g. Harsh"
            value={userProfile.name}
            onChange={(e) => onProfileUpdate({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Target className="w-3.5 h-3.5" /> Target Role
          </label>
          <input
            type="text"
            className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            placeholder="e.g. Senior Full-Stack Engineer"
            value={userProfile.targetRole}
            onChange={(e) => onProfileUpdate({ targetRole: e.target.value })}
          />
        </div>
      </div>

      {/* Skills Pill Input */}
      <div className="mb-5">
        <label className="block text-[11px] font-mono text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Skills Stack (Type and press Enter)
        </label>
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-surface2 border border-white/10 rounded-lg min-h-[44px]">
          {userProfile.skills.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-accent/15 text-accent border border-accent/20 px-2 py-0.5 rounded text-xs font-mono">
              {s}
              <button onClick={() => handleRemoveSkill(s)} className="hover:text-white opacity-70">✕</button>
            </span>
          ))}
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-xs text-text focus:outline-none min-w-[120px]"
            placeholder="Add skill (e.g. React, Node, AWS)..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleAddSkill}
          />
        </div>
      </div>

      {/* Quick Room Shortcuts */}
      <div className="mb-6">
        <div className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2">Citadel Quick Teleport</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigateZone('scanner')}
            className="p-2.5 bg-surface2 hover:bg-surface border border-white/10 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-accent2">Babu's ATS Vault</div>
              <div className="text-[10px] text-muted">Deep PDF text audit</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent2 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigateZone('warroom')}
            className="p-2.5 bg-surface2 hover:bg-surface border border-white/10 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-accent">The War Room</div>
              <div className="text-[10px] text-muted">Ravi & Radha Mock Interview</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigateZone('corner')}
            className="p-2.5 bg-surface2 hover:bg-surface border border-white/10 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-brutal">The Corner Office</div>
              <div className="text-[10px] text-muted">Harsha's reality check</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-brutal group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigateZone('holodeck')}
            className="p-2.5 bg-surface2 hover:bg-surface border border-white/10 rounded-lg text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-accent">Quantum HoloDeck</div>
              <div className="text-[10px] text-muted">Radha's What-If Simulator</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* Chat with Veena */}
      <div className="border-t border-white/10 pt-4">
        <div className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Consult Veena</span>
          <span className="text-[10px] text-accent">Active</span>
        </div>

        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-surface2 border border-white/5 text-text'
                  : 'bg-accent/15 border border-accent/20 text-text ml-8'
              }`}
            >
              {m.content}
            </div>
          ))}
          {isTyping && (
            <div className="text-xs font-mono text-muted italic">Veena is thinking...</div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
            placeholder="Ask Veena for career guidance..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
          />
          <button
            onClick={handleSendChat}
            disabled={isTyping || !chatInput.trim()}
            className="p-2 bg-accent hover:bg-accent/90 disabled:opacity-40 text-bg rounded-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
