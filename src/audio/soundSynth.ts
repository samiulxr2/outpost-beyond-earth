/**
 * Web Audio API Procedural Sound Synthesizer
 * Zero external audio files required. 100% offline and instant.
 */

class SoundSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playBeep(freq: number = 880, duration: number = 0.08, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy catch
    }
  }

  public playClick() {
    this.playBeep(1200, 0.03, 'triangle');
  }

  public playSuccess() {
    if (!this.enabled) return;
    this.playBeep(523.25, 0.1, 'sine'); // C5
    setTimeout(() => this.playBeep(659.25, 0.1, 'sine'), 100); // E5
    setTimeout(() => this.playBeep(783.99, 0.2, 'sine'), 200); // G5
  }

  public playWarning() {
    if (!this.enabled) return;
    this.playBeep(440, 0.15, 'sawtooth');
    setTimeout(() => this.playBeep(330, 0.2, 'sawtooth'), 150);
  }

  public playBuild() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Mechanical metallic thud: rapid descending tone + sub-bass
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);

      // High click transient
      setTimeout(() => this.playBeep(1800, 0.02, 'sine'), 10);
    } catch {
      // Audio autoplay catch
    }
  }

  public playLaunch() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Low frequency rocket engine roar with white noise modulation
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(85, this.ctx.currentTime + 1.8);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.2);
    } catch {
      // Audio catch
    }
  }

  public playAlert() {
    if (!this.enabled) return;
    this.playBeep(880, 0.12, 'sawtooth');
    setTimeout(() => this.playBeep(659, 0.12, 'sawtooth'), 130);
    setTimeout(() => this.playBeep(880, 0.12, 'sawtooth'), 260);
  }

  public playError() {
    if (!this.enabled) return;
    this.playBeep(140, 0.08, 'square');
    setTimeout(() => this.playBeep(110, 0.12, 'square'), 90);
  }

  public playThrusterBurn(duration: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Low frequency rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio error
    }
  }
}

export const sound = new SoundSynth();
