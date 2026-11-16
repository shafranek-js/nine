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

  it('plays brass handbell only on dealerBellPing/passAlert and keeps victoryBeep bell-free in hd mode', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);
    sfx.setSoundProfile('hd');

    sfx.dealerBellPing();
    const reminderBellCount = mock.oscillators.filter((o) => o.freqHz >= 1000).length;
    expect(reminderBellCount).toBeGreaterThanOrEqual(4);
    expect(mock.getBufferSources()).toBe(1);

    const beforeVictory = mock.oscillators.length;
    sfx.victoryBeep();
    const victoryOscs = mock.oscillators.slice(beforeVictory);
    expect(victoryOscs.filter((o) => o.freqHz >= 1000).length).toBe(0);
    expect(victoryOscs.length).toBe(3);
  });

  it('plays DOS coinHatClink in ega mode and acoustic payout fallback in hd mode on coinPourPayout', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);

    sfx.setSoundProfile('ega');
    sfx.coinPourPayout();
    expect(mock.oscillators.map((o) => o.freqHz)).toEqual([6000, 6000, 6000]);
    expect(mock.getBufferSources()).toBe(0);

    const beforeHd = mock.oscillators.length;
    sfx.setSoundProfile('hd');
    sfx.coinPourPayout();
    expect(mock.oscillators.slice(beforeHd).length).toBeGreaterThan(0);
    expect(mock.getBufferSources()).toBe(1);
  });

  it('plays DOS triple ticks in ega mode and fallback chime in hd mode on coinHatClink', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);

    sfx.setSoundProfile('ega');
    sfx.coinHatClink();
    expect(mock.oscillators.map((o) => o.freqHz)).toEqual([6000, 6000, 6000]);
    expect(mock.getBufferSources()).toBe(0);

    const beforeHd = mock.oscillators.length;
    sfx.setSoundProfile('hd');
    sfx.coinHatClink();
    expect(mock.oscillators.slice(beforeHd).every((o) => o.type !== 'square')).toBe(true);
    expect(mock.getBufferSources()).toBe(1);
  });

  it('plays DOS cardSlide in ega mode and acoustic cardSpring fallback in hd mode', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);

    sfx.setSoundProfile('ega');
    sfx.cardSpring();
    expect(mock.oscillators.map((o) => o.freqHz)).toEqual([65]);
    expect(mock.getBufferSources()).toBe(0);

    const beforeHd = mock.oscillators.length;
    sfx.setSoundProfile('hd');
    sfx.cardSpring();
    expect(mock.oscillators.slice(beforeHd).length).toBeGreaterThan(0);
    expect(mock.getBufferSources()).toBe(1);
  });

  it('plays DOS tick in ega mode and fallback swish in hd mode on cardDeal', () => {
    const mock = createMockAudioContext();
    const sfx = new PcSpeaker();
    sfx.attachContext(mock.ctx);

    sfx.setSoundProfile('ega');
    sfx.cardDeal();
    expect(mock.oscillators.map((o) => o.freqHz)).toEqual([65]);
    expect(mock.getBufferSources()).toBe(0);

    const beforeHd = mock.oscillators.length;
    sfx.setSoundProfile('hd');
    sfx.cardDeal();
    expect(mock.oscillators.slice(beforeHd).every((o) => o.type !== 'square')).toBe(true);
    expect(mock.getBufferSources()).toBe(1);
  });
});
