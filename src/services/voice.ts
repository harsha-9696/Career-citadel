import { AgentId } from '../types';

let voices: SpeechSynthesisVoice[] = [];
let isMutedState = false;

if (typeof window !== 'undefined') {
  isMutedState = localStorage.getItem('citadel_voice_muted') === 'true';

  if ('speechSynthesis' in window) {
    const loadVoices = () => {
      voices = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function isVoiceMuted(): boolean {
  return isMutedState;
}

export function setVoiceMuted(muted: boolean): void {
  isMutedState = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('citadel_voice_muted', muted ? 'true' : 'false');
    if (muted) {
      stopSpeaking();
    }
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakAsAgent(agentId: AgentId, text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMutedState) {
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

// ==========================================
// Hands-Free Speech-to-Text (STT) Engine
// ==========================================

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export interface SpeechRecognitionCallbacks {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

let activeRecognition: any = null;

export function startSpeechRecognition(callbacks: SpeechRecognitionCallbacks): () => void {
  if (typeof window === 'undefined') {
    callbacks.onError?.('Speech recognition not available on this platform.');
    return () => {};
  }

  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRec) {
    callbacks.onError?.('Speech recognition not supported in this browser. Please use Chrome, Edge, or Brave.');
    return () => {};
  }

  // Stop any existing session
  stopSpeechRecognition();

  try {
    const recognition = new SpeechRec();
    activeRecognition = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const chunk = transcript.trim();
          if (chunk) {
            callbacks.onFinal(chunk);
          }
        } else {
          interim += transcript;
          callbacks.onInterim?.(interim);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Normal silence timeout, don't scream error
        return;
      }
      callbacks.onError?.(`Mic Error: ${event.error}`);
    };

    recognition.onend = () => {
      callbacks.onEnd?.();
      activeRecognition = null;
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore already stopped
      }
      activeRecognition = null;
    };
  } catch (err: any) {
    callbacks.onError?.(err.message || 'Failed to initialize microphone.');
    return () => {};
  }
}

export function stopSpeechRecognition(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // Ignore
    }
    activeRecognition = null;
  }
}
