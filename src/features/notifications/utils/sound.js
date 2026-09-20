/**
 * High-fidelity notification chime using the browser's Web Audio API.
 * Synthesizes a distinctive two-tone harmonic chime inspired by modern enterprise collaboration apps (e.g. Teams/Slack).
 * Instantaneous, offline-capable, and zero network latency.
 */
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  } else if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playNotificationChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.36);

    // Second tone (A5 - 880 Hz) - staggered by 65ms for a modern two-tone chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.065);

    gain2.gain.setValueAtTime(0.0001, now + 0.065);
    gain2.gain.exponentialRampToValueAtTime(0.28, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.065);
    osc2.stop(now + 0.5);
  } catch (error) {
    // Silently handle any browser autoplay restrictions
    console.debug("Notification audio playback prevented:", error);
  }
};
