/**
 * Procedural Web Audio API Engine for The Career Citadel
 * Generates 100% zero-dependency, ultra-lightweight SFX & ambient soundscapes.
 */

let audioCtx: AudioContext | null = null;
let ambientGainNode: GainNode | null = null;
let ambientOscillators: OscillatorNode[] = [];
let isAudioMuted = false;
let isAmbientPlaying = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Ensure context resumes on first user gesture
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function setSoundMuted(muted: boolean): void {
  isAudioMuted = muted;
  if (ambientGainNode) {
    ambientGainNode.gain.value = muted ? 0 : 0.04;
  }
}

/**
 * Play a soft procedural footstep sound (dual-filtered noise click)
 */
export function playFootstepSound(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Create tiny burst of filtered white noise
    const bufferSize = ctx.sampleRate * 0.04; // 40ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450 + Math.random() * 100, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  } catch (e) {
    // Ignore audio context errors
  }
}

/**
 * Play mechanical swivel / chair sit settle sound
 */
export function playChairSitSound(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Pitch glide
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {}
}

/**
 * Play warm two-note harmonic welcome chime when entering agent station
 */
export function playChimeSound(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [659.25, 830.61]; // E5, G#5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.7);
    });
  } catch (e) {}
}

/**
 * Play success celebration arpeggio
 */
export function playSuccessSound(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.45);
    });
  } catch (e) {}
}

/**
 * Ambient Lo-Fi Chill Synth Pad for Corporate HQ atmosphere
 */
export function toggleAmbientSound(enable?: boolean): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const shouldPlay = enable !== undefined ? enable : !isAmbientPlaying;

  if (!shouldPlay) {
    ambientOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    ambientOscillators = [];
    isAmbientPlaying = false;
    return false;
  }

  if (isAmbientPlaying) return true;

  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isAudioMuted ? 0 : 0.035, now + 3);
    gain.connect(ctx.destination);
    ambientGainNode = gain;

    // Soft warm chord: Fmaj7 (F3, A3, C4, E4)
    const freqs = [174.61, 220.0, 261.63, 329.63];

    ambientOscillators = freqs.map(f => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      // Low pass filter to keep it warm and non-intrusive
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      osc.connect(filter);
      filter.connect(gain);
      osc.start(now);
      return osc;
    });

    isAmbientPlaying = true;
    return true;
  } catch (e) {
    return false;
  }
}
