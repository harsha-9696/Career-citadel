import { AgentId } from '../types';

let voices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakAsAgent(agentId: AgentId, text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  stopSpeaking();

  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .slice(0, 500); // Keep reasonable speech length

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Agent voice customization
  if (voices.length === 0) {
    voices = window.speechSynthesis.getVoices();
  }

  const voiceMap: Record<AgentId, { pitch: number; rate: number; preferredGenders: string[] }> = {
    veena: { pitch: 1.1, rate: 1.0, preferredGenders: ['female', 'en-IN', 'en-GB'] },
    babu: { pitch: 0.95, rate: 1.05, preferredGenders: ['male', 'en-IN', 'en-GB'] },
    harsha: { pitch: 0.85, rate: 1.0, preferredGenders: ['male', 'en-US', 'en-GB'] },
    ravi: { pitch: 0.95, rate: 1.0, preferredGenders: ['male', 'en-US'] },
    radha: { pitch: 1.05, rate: 1.0, preferredGenders: ['female', 'en-US'] }
  };

  const config = voiceMap[agentId] || { pitch: 1.0, rate: 1.0, preferredGenders: [] };
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;

  // Try to find matching voice
  const matchedVoice = voices.find(v => 
    config.preferredGenders.some(p => v.name.toLowerCase().includes(p) || v.lang.toLowerCase().includes(p))
  );

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}
