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

export type MusicSourceMode = 'mp3' | 'adlib';
export type Mp3StingerId = 'victory' | 'bankrupt' | 'welcome';
export const TABLE_MP3_TRACK_IDS = [
  'table_03',
  'table_04',
  'table_05',
  'table_06',
  'table_07',
  'table_08',
  'table_09',
  'table_10',
  'table_11',
  'table_12',
] as const;
export type TableMp3TrackId = (typeof TABLE_MP3_TRACK_IDS)[number];
type Mp3CueId = Exclude<MscTrackId, 'table'> | TableMp3TrackId | Mp3StingerId;

const ASSET_BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
const MP3_TRACK_URLS: Record<Mp3CueId, string> = {
  intro: `${ASSET_BASE}/assets/audio/01_intro_fanfare.mp3`,
  menu: `${ASSET_BASE}/assets/audio/02_club_menu_piano.mp3`,
  table_03: `${ASSET_BASE}/assets/audio/03_card_table_theme.mp3`,
  table_04: `${ASSET_BASE}/assets/audio/04_card_table_theme.mp3`,
  table_05: `${ASSET_BASE}/assets/audio/05_card_table_theme.mp3`,
  table_06: `${ASSET_BASE}/assets/audio/06_card_table_theme.mp3`,
  table_07: `${ASSET_BASE}/assets/audio/07_card_table_theme.mp3`,
  table_08: `${ASSET_BASE}/assets/audio/08_card_table_theme.mp3`,
  table_09: `${ASSET_BASE}/assets/audio/09_card_table_theme.mp3`,
  table_10: `${ASSET_BASE}/assets/audio/10_card_table_theme.mp3`,
  table_11: `${ASSET_BASE}/assets/audio/11_card_table_theme.mp3`,
  table_12: `${ASSET_BASE}/assets/audio/12_card_table_theme.mp3`,
  victory: `${ASSET_BASE}/assets/audio/04_victory_fanfare.mp3`,
  bankrupt: `${ASSET_BASE}/assets/audio/05_bankrupt_coda.mp3`,
  welcome: `${ASSET_BASE}/assets/audio/06_dealer_welcome.mp3`,
};
const MP3_PRELOAD_ORDER: readonly Mp3CueId[] = ['intro', 'welcome', 'menu', 'victory', 'bankrupt'];

