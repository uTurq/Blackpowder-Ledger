export type SoundKind = "click" | "shot" | "reload";

let context: AudioContext | null = null;

/** Small synthesized mechanical cues; silently does nothing without Web Audio. */
export function playSound(kind: SoundKind) {
  try {
    context ??= new AudioContext();
    const ctx = context;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    if (kind === "shot") {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.16, ctx.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        gain = ctx.createGain();
      filter.type = "lowpass";
      filter.frequency.value = 980;
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      source.buffer = buffer;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(now);
      return;
    }
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(kind === "reload" ? 170 : 330, now);
    osc.frequency.exponentialRampToValueAtTime(kind === "reload" ? 410 : 190, now + 0.07);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {}
}
