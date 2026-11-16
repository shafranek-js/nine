/**
 * Sound effect synthesizer supporting both the classic 1993 MS-DOS PC Speaker
 * `Sound(Hz)`/`Delay(ms)` tones (in `ega` mode) and sculpted acoustic Web Audio
 * casino sound effects (in `hd` mode).
 */
export type SoundProfile = 'hd' | 'ega';

const ASSET_BASE = ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/').replace(/\/$/, '');
const HD_DEALER_BELL_URL = `${ASSET_BASE}/assets/audio/07_dealer_bell.mp3`;
const HD_COIN_POUR_URL = `${ASSET_BASE}/assets/audio/08_coin_pour.mp3`;
const HD_COIN_HAT_URL = `${ASSET_BASE}/assets/audio/09_coin_hat.mp3`;
const HD_CARD_SPRING_URL = `${ASSET_BASE}/assets/audio/10_card_spring.mp3`;
const HD_CARD_DEAL_URL = `${ASSET_BASE}/assets/audio/11_card_deal.mp3`;
const HD_CARD_SLIDE_URL = `${ASSET_BASE}/assets/audio/12_card_slide.mp3`;
const HD_PRELOAD_SAMPLE_URLS = [
  HD_DEALER_BELL_URL,
  HD_COIN_POUR_URL,
  HD_COIN_HAT_URL,
  HD_CARD_SPRING_URL,
  HD_CARD_DEAL_URL,
  HD_CARD_SLIDE_URL,
] as const;

interface ModalPartial {
  readonly freqHz: number;
  readonly gain: number;
  readonly decayMs: number;
}

export class PcSpeaker {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.12;
  private soundProfile: SoundProfile = 'hd';
  private cachedNoiseCtx: AudioContext | null = null;
  private cachedNoiseBuffer: AudioBuffer | null = null;
  private sampleBuffersCtx: AudioContext | null = null;
  private sampleBuffers = new Map<string, AudioBuffer>();
  private sampleLoading = new Map<string, Promise<AudioBuffer | null>>();

  attachContext(ctx: AudioContext): void {
    if (this.ctx !== ctx) {
      this.sampleBuffers.clear();
      this.sampleLoading.clear();
      this.sampleBuffersCtx = null;
    }
    this.ctx = ctx;
    for (const url of HD_PRELOAD_SAMPLE_URLS) {
      void this.loadSampleBuffer(ctx, url);
    }
  }

  private getSampleBuffer(url: string): AudioBuffer | null {
    if (!this.ctx || this.sampleBuffersCtx !== this.ctx) return null;
    return this.sampleBuffers.get(url) ?? null;
  }

