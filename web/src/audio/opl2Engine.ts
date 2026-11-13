import type { MscTrack, MscTrackId, MusEvent } from './mscParser';
import { PcSpeaker } from './pcSpeaker';

const WORKLET_CODE = `
const MULTI_TABLE = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15];
const TWO_PI = Math.PI * 2;

function rateToAttackSec(rate) {
  if (rate <= 0) return 99;
  if (rate >= 15) return 0.002;
  return 0.0025 * Math.pow(1.9, 15 - rate);
}

function rateToDecaySec(rate) {
  if (rate <= 0) return 999;
  if (rate >= 15) return 0.012;
  return 0.015 * Math.pow(1.78, 15 - rate);
}

function tlToAmp(tl) {
  return Math.pow(2, -tl / 8);
}

function sustainLevelToAmp(sl) {
  return Math.pow(10, (-3 * sl) / 20);
}

class OplOpState {
  constructor(sr) {
    this.sr = sr;
    this.phase = 0;
    this.env = 0;
    this.stage = 'off';
    this.prev1 = 0;
    this.prev2 = 0;
    this.params = { ksl:0, multi:1, feedback:0, attack:15, sustain:0, eg:1, decay:8, release:8, totalLevel:0, am:0, vib:0, ksr:0, fm:1 };
  }
  trigger(params) {
    this.params = params;
    this.phase = 0;
    this.prev1 = 0;
    this.prev2 = 0;
    this.env = 0;
    this.stage = 'attack';
  }
  releaseKey() {
    if (this.stage !== 'off') this.stage = 'release';
  }
  stepEnv(isPercussiveHoldRelease) {
    const p = this.params;
    const invSr = 1 / this.sr;
    if (this.stage === 'attack') {
      const attSec = rateToAttackSec(p.attack);
      this.env += invSr / attSec;
      if (this.env >= 1) {
        this.env = 1;
        this.stage = 'decay';
      }
    } else if (this.stage === 'decay') {
      const target = sustainLevelToAmp(p.sustain);
      const decSec = rateToDecaySec(p.decay);
      this.env -= (1 - target) * (invSr / decSec) + this.env * 0.00001;
      if (this.env <= target) {
        this.env = Math.max(0.0001, target);
        this.stage = (p.eg === 0 || isPercussiveHoldRelease) ? 'release' : 'sustain';
      }
    } else if (this.stage === 'sustain') {
      if (p.eg === 0) this.stage = 'release';
    } else if (this.stage === 'release') {
      const relSec = rateToDecaySec(p.release);
      this.env -= Math.max(0.00005, this.env * (invSr / Math.max(0.01, relSec * 0.45)));
      if (this.env <= 0.0005) {
        this.env = 0;
        this.stage = 'off';
      }
    }
    return this.env * tlToAmp(p.totalLevel);
  }
}

class OplVoice {
  constructor(sr) {
    this.sr = sr;
    this.active = false;
    this.channel = 0;
    this.note = 0;
    this.velocity = 1;
    this.chanVol = 1;
    this.pitchSemis = 0;
    this.mod = new OplOpState(sr);
    this.car = new OplOpState(sr);
    this.fm = 1;
    this.age = 0;
  }
  noteOn(channel, note, velocity, chanVol, pitchSemis, ins, age) {
    this.active = true;
    this.channel = channel;
    this.note = note;
    this.velocity = Math.max(0.05, velocity / 127);
    this.chanVol = Math.max(0, chanVol / 127);
    this.pitchSemis = pitchSemis;
    this.fm = ins.mod.fm;
    this.age = age;
    this.mod.trigger(ins.mod);
    this.car.trigger(ins.car);
  }
  noteOff() {
    this.mod.releaseKey();
    this.car.releaseKey();
  }
  sample(lfoTime) {
    if (!this.active) return 0;
    const carEnv = this.car.stepEnv(false);
    const modEnv = this.mod.stepEnv(false);
    if (this.car.stage === 'off') {
      this.active = false;
      return 0;
    }
    const baseHz = 440 * Math.pow(2, (this.note - 69 + this.pitchSemis) / 12);
    const modMult = MULTI_TABLE[this.mod.params.multi & 15];
    const carMult = MULTI_TABLE[this.car.params.multi & 15];
    const vibDepth = (this.car.params.vib || this.mod.params.vib) ? (1 + 0.004 * Math.sin(TWO_PI * 6.4 * lfoTime)) : 1;

    const modInc = (baseHz * modMult * vibDepth) / this.sr;
    const carInc = (baseHz * carMult * vibDepth) / this.sr;

    const fb = this.mod.params.feedback;
    const fbAmt = fb > 0 ? (this.mod.prev1 + this.mod.prev2) * 0.5 * (Math.PI / (1 << (8 - fb))) : 0;
    const modOut = Math.sin(TWO_PI * this.mod.phase + fbAmt) * modEnv;
    this.mod.prev2 = this.mod.prev1;
    this.mod.prev1 = modOut;

    this.mod.phase = (this.mod.phase + modInc) % 1;
    this.car.phase = (this.car.phase + carInc) % 1;

    let out = 0;
    const volScale = this.velocity * this.chanVol;
    if (this.fm === 0) {
      // Additive (con = 1)
      out = (Math.sin(TWO_PI * this.car.phase) * carEnv + modOut * 0.5) * 0.65 * volScale;
    } else {
      // 2-op FM phase modulation
      out = Math.sin(TWO_PI * this.car.phase + modOut * 3.1) * carEnv * volScale;
    }
    return out;
  }
}

class NineOpl2Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.voices = Array.from({ length: 14 }, () => new OplVoice(sampleRate));
    this.voiceCounter = 0;
    this.instruments = [];
    this.chanProgram = new Int32Array(16);
    this.chanVolume = new Int32Array(16).fill(127);
    this.chanPitch = new Float32Array(16);
    this.playing = false;
    this.events = [];
    this.eventIdx = 0;
    this.bpm = 120;
    this.tickBeat = 240;
    this.totalTicks = 1;
    this.currentTick = 0;
    this.lfoTime = 0;
    this.masterGain = 0.22;

    this.port.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'load') {
        this.instruments = msg.instruments;
        this.events = msg.events;
        this.bpm = msg.bpm || 120;
        this.tickBeat = msg.tickBeat || 240;
        this.totalTicks = Math.max(1, msg.totalTicks || 1);
        this.resetState();
        this.playing = true;
      } else if (msg.type === 'stop') {
        this.playing = false;
        this.silenceAll();
      } else if (msg.type === 'volume') {
        this.masterGain = msg.gain;
      }
    };
  }

  silenceAll() {
    for (const v of this.voices) {
      v.active = false;
      v.car.stage = 'off';
      v.mod.stage = 'off';
    }
  }

  resetState() {
    this.silenceAll();
    this.chanProgram.fill(0);
    this.chanVolume.fill(105);
    this.chanPitch.fill(0);
    this.eventIdx = 0;
    this.currentTick = 0;
  }

  allocVoice() {
    for (const v of this.voices) {
      if (!v.active) return v;
    }
    let oldest = this.voices[0];
    for (const v of this.voices) {
      if (v.age < oldest.age) oldest = v;
    }
    return oldest;
  }

  dispatchEvent(ev) {
    if (ev.type === 'program') {
      this.chanProgram[ev.channel & 15] = ev.program;
    } else if (ev.type === 'volume') {
      const ch = ev.channel & 15;
      this.chanVolume[ch] = ev.volume;
      for (const v of this.voices) {
        if (v.active && v.channel === ch) v.chanVol = Math.max(0, ev.volume / 127);
      }
    } else if (ev.type === 'pitchBend') {
      const ch = ev.channel & 15;
      const semis = ((ev.value - 8192) / 8192) * 2;
      this.chanPitch[ch] = semis;
      for (const v of this.voices) {
        if (v.active && v.channel === ch) v.pitchSemis = semis;
      }
    } else if (ev.type === 'tempo') {
      if (ev.bpm > 0) this.bpm = ev.bpm;
    } else if (ev.type === 'noteOn') {
      const ch = ev.channel & 15;
      if (!this.instruments.length) return;
      const prog = Math.max(0, Math.min(this.instruments.length - 1, this.chanProgram[ch]));
      const ins = this.instruments[prog];
      // Avoid stacking same channel+note
      for (const v of this.voices) {
        if (v.active && v.channel === ch && v.note === ev.note) v.noteOff();
      }
      const voice = this.allocVoice();
      voice.noteOn(ch, ev.note, ev.velocity, this.chanVolume[ch], this.chanPitch[ch], ins, ++this.voiceCounter);
    } else if (ev.type === 'noteOff') {
      const ch = ev.channel & 15;
      for (const v of this.voices) {
        if (v.active && v.channel === ch && v.note === ev.note) v.noteOff();
      }
    }
  }

  process(_inputs, outputs) {
    const out = outputs[0]?.[0];
    if (!out) return true;
    if (!this.playing || !this.events.length) {
      out.fill(0);
      return true;
    }

    const ticksPerSample = (this.bpm * this.tickBeat) / (60 * sampleRate);
    for (let i = 0; i < out.length; i++) {
      this.currentTick += ticksPerSample;
      this.lfoTime += 1 / sampleRate;

      while (this.eventIdx < this.events.length && this.events[this.eventIdx].tick <= this.currentTick) {
        this.dispatchEvent(this.events[this.eventIdx]);
        this.eventIdx++;
      }

      if (this.eventIdx >= this.events.length && this.currentTick >= this.totalTicks) {
        this.resetState();
      }

      let mix = 0;
      for (let v = 0; v < this.voices.length; v++) {
        if (this.voices[v].active) mix += this.voices[v].sample(this.lfoTime);
      }
      // Soft clip warm AdLib output
      const s = mix * this.masterGain;
      out[i] = s / (1 + Math.abs(s) * 0.45);
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
  private gainValue = 0.24;

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
      instruments: tr.instruments.map((ins) => ({ mod: ins.mod, car: ins.car })),
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
