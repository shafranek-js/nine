/**
 * PC Speaker sound effect synthesizer reproducing Turbo Pascal `Sound(Hz)` /
 * `Delay(ms)` / `NoSound` calls found in `NINE_MAIN_CODE.asm`.
 */
export class PcSpeaker {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.12;

  attachContext(ctx: AudioContext): void {
    this.ctx = ctx;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
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

  /** `Sound(6000); Delay(5); NoSound` — $20 chip / coin clink */
  coinChime(): void {
    this.playTone(6000, 8);
  }

  /** `Sound(20)` — subtle card placement/deal thud */
  cardSlide(): void {
    this.playTone(65, 14);
  }

  /** `Sound(220); Delay(200); NoSound` — illegal move / pass alert */
  passAlert(): void {
    this.playTone(220, 200);
  }

  /** `Sound(5000)` — victory / reward beep */
  victoryBeep(): void {
    this.playTone(5000, 18);
  }

  /** `Sound(80 -> 120 -> 160)` × 250ms — F5 Exit sound */
  exitSequence(): void {
    this.playTone(80, 250, 0);
    this.playTone(120, 250, 0.25);
    this.playTone(160, 250, 0.5);
  }
}
