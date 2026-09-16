export class TypewriterAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  muted = false;
  enabled = true;

  unlock(): void {
    if (!this.ctx) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.7;
      const convolver = ctx.createConvolver();
      convolver.buffer = this.makeIR(ctx);
      const wet = ctx.createGain();
      wet.gain.value = 0.18;
      const dry = ctx.createGain();
      dry.gain.value = 0.9;
      master.connect(dry).connect(ctx.destination);
      master.connect(convolver).connect(wet).connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      this.noise = this.makeNoise(ctx, 1);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.7;
  }

  private get now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  private out(): GainNode | null {
    if (!this.enabled || this.muted) return null;
    return this.master;
  }

  strike(barIndex: number): void {
    const out = this.out();
    const ctx = this.ctx;
    if (!out || !ctx || !this.noise) return;
    const t = this.now;
    const pitch = 1 + (barIndex % 12) * 0.012;

    this.click(ctx, out, t, 0.9 * pitch, 0.012);
    this.thump(ctx, out, t, 90 * pitch, 0.05);
    this.noiseBurst(ctx, out, t, 1800 * pitch, 0.04, 0.22);
    this.noiseBurst(ctx, out, t + 0.006, 420, 0.08, 0.12);
    this.ring(ctx, out, t, 1850 * pitch, 0.09);
  }

  keyDown(): void {
    const out = this.out();
    const ctx = this.ctx;
    if (!out || !ctx) return;
    this.click(ctx, out, this.now, 0.55, 0.008);
  }

  space(): void {
    const out = this.out();
    const ctx = this.ctx;
    if (!out || !ctx || !this.noise) return;
    const t = this.now;
    this.thump(ctx, out, t, 70, 0.07);
    this.noiseBurst(ctx, out, t, 300, 0.07, 0.16);
  }

  bell(): void {
    const out = this.out();
    const ctx = this.ctx;
    if (!out || !ctx) return;
    const t = this.now;
    this.ding(ctx, out, t, 2489, 0.22, 1.3);
    this.ding(ctx, out, t, 3729, 0.12, 1.1);
    this.ding(ctx, out, t + 0.012, 4960, 0.05, 0.7);
  }

  carriageReturn(duration: number): void {
    const out = this.out();
    const ctx = this.ctx;
    if (!out || !ctx || !this.noise) return;
    const t = this.now;
    this.thump(ctx, out, t, 60, 0.08);
    this.noiseBurst(ctx, out, t + 0.02, 500, duration * 0.85, 0.2);
    const clicks = Math.floor(duration * 18);
    for (let i = 0; i < clicks; i++) {
      this.click(ctx, out, t + 0.04 + i * (duration / clicks), 0.25, 0.006);
    }
    this.thump(ctx, out, t + duration * 0.92, 75, 0.1);
  }

  shift(): void {
    const out = this.out();
    const ctx = this.ctx;
    if (!out || !ctx) return;
    this.thump(ctx, out, this.now, 110, 0.06);
    this.click(ctx, out, this.now, 0.4, 0.01);
  }

  paper(): void {
    const out = this.out();
    const ctx = this.ctx;
    if (!out || !ctx || !this.noise) return;
    this.noiseBurst(ctx, out, this.now, 900, 0.25, 0.1);
  }

  private click(
    ctx: AudioContext,
    out: GainNode,
    t: number,
    gain: number,
    dur: number,
  ): void {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(1400 + Math.random() * 400, t);
    o.frequency.exponentialRampToValueAtTime(240, t + dur);
    g.gain.setValueAtTime(gain * 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private thump(
    ctx: AudioContext,
    out: GainNode,
    t: number,
    freq: number,
    dur: number,
  ): void {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.45, t + dur);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private ring(
    ctx: AudioContext,
    out: GainNode,
    t: number,
    freq: number,
    gain: number,
  ): void {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.14);
  }

  private ding(
    ctx: AudioContext,
    out: GainNode,
    t: number,
    freq: number,
    gain: number,
    decay: number,
  ): void {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  }

  private noiseBurst(
    ctx: AudioContext,
    out: GainNode,
    t: number,
    freq: number,
    dur: number,
    gain: number,
  ): void {
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private makeIR(ctx: AudioContext): AudioBuffer {
    const n = Math.floor(ctx.sampleRate * 0.32);
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.4 * 0.45;
      }
    }
    return buf;
  }
}
