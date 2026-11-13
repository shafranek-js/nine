/**
 * Sound effect synthesizer supporting both the classic 1993 MS-DOS PC Speaker
 * `Sound(Hz)`/`Delay(ms)` tones (in `ega` mode) and soft, tactile Web Audio
 * casino sound effects (in `hd` mode).
 */
export type SoundProfile = 'hd' | 'ega';

export class PcSpeaker {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.12;
  private soundProfile: SoundProfile = 'hd';

  attachContext(ctx: AudioContext): void {
    this.ctx = ctx;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setSoundProfile(profile: SoundProfile): void {
    this.soundProfile = profile;
  }

  getSoundProfile(): SoundProfile {
    return this.soundProfile;
  }

  playTone(freqHz: number, durationMs: number, delayOffsetSec = 0): void {
    if (!this.enabled || !this.ctx || freqHz <= 0 || durationMs <= 0) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const start = this.ctx.currentTime + delayOffsetSec;
    const dur = Math.max(0.004, durationMs / 1000);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    // Guard browsers against extreme ultra-low/inaudible 20 Hz aliasing while keeping punch
    osc.frequency.setValueAtTime(freqHz, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(this.volume, start + 0.001);
    gain.gain.setValueAtTime(this.volume, start + Math.max(0.002, dur - 0.003));
    gain.gain.linearRampToValueAtTime(0.0001, start + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.002);
  }

  private ensureResumed(): AudioContext | null {
    if (!this.enabled || !this.ctx) return null;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playSoftTap(
    startHz: number,
    endHz: number,
    durationMs: number,
    peakGain: number,
    delayOffsetSec = 0,
  ): void {
    const ctx = this.ensureResumed();
    if (!ctx) return;

    const start = ctx.currentTime + delayOffsetSec;
    const dur = Math.max(0.015, durationMs / 1000);
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startHz, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endHz), start + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  private playWarmTone(
    freqHz: number,
    durationMs: number,
    peakGain: number,
    cutoffHz: number,
    delayOffsetSec = 0,
  ): void {
    const ctx = this.ensureResumed();
    if (!ctx) return;

    const start = ctx.currentTime + delayOffsetSec;
    const dur = Math.max(0.02, durationMs / 1000);
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqHz, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  /** `$20` chip / coin clink */
  coinChime(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(6000, 8);
      return;
    }
    this.playWarmTone(2150, 75, 0.045, 3600, 0);
    this.playWarmTone(3220, 90, 0.032, 4600, 0.024);
  }

  /** Subtle card placement / deal felt snap */
  cardSlide(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(65, 14);
      return;
    }
    this.playSoftTap(135, 62, 30, 0.085, 0);
  }

  /** Forced pass / error notice — soft wooden table knock in HD, `220 Hz` DOS buzz in EGA */
  passAlert(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(220, 200);
      return;
    }
    this.playSoftTap(155, 84, 52, 0.13, 0);
    this.playSoftTap(132, 72, 60, 0.095, 0.085);
  }

  /** Clicking an unplayable card in hand — light single wooden tap in HD */
  illegalMove(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(220, 120);
      return;
    }
    this.playSoftTap(190, 95, 42, 0.075, 0);
  }

  /** Victory / round pot won chime */
  victoryBeep(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(5000, 18);
      return;
    }
    this.playWarmTone(523.25, 120, 0.06, 2600, 0);
    this.playWarmTone(659.25, 135, 0.06, 2600, 0.07);
    this.playWarmTone(783.99, 210, 0.065, 2800, 0.14);
  }

  /** `Sound(80 -> 120 -> 160)` × 250ms — F5 Exit sound */
  exitSequence(): void {
    this.playTone(80, 250, 0);
    this.playTone(120, 250, 0.25);
    this.playTone(160, 250, 0.5);
  }
}
