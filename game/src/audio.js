// Nightvault — sounds, all synthesized with WebAudio: no audio files.
// Soft footstep ticks (alternating feet, louder at a run — criterion three
// of any good stealth game: your ears tell you where the danger walks),
// a coin's clink, a gem's chime, the alarm sting when a meter fills, and
// small jingles for a clean getaway and a bad night.

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', gain = 0.08, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, gain = 0.05, when = 0, freq = 1800) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(this.ctx.destination);
    src.start(t0);
  }

  footstep(loud, side) {
    // Your own steps: a soft tap; a guard's steps carry further and lower.
    this.noise(0.05, loud ? 0.07 : 0.028, 0, side > 0 ? 900 : 760);
  }

  guardStep() {
    this.noise(0.06, 0.02, 0, 420);
  }

  coinClink() {
    this.tone(2637, 0.09, 'sine', 0.06);
    this.tone(3520, 0.14, 'sine', 0.045, 0.03);
    this.noise(0.03, 0.03, 0, 3200);
  }

  gem() {
    this.tone(1319, 0.1, 'triangle', 0.06);
    this.tone(1976, 0.18, 'triangle', 0.05, 0.07);
  }

  alarm() {
    this.tone(392, 0.16, 'square', 0.05, 0, 587);
    this.tone(392, 0.16, 'square', 0.05, 0.14, 587);
  }

  suspicious() {
    this.tone(660, 0.07, 'sine', 0.03, 0, 880);
  }

  caught() {
    this.tone(330, 0.35, 'sawtooth', 0.06, 0, 82);
    this.noise(0.25, 0.05, 0, 500);
  }

  getaway() {
    for (const [i, f] of [523, 659, 784, 1047].entries()) {
      this.tone(f, 0.16, 'triangle', 0.055, i * 0.09);
    }
  }
}