  private async loadSampleBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer | null> {
    if (
      typeof window === 'undefined' ||
      typeof fetch !== 'function' ||
      typeof ctx.decodeAudioData !== 'function'
    ) {
      return null;
    }
    if (this.sampleBuffersCtx === ctx) {
      const cached = this.sampleBuffers.get(url);
      if (cached) return cached;
    }
    const inflight = this.sampleLoading.get(url);
    if (inflight) {
      return inflight;
    }
    let promise!: Promise<AudioBuffer | null>;
    promise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const arr = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arr);
        if (this.ctx === ctx) {
          this.sampleBuffersCtx = ctx;
          this.sampleBuffers.set(url, decoded);
        }
        return decoded;
      } catch {
        return null;
      } finally {
        if (this.sampleLoading.get(url) === promise) {
          this.sampleLoading.delete(url);
        }
      }
    })();
    this.sampleLoading.set(url, promise);
    return promise;
  }

  private playSample(buffer: AudioBuffer, gainValue: number, delayOffsetSec = 0): boolean {
    const ctx = this.ensureResumed();
    if (!ctx || typeof ctx.createBufferSource !== 'function') return false;
    const start = ctx.currentTime + delayOffsetSec;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainValue, start);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    return true;
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

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (typeof ctx.createBuffer !== 'function' || typeof ctx.createBufferSource !== 'function') {
      return null;
    }
    if (this.cachedNoiseCtx === ctx && this.cachedNoiseBuffer) {
      return this.cachedNoiseBuffer;
    }
    const sampleRate = ctx.sampleRate || 44100;
    const length = Math.max(1, Math.floor(sampleRate * 0.25));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const ch = buffer.getChannelData(0);
    // Deterministic PRNG white noise so repeated card/wood transients need zero allocations
    let seed = 0x13579bdf;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      ch[i] = (seed / 0xffffffff) * 2 - 1;
    }
    this.cachedNoiseCtx = ctx;
    this.cachedNoiseBuffer = buffer;
    return buffer;
  }

  private playNoiseBurst(
    centerHz: number,
    q: number,
    filterType: BiquadFilterType,
    durationMs: number,
    peakGain: number,
    delayOffsetSec = 0,
    attackMs = 2,
  ): void {
    const ctx = this.ensureResumed();
    if (!ctx) return;
    const buffer = this.getNoiseBuffer(ctx);
    if (!buffer) return;

    const start = ctx.currentTime + delayOffsetSec;
    const dur = Math.max(0.008, durationMs / 1000);
    const attack = Math.min(dur * 0.45, Math.max(0.001, attackMs / 1000));

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(centerHz, start);
    filter.Q.setValueAtTime(q, start);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    src.stop(start + dur + 0.01);
  }

  private playBodyThump(
    startHz: number,
    endHz: number,
    durationMs: number,
    cutoffHz: number,
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
    filter.frequency.setValueAtTime(cutoffHz, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  private playModalBell(partials: readonly ModalPartial[], delayOffsetSec = 0): void {
    const ctx = this.ensureResumed();
    if (!ctx) return;

    const start = ctx.currentTime + delayOffsetSec;
    for (const part of partials) {
      const dur = Math.max(0.02, part.decayMs / 1000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(part.freqHz, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(part.gain, start + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    }
  }

  private playWarmVoice(
    freqHz: number,
    durationMs: number,
    peakGain: number,
    type: 'sine' | 'triangle',
    cutoffHz: number,
    delayOffsetSec = 0,
  ): void {
    const ctx = this.ensureResumed();
    if (!ctx) return;

    const start = ctx.currentTime + delayOffsetSec;
    const dur = Math.max(0.025, durationMs / 1000);
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqHz, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.012);
  }

  /** `$20` gold coin / casino chip clink */
  coinChime(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(6000, 8);
      return;
    }
    // Crisp transient click + inharmonic brass coin partials + subtle second bounce
    this.playNoiseBurst(5200, 1.8, 'bandpass', 10, 0.04, 0, 1);
    this.playModalBell(
      [
        { freqHz: 2240, gain: 0.042, decayMs: 95 },
        { freqHz: 3560, gain: 0.028, decayMs: 75 },
        { freqHz: 5410, gain: 0.018, decayMs: 55 },
      ],
      0,
    );
    this.playModalBell(
      [
        { freqHz: 2680, gain: 0.028, decayMs: 85 },
        { freqHz: 4120, gain: 0.018, decayMs: 65 },
      ],
      0.028,
    );
  }

  /** Coin toss/clink into the dealer's hat (`09_coin_hat.mp3` in HD, triple `6000 Hz` ticks in EGA) */
  coinHatClink(delayOffsetSec = 0): void {
    if (this.soundProfile === 'ega') {
      this.playTone(6000, 5, delayOffsetSec);
      this.playTone(6000, 5, delayOffsetSec + 0.016);
      this.playTone(6000, 5, delayOffsetSec + 0.032);
      return;
    }
    const hatBuf = this.getSampleBuffer(HD_COIN_HAT_URL);
    if (hatBuf && this.playSample(hatBuf, 0.85, delayOffsetSec)) {
      return;
    }
    this.coinChime();
  }

  /** Tactile card throw / slide rustle onto green felt (`12_card_slide.mp3` in HD, `65 Hz` tick in EGA) */
  cardSlide(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(65, 14);
      return;
    }
    const slideBuf = this.getSampleBuffer(HD_CARD_SLIDE_URL);
    if (slideBuf && this.playSample(slideBuf, 0.56)) {
      return;
    }
    // Crisp paper swish over felt + warm low felt tap (fallback while sample loads)
    this.playNoiseBurst(2100, 1.1, 'bandpass', 36, 0.075, 0, 3);
    this.playBodyThump(128, 56, 26, 360, 0.075, 0.002);
  }

  /** Dealer dealing a single card (`11_card_deal.mp3` in HD, `65 Hz` tick in EGA) */
  cardDeal(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(65, 14);
      return;
    }
    const dealBuf = this.getSampleBuffer(HD_CARD_DEAL_URL);
    if (dealBuf && this.playSample(dealBuf, 0.58)) {
      return;
    }
    this.cardSlide();
  }

  /** Hand-to-hand dealer card spring (`10_card_spring.mp3` in HD, crisp DOS tick in EGA) */
  cardSpring(delayOffsetSec = 0): void {
    if (this.soundProfile === 'ega') {
      this.cardSlide();
      return;
    }
    const springBuf = this.getSampleBuffer(HD_CARD_SPRING_URL);
    if (springBuf && this.playSample(springBuf, 0.72, delayOffsetSec)) {
      return;
    }
    this.cardSlide();
  }

  private playBrassHandBell(baseHz: number, gainScale: number, decayMs: number, delayOffsetSec = 0): void {
    this.playNoiseBurst(5800, 2.2, 'bandpass', 14, 0.085 * gainScale, delayOffsetSec, 1);
    this.playModalBell(
      [
        { freqHz: baseHz, gain: 0.16 * gainScale, decayMs },
        { freqHz: baseHz * 1.498, gain: 0.11 * gainScale, decayMs: Math.round(decayMs * 0.78) },
        { freqHz: baseHz * 2.0, gain: 0.08 * gainScale, decayMs: Math.round(decayMs * 0.62) },
        { freqHz: baseHz * 2.996, gain: 0.045 * gainScale, decayMs: Math.round(decayMs * 0.38) },
      ],
      delayOffsetSec,
    );
  }

  /** Coin pour cascading to the round winner (`08_coin_pour.mp3` in HD, DOS clink in EGA) */
  coinPourPayout(delayOffsetSec = 0): void {
    if (this.soundProfile === 'ega') {
      this.coinHatClink();
      return;
    }
    const coinBuf = this.getSampleBuffer(HD_COIN_POUR_URL);
    if (coinBuf && this.playSample(coinBuf, 0.58, delayOffsetSec)) {
      return;
    }
    this.coinChime();
  }

  /** Forced pass dealer brass handbell (`220 Hz` buzz in EGA) */
  passAlert(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(220, 200);
      return;
    }
    const bellBuf = this.getSampleBuffer(HD_DEALER_BELL_URL);
    if (bellBuf && this.playSample(bellBuf, 0.55)) {
      return;
    }
    // Fallback while sample loads: synchronized double ring
    this.playBrassHandBell(1396.91, 1.0, 460, 0.14);
    this.playBrassHandBell(1479.98, 1.1, 540, 0.56);
  }

  /** Clicking an unplayable card — muted single felt rejection thud */
  illegalMove(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(220, 120);
      return;
    }
    this.playNoiseBurst(340, 1.5, 'lowpass', 24, 0.04, 0, 1);
    this.playBodyThump(145, 76, 42, 300, 0.085, 0);
  }

  /** Celebratory triad on round win (dealer handbell is reserved exclusively for idle user reminders) */
  victoryBeep(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(5000, 18);
      return;
    }
    this.playWarmVoice(587.33, 170, 0.085, 'triangle', 2200, 0.04);
    this.playWarmVoice(739.99, 190, 0.085, 'triangle', 2200, 0.11);
    this.playWarmVoice(880.0, 260, 0.095, 'sine', 2600, 0.18);
  }

  /** Dealer brass service bell reminder when human takes a long time (`NINE.EXE` `0xe97`) */
  dealerBellPing(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(5000, 10, 0);
      this.playTone(5000, 10, 0.14);
      this.playTone(5000, 10, 0.28);
      return;
    }
    const bellBuf = this.getSampleBuffer(HD_DEALER_BELL_URL);
    if (bellBuf) {
      this.playSample(bellBuf, 0.36);
    } else {
      this.playBrassHandBell(1174.66, 0.55, 340, 0);
    }
  }

  /** Full match victory golden arpeggio chord */
  matchVictory(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(5000, 18);
      return;
    }
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const delay = idx * 0.085;
      const dur = idx === notes.length - 1 ? 420 : 180;
      this.playWarmVoice(freq, dur, 0.052, 'triangle', 2500, delay);
      this.playWarmVoice(freq * 2, dur * 0.7, 0.018, 'sine', 3400, delay);
    });
    this.playModalBell(
      [
        { freqHz: 2093.0, gain: 0.032, decayMs: 340 },
        { freqHz: 3135.96, gain: 0.016, decayMs: 220 },
      ],
      0.26,
    );
  }

  /** Bankrupt / match defeat muted descending parlor chord */
  matchDefeat(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(220, 200);
      return;
    }
    this.playWarmVoice(293.66, 210, 0.06, 'triangle', 950, 0);
    this.playWarmVoice(246.94, 230, 0.06, 'triangle', 850, 0.14);
    this.playWarmVoice(196.0, 380, 0.07, 'triangle', 720, 0.28);
    this.playBodyThump(130, 62, 160, 260, 0.075, 0.28);
  }

  /** Returning from Club Menu (`F5` exit) — velvet casino closing chord in HD, `80->120->160` in EGA */
  exitSequence(): void {
    if (this.soundProfile === 'ega') {
      this.playTone(80, 250, 0);
      this.playTone(120, 250, 0.25);
      this.playTone(160, 250, 0.5);
      return;
    }
    // Smooth warm velvet chord sweep replacing the harsh 80/120/160 Hz square buzz
    this.playNoiseBurst(950, 1.0, 'bandpass', 55, 0.035, 0, 10);
    this.playWarmVoice(261.63, 220, 0.05, 'triangle', 1200, 0);
    this.playWarmVoice(329.63, 240, 0.048, 'triangle', 1400, 0.09);
    this.playWarmVoice(392.0, 320, 0.052, 'sine', 1800, 0.18);
  }
}