/** Fisher–Yates shuffle helper for a fresh non-repeating table track bag. */
export function buildShuffledTableBag(
  lastPlayed: TableMp3TrackId | null,
  rand: () => number = Math.random,
): TableMp3TrackId[] {
  const bag: TableMp3TrackId[] = [...TABLE_MP3_TRACK_IDS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  // Bag is consumed via pop(), so avoid matching lastPlayed at the tail (first popped element).
  if (lastPlayed && bag.length > 1 && bag[bag.length - 1] === lastPlayed) {
    [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
  }
  return bag;
}

export class Opl2MusicEngine {
  private ctx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private initPromise: Promise<void> | null = null;
  private tracks: Record<MscTrackId, MscTrack> | null = null;
  private enabled = true;
  private musicMode: MusicSourceMode = 'mp3';
  private currentTrack: MscTrackId | null = null;
  private pendingTrack: MscTrackId | null = null;
  private gainValue = 0.72;
  private playSerial = 0;
  private stingerSerial = 0;

  private mp3Gain: GainNode | null = null;
  private mp3Source: AudioBufferSourceNode | null = null;
  private mp3TrackGain: GainNode | null = null;
  private fadingOutTracks = new Set<{ src: AudioBufferSourceNode; gain: GainNode; timer: number }>();
  private tableShuffleBag: TableMp3TrackId[] = [];
  private activeTableCue: TableMp3TrackId | null = null;
  private activeOpl2Track: MscTrackId | null = null;
  private mp3StingerSource: AudioBufferSourceNode | null = null;
  private mp3StingerGain: GainNode | null = null;
  private stingerFadeTimer: number | null = null;
  private mp3Buffers = new Map<Mp3CueId, AudioBuffer>();
  private mp3Loads = new Map<Mp3CueId, Promise<AudioBuffer | null>>();

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

  setMusicMode(mode: MusicSourceMode): void {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    if (!this.enabled) return;
    const active = this.currentTrack ?? this.pendingTrack;
    if (active) {
      this.play(active);
    }
  }

  getMusicMode(): MusicSourceMode {
    return this.musicMode;
  }

  async ensureInitialized(ctx: AudioContext): Promise<void> {
    this.ctx = ctx;
    if (!this.mp3Gain) {
      const g = ctx.createGain();
      g.gain.value = 0.55;
      g.connect(ctx.destination);
      this.mp3Gain = g;
    }
    if (this.musicMode === 'mp3') {
      void this.loadMp3Buffer('intro');
    }
    if (this.workletNode) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (ctx.audioWorklet) {
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
        } catch {
          // Leave workletNode null; fallback scheduler handles playback cleanly.
        }
      }

      if (this.enabled && (this.pendingTrack || this.currentTrack)) {
        const target = this.pendingTrack ?? this.currentTrack;
        this.pendingTrack = null;
        if (target) this.play(target);
      }
    })();

    return this.initPromise;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      ++this.playSerial;
      ++this.stingerSerial;
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

  getActiveTableCue(): TableMp3TrackId | null {
    return this.activeTableCue;
  }

  private ensureTableBag(): TableMp3TrackId[] {
    if (this.tableShuffleBag.length === 0) {
      this.tableShuffleBag = buildShuffledTableBag(this.activeTableCue);
    }
    return this.tableShuffleBag;
  }

  private takeNextTableCue(): TableMp3TrackId {
    const bag = this.ensureTableBag();
    const next = bag.pop() ?? 'table_03';
    this.activeTableCue = next;
    return next;
  }

  private peekNextTableCue(): TableMp3TrackId {
    const bag = this.ensureTableBag();
    return bag[bag.length - 1] ?? 'table_03';
  }

  /** Advance to a fresh shuffled card-table MP3 theme with smooth fade-out -> fade-in crossfade. */
  playNextTableTrack(): void {
    this.takeNextTableCue();
    this.play('table');
  }

  play(trackId: MscTrackId): void {
    this.currentTrack = trackId;
    const serial = ++this.playSerial;
    if (!this.enabled) return;

    if (!this.ctx) {
      this.pendingTrack = trackId;
      return;
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    if (this.musicMode === 'mp3') {
      this.stopOpl2Only();
      this.fadeOutStinger(900);
      const cueId: Mp3CueId =
        trackId === 'table' ? (this.activeTableCue ?? this.takeNextTableCue()) : trackId;
      void this.startMp3Track(trackId, cueId, serial);
      return;
    }

    this.stopMp3Source();
    this.stopStingerSource();
    // Avoid restarting the single AdLib 'table' loop mid-match when changing rounds.
    if (trackId === 'table' && this.activeOpl2Track === 'table') {
      return;
    }
    this.startOpl2Track(trackId);
  }

  /**
   * Play a one-shot MP3 stinger when Music mode is 'mp3', falling back cleanly
   * to the synthesized PC-speaker/SFX cue if muted/OPL2 or if decode fails.
   */
  playStinger(stingerId: Mp3StingerId, onFallback?: () => void): void {
    const serial = ++this.stingerSerial;
    if (!this.enabled) return;

    if (this.musicMode !== 'mp3' || !this.ctx) {
      onFallback?.();
      return;
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    void this.startMp3Stinger(stingerId, serial, onFallback);
  }

  stop(): void {
    ++this.playSerial;
    ++this.stingerSerial;
    this.currentTrack = null;
    this.pendingTrack = null;
    this.stopPlaybackOnly();
  }

  private stopMp3Source(): void {
    for (const item of this.fadingOutTracks) {
      window.clearTimeout(item.timer);
      try {
        item.src.onended = null;
        item.src.stop();
      } catch {
        // Ignore already-stopped source
      }
      item.src.disconnect();
      item.gain.disconnect();
    }
    this.fadingOutTracks.clear();

    if (this.mp3Source) {
      try {
        this.mp3Source.onended = null;
        this.mp3Source.stop();
      } catch {
        // Ignore already-stopped source
      }
      this.mp3Source.disconnect();
      this.mp3Source = null;
    }
    if (this.mp3TrackGain) {
      this.mp3TrackGain.disconnect();
      this.mp3TrackGain = null;
    }
  }

  private fadeOutActiveMp3Track(durationMs: number): boolean {
    if (!this.ctx || !this.mp3Source || !this.mp3TrackGain) return false;
    const src = this.mp3Source;
    const gain = this.mp3TrackGain;
    src.onended = null;
    this.mp3Source = null;
    this.mp3TrackGain = null;

    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);

    const entry = {
      src,
      gain,
      timer: window.setTimeout(() => {
        this.fadingOutTracks.delete(entry);
        try {
          src.stop();
        } catch {
          // Ignore already-stopped source
        }
        src.disconnect();
        gain.disconnect();
      }, durationMs + 40),
    };
    this.fadingOutTracks.add(entry);
    return true;
  }

  private clearStingerFadeTimer(): void {
    if (this.stingerFadeTimer !== null) {
      window.clearTimeout(this.stingerFadeTimer);
      this.stingerFadeTimer = null;
    }
  }

  private stopStingerSource(): void {
    this.clearStingerFadeTimer();
    if (this.mp3StingerSource) {
      try {
        this.mp3StingerSource.onended = null;
        this.mp3StingerSource.stop();
      } catch {
        // Ignore already-stopped source
      }
      this.mp3StingerSource.disconnect();
      this.mp3StingerSource = null;
    }
    if (this.mp3StingerGain) {
      this.mp3StingerGain.disconnect();
      this.mp3StingerGain = null;
    }
  }

  private fadeOutStinger(durationMs: number): void {
    if (!this.ctx || !this.mp3StingerSource || !this.mp3StingerGain) return;
    this.clearStingerFadeTimer();
    const now = this.ctx.currentTime;
    const gainParam = this.mp3StingerGain.gain;
    gainParam.cancelScheduledValues(now);
    gainParam.setValueAtTime(gainParam.value, now);
    gainParam.linearRampToValueAtTime(0, now + durationMs / 1000);
    const activeSrc = this.mp3StingerSource;
    this.stingerFadeTimer = window.setTimeout(() => {
      this.stingerFadeTimer = null;
      if (this.mp3StingerSource === activeSrc) {
        this.stopStingerSource();
      }
    }, durationMs + 30);
  }

  private stopOpl2Only(): void {
    this.activeOpl2Track = null;
    this.workletNode?.port.postMessage({ type: 'stop' });
    this.stopFallback();
  }

  private stopPlaybackOnly(): void {
    this.stopMp3Source();
    this.stopStingerSource();
    this.stopOpl2Only();
  }

  private startOpl2Track(trackId: MscTrackId): void {
    if (!this.tracks) {
      this.pendingTrack = trackId;
      return;
    }
    this.activeOpl2Track = trackId;
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

  private loadMp3Buffer(cueId: Mp3CueId): Promise<AudioBuffer | null> {
    const cached = this.mp3Buffers.get(cueId);
    if (cached) return Promise.resolve(cached);
    const inflight = this.mp3Loads.get(cueId);
    if (inflight) return inflight;

    const p = (async () => {
      if (!this.ctx) return null;
      try {
        const res = await fetch(MP3_TRACK_URLS[cueId]);
        if (!res.ok) return null;
        const arr = await res.arrayBuffer();
        const decoded = await this.ctx.decodeAudioData(arr);
        this.mp3Buffers.set(cueId, decoded);
        return decoded;
      } catch {
        return null;
      } finally {
        this.mp3Loads.delete(cueId);
      }
    })();
    this.mp3Loads.set(cueId, p);
    return p;
  }

  private async startMp3Stinger(
    stingerId: Mp3StingerId,
    serial: number,
    onFallback?: () => void,
  ): Promise<void> {
    const buf = await this.loadMp3Buffer(stingerId);
    if (serial !== this.stingerSerial || !this.enabled || this.musicMode !== 'mp3') {
      return;
    }
    if (!buf || !this.ctx || !this.mp3Gain) {
      onFallback?.();
      return;
    }
    this.stopStingerSource();
    const stingerGain = this.ctx.createGain();
    stingerGain.gain.value = 1;
    stingerGain.connect(this.mp3Gain);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = false;
    src.connect(stingerGain);
    src.onended = () => {
      if (this.mp3StingerSource === src) {
        this.stopStingerSource();
      }
    };
    src.start(0);
    this.mp3StingerSource = src;
    this.mp3StingerGain = stingerGain;
  }

  private async startMp3Track(trackId: MscTrackId, cueId: Mp3CueId, serial: number): Promise<void> {
    const buf = await this.loadMp3Buffer(cueId);
    if (
      serial !== this.playSerial ||
      !this.enabled ||
      this.currentTrack !== trackId ||
      this.musicMode !== 'mp3'
    ) {
      return;
    }
    if (!buf || !this.ctx || !this.mp3Gain) {
      this.stopMp3Source();
      this.startOpl2Track(trackId);
      return;
    }

    const isTableTrack = trackId === 'table';
    const hadActive = isTableTrack ? this.fadeOutActiveMp3Track(1500) : false;
    if (!isTableTrack) {
      this.stopMp3Source();
    }

    const trackGain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    if (isTableTrack) {
      const fadeInSec = hadActive ? 0.9 : 0.45;
      trackGain.gain.setValueAtTime(0.001, now);
      trackGain.gain.linearRampToValueAtTime(1, now + fadeInSec);
    } else {
      trackGain.gain.setValueAtTime(1, now);
    }
    trackGain.connect(this.mp3Gain);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = !isTableTrack;
    src.connect(trackGain);
    if (isTableTrack) {
      src.onended = () => {
        if (
          this.mp3Source === src &&
          this.enabled &&
          this.musicMode === 'mp3' &&
          this.currentTrack === 'table'
        ) {
          this.mp3Source = null;
          this.mp3TrackGain?.disconnect();
          this.mp3TrackGain = null;
          this.playNextTableTrack();
        }
      };
    }
    src.start(0);
    this.mp3Source = src;
    this.mp3TrackGain = trackGain;

    // Warm remaining UI/stinger cues & only the next queued table track to cap decoded PCM memory.
    for (const nextId of MP3_PRELOAD_ORDER) {
      if (nextId !== cueId && !this.mp3Buffers.has(nextId)) {
        void this.loadMp3Buffer(nextId);
      }
    }
    if (isTableTrack) {
      const upcoming = this.peekNextTableCue();
      for (const cachedKey of Array.from(this.mp3Buffers.keys())) {
        if (cachedKey.startsWith('table_') && cachedKey !== cueId && cachedKey !== upcoming) {
          this.mp3Buffers.delete(cachedKey);
        }
      }
      if (upcoming !== cueId && !this.mp3Buffers.has(upcoming)) {
        void this.loadMp3Buffer(upcoming);
      }
    }
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
