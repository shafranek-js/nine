import type { MscTrack, MscTrackId, MusEvent } from './mscParser';
import { PcSpeaker } from './pcSpeaker';
import { YM3812_CORE_SOURCE } from './ym3812Core';

const WORKLET_CODE = `
${YM3812_CORE_SOURCE}

class NineOpl2Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sequencer = new AdlibMusSequencer(sampleRate);
    this.masterGain = 0.72;
    this.port.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === 'load') {
        this.sequencer.loadTrack(msg);
      } else if (msg.type === 'stop') {
        this.sequencer.stop();
      } else if (msg.type === 'volume') {
        this.masterGain = typeof msg.gain === 'number' ? msg.gain : 0.72;
      }
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0]?.[0];
    if (!out) return true;
    this.sequencer.processBlock(out);
    const gain = this.masterGain;
    if (gain !== 1) {
      for (let i = 0; i < out.length; i++) {
        out[i] *= gain;
      }
    }
    return true;
  }
}

registerProcessor('nine-opl2-processor', NineOpl2Processor);
`;

export class Opl2MusicEngine {
  private ctx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private initPromise: Promise<void> | null = null;
  private tracks: Record<MscTrackId, MscTrack> | null = null;
  private enabled = true;
  private currentTrack: MscTrackId | null = null;
  private pendingTrack: MscTrackId | null = null;
  private gainValue = 0.72;

  // Fallback timer-driven synth when AudioWorklet is unavailable
  private fallbackTimer: number | null = null;
  private fallbackStartMs = 0;
  private fallbackEventIdx = 0;

  setTracks(tracks: Record<MscTrackId, MscTrack>): void {
    this.tracks = tracks;
    if (this.pendingTrack && this.enabled) {
      const id = this.pendingTrack;
      this.pendingTrack = null;
      this.play(id);
    }
  }

  async ensureInitialized(ctx: AudioContext): Promise<void> {
    this.ctx = ctx;
    if (this.workletNode) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!ctx.audioWorklet) return;
      try {
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        try {
          await ctx.audioWorklet.addModule(url);
        } finally {
          URL.revokeObjectURL(url);
        }
        const node = new AudioWorkletNode(ctx, 'nine-opl2-processor', {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        });
        node.connect(ctx.destination);
        node.port.postMessage({ type: 'volume', gain: this.gainValue });
        this.workletNode = node;

        if (this.enabled && (this.pendingTrack || this.currentTrack)) {
          const target = this.pendingTrack ?? this.currentTrack;
          this.pendingTrack = null;
          if (target) this.startWorkletTrack(target);
        }
      } catch {
        // Leave workletNode null; fallback scheduler handles playback cleanly.
      }
    })();

    return this.initPromise;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopPlaybackOnly();
    } else if (this.currentTrack) {
      this.play(this.currentTrack);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getCurrentTrack(): MscTrackId | null {
    return this.currentTrack;
  }

  play(trackId: MscTrackId): void {
    this.currentTrack = trackId;
    if (!this.enabled) return;
    if (!this.tracks) {
      this.pendingTrack = trackId;
      return;
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    if (this.workletNode) {
      this.stopFallback();
      this.startWorkletTrack(trackId);
    } else {
      this.pendingTrack = trackId;
      if (this.ctx && !this.ctx.audioWorklet) {
        this.startFallbackTrack(trackId);
      }
    }
  }

  stop(): void {
    this.currentTrack = null;
    this.pendingTrack = null;
    this.stopPlaybackOnly();
  }

  private stopPlaybackOnly(): void {
    this.workletNode?.port.postMessage({ type: 'stop' });
    this.stopFallback();
  }

  private startWorkletTrack(trackId: MscTrackId): void {
    if (!this.tracks || !this.workletNode) return;
    const tr = this.tracks[trackId];
    this.workletNode.port.postMessage({
      type: 'load',
      bpm: tr.bpm,
      tickBeat: tr.tickBeat,
      totalTicks: tr.totalTicks,
      percussionMode: tr.percussionMode,
      pitchBendRange: tr.pitchBendRange,
      instruments: tr.instruments.map((ins) => ({
        mod: ins.mod,
        car: ins.car,
        modWave: ins.modWave,
        carWave: ins.carWave,
      })),
      events: tr.events,
    });
  }

  private stopFallback(): void {
    if (this.fallbackTimer !== null) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private startFallbackTrack(trackId: MscTrackId): void {
    this.stopFallback();
    if (!this.ctx || !this.tracks) return;
    const track = this.tracks[trackId];
    this.fallbackStartMs = performance.now();
    this.fallbackEventIdx = 0;

    this.fallbackTimer = window.setInterval(() => {
      if (!this.ctx || !this.enabled) return;
      const elapsedSec = (performance.now() - this.fallbackStartMs) / 1000;
      const curTick = (elapsedSec * track.bpm * track.tickBeat) / 60;
      while (this.fallbackEventIdx < track.events.length && track.events[this.fallbackEventIdx].tick <= curTick) {
        const ev = track.events[this.fallbackEventIdx++];
        if (ev.type === 'noteOn') {
          this.triggerFallbackNote(ev);
        }
      }
      if (this.fallbackEventIdx >= track.events.length && curTick >= track.totalTicks) {
        this.fallbackStartMs = performance.now();
        this.fallbackEventIdx = 0;
      }
    }, 25);
  }

  private triggerFallbackNote(ev: Extract<MusEvent, { type: 'noteOn' }>): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freq = 440 * Math.pow(2, (ev.note - 69) / 12);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    const peak = Math.max(0.01, (ev.velocity / 127) * 0.08);
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export interface AudioController {
  readonly context: AudioContext | null;
  readonly sfx: PcSpeaker;
  readonly music: Opl2MusicEngine;
  unlock(): Promise<void>;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  isUnlocked(): boolean;
}

export function createAudioController(): AudioController {
  const sfx = new PcSpeaker();
  const music = new Opl2MusicEngine();
  let ctx: AudioContext | null = null;
  let enabled = true;
  let unlocked = false;

  const ensureContext = async (): Promise<void> => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      sfx.attachContext(ctx);
      await music.ensureInitialized(ctx);
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    unlocked = ctx.state === 'running';
  };

  return {
    get context() {
      return ctx;
    },
    sfx,
    music,
    async unlock(): Promise<void> {
      try {
        await ensureContext();
      } catch {
        // Safe to retry on next user gesture
      }
    },
    setEnabled(next: boolean): void {
      enabled = next;
      sfx.setEnabled(next);
      music.setEnabled(next);
    },
    isEnabled(): boolean {
      return enabled;
    },
    isUnlocked(): boolean {
      return unlocked && ctx?.state === 'running';
    },
  };
}
