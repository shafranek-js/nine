import { describe, expect, it } from 'vitest';
import { PcSpeaker } from '../src/audio/pcSpeaker';

interface RecordedOsc {
  type: OscillatorType;
  freqHz: number;
}

function createMockAudioContext() {
  const oscillators: RecordedOsc[] = [];
  let bufferSources = 0;

  const makeParam = (initial = 0) => ({
    value: initial,
    setValueAtTime: (_v: number, _t: number) => {},
    linearRampToValueAtTime: (_v: number, _t: number) => {},
    exponentialRampToValueAtTime: (_v: number, _t: number) => {},
  });

  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: {},
    resume: () => Promise.resolve(),
    createOscillator: () => {
      const rec: RecordedOsc = { type: 'sine', freqHz: 0 };
      const freqParam = {
        value: 0,
        setValueAtTime: (v: number) => {
          rec.freqHz = v;
        },
        exponentialRampToValueAtTime: () => {},
      };
      const node = {
        get type() {
          return rec.type;
        },
        set type(t: OscillatorType) {
          rec.type = t;
        },
        frequency: freqParam,
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
      oscillators.push(rec);
      return node;
    },
    createGain: () => ({
      gain: makeParam(1),
      connect: () => {},
    }),
    createBiquadFilter: () => ({
      type: 'lowpass' as BiquadFilterType,
      frequency: makeParam(350),
      Q: makeParam(1),
      connect: () => {},
    }),
    createBuffer: (channels: number, length: number, sampleRate: number) => {
      const data = new Float32Array(length);
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        getChannelData: () => data,
      };
    },
    createBufferSource: () => {
      bufferSources++;
      return {
        buffer: null,
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    },
  };

  return {
    ctx: ctx as unknown as AudioContext,
    oscillators,
    getBufferSources: () => bufferSources,
  };
}

describe('PcSpeaker SFX profiles', () => {
  it('uses square-wave MS-DOS tones in ega mode for all SFX including exitSequence', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);
    sfx.setSoundProfile('ega');

    sfx.coinChime();
    sfx.cardSlide();
    sfx.passAlert();
    sfx.illegalMove();
    sfx.victoryBeep();
    sfx.matchVictory();
    sfx.matchDefeat();
    sfx.exitSequence();

    expect(mock.oscillators.length).toBe(10);
    expect(mock.oscillators.every((o) => o.type === 'square')).toBe(true);
    expect(mock.oscillators.slice(-3).map((o) => o.freqHz)).toEqual([80, 120, 160]);
    expect(mock.getBufferSources()).toBe(0);
  });

  it('uses acoustic non-square synthesis and cached noise transients in hd mode', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);
    sfx.setSoundProfile('hd');

    sfx.coinChime();
    sfx.cardSlide();
    sfx.passAlert();
    sfx.illegalMove();
    sfx.victoryBeep();
    sfx.matchVictory();
    sfx.matchDefeat();
    sfx.exitSequence();

    expect(mock.oscillators.length).toBeGreaterThan(20);
    expect(mock.oscillators.some((o) => o.type === 'square')).toBe(false);
    expect(mock.getBufferSources()).toBeGreaterThanOrEqual(6);
  });

  it('plays audible brass handbell modal partials on passAlert and victoryBeep in hd mode', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);
    sfx.setSoundProfile('hd');

    sfx.passAlert();
    const passBellCount = mock.oscillators.filter((o) => o.freqHz >= 1000).length;
    expect(passBellCount).toBeGreaterThanOrEqual(8);
    expect(mock.getBufferSources()).toBe(2);

    const beforeVictory = mock.oscillators.length;
    sfx.victoryBeep();
    const victoryBellCount = mock.oscillators.slice(beforeVictory).filter((o) => o.freqHz >= 1000).length;
    expect(victoryBellCount).toBeGreaterThanOrEqual(4);
  });
});
