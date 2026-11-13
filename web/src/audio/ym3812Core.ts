import type { MusEvent, OplOperatorParams, TimInstrument } from './mscParser';

export interface Ym3812Instrument {
  readonly mod: OplOperatorParams;
  readonly car: OplOperatorParams;
  readonly modWave?: number;
  readonly carWave?: number;
}

export interface Ym3812SequencerTrack {
  readonly bpm: number;
  readonly tickBeat: number;
  readonly totalTicks: number;
  readonly percussionMode?: boolean;
  readonly pitchBendRange?: number;
  readonly instruments: readonly Ym3812Instrument[];
  readonly events: readonly MusEvent[];
}

export interface AdlibSequencerInstance {
  loadTrack(track: Ym3812SequencerTrack): void;
  stop(): void;
  processBlock(output: Float32Array): void;
}

export interface Ym3812ChipInstance {
  reset(): void;
  setChannelInstrument(ch: number, ins: Ym3812Instrument): void;
  setChannelVolume(ch: number, vol: number): void;
  noteOn(ch: number, note: number, bendSemis?: number): void;
  noteOff(ch: number): void;
  setChannelPitchBend(ch: number, bendSemis: number): void;
  step(): number;
}

/**
 * Pure ES6 implementation of a hardware-accurate 49716 Hz YM3812 (OPL2) FM chip
 * + Ilya Tovbin `AdLib driver v.2.0` register/MIDI-event translator (`NINE.EXE`, seg1c40).
 *
 * Kept dependency-free in a string so the exact same code runs inside both:
 * 1) the browser `AudioWorkletProcessor` Blob without Vite/TS transform artifacts, and
 * 2) Node/Vitest unit tests via `createAdlibSequencer` / `createYm3812Chip`.
 */
export const YM3812_CORE_SOURCE = `
var OPL_CLOCK_HZ = 49716;
var FNUM_TABLE = [345, 365, 387, 410, 435, 460, 488, 517, 547, 580, 615, 651];
var MULTI_X2 = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30];
var KSL_ROM = [0, 32, 40, 45, 48, 51, 53, 55, 56, 58, 59, 60, 61, 62, 63, 64];
var KSL_SHIFT = [8, 1, 0, 2];

var EG_INC_LOW = [
  [0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 1, 0, 1],
  [0, 1, 1, 1, 0, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1]
];
var EG_INC_HIGH = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 2, 1, 1, 1, 2],
  [1, 2, 1, 2, 1, 2, 1, 2],
  [1, 2, 2, 2, 1, 2, 2, 2]
];
var VIB_DEPTH_TABLE = [1, 0, -1, 0];

var LOGSIN = new Int32Array(256);
var EXP_TABLE = new Int32Array(256);
for (var ti = 0; ti < 256; ti++) {
  var s = Math.sin(((ti + 0.5) * Math.PI) / 512);
  LOGSIN[ti] = Math.round(-Math.log2(s) * 256);
  EXP_TABLE[ti] = Math.round(Math.pow(2, ti / 256) * 1024);
}

function oplEvalWave(phase10, att, wave) {
  var q = phase10 & 1023;
  var neg = 0;
  var idx = 0;
  if (wave === 0) {
    neg = (q & 512) !== 0 ? 1 : 0;
    idx = q & 255;
    if ((q & 256) !== 0) idx = 255 - idx;
  } else if (wave === 1) {
    if ((q & 512) !== 0) return 0;
    idx = q & 255;
    if ((q & 256) !== 0) idx = 255 - idx;
  } else if (wave === 2) {
    idx = q & 255;
    if ((q & 256) !== 0) idx = 255 - idx;
  } else {
    if ((q & 256) !== 0) return 0;
    idx = q & 255;
  }
  var val = LOGSIN[idx] + att;
  var msb = val >> 8;
  if (msb >= 13) return 0;
  var lsb = val & 255;
  var mag = (EXP_TABLE[255 - lsb] << 1) >> msb;
  return neg ? -mag : mag;
}

function createOperatorState() {
  return {
    ksl: 0,
    multi: 1,
    attack: 0,
    decay: 0,
    sustain: 0,
    release: 0,
    egType: 1,
    am: 0,
    vib: 0,
    ksr: 0,
    tl: 63,
    effTl: 63,
    wave: 0,
    phase: 0,
    eg: 511,
    state: 3, // 0=attack, 1=decay, 2=sustain, 3=release
    fb0: 0,
    fb1: 0,
    kslAtt: 0
  };
}

function updateOpKslAtt(op, block, fnum) {
  var shift = KSL_SHIFT[op.ksl & 3];
  if (shift === 8) {
    op.kslAtt = 0;
    return;
  }
  var base = KSL_ROM[(fnum >> 6) & 15] - ((7 - (block & 7)) << 3);
  op.kslAtt = base > 0 ? base << shift : 0;
}

function stepEnvelope(op, rate, egTimer) {
  if (rate <= 0) return 0;
  var rateHi = rate >> 2;
  var rateLo = rate & 3;
  if (rateHi < 12) {
    var shift = 13 - rateHi;
    if ((egTimer & ((1 << shift) - 1)) !== 0) return 0;
    return EG_INC_LOW[rateLo][(egTimer >> shift) & 7];
  }
  if (rateHi >= 15) return 8;
  return EG_INC_HIGH[rateLo][egTimer & 7] << (rateHi - 12);
}

function Ym3812Chip() {
  this.channels = [];
  for (var i = 0; i < 9; i++) {
    this.channels.push({
      mod: createOperatorState(),
      car: createOperatorState(),
      feedback: 0,
      fm: 1,
      slotVol: 127,
      keyOn: false,
      note: 0,
      block: 0,
      fnum: 0,
      keyCode: 0,
      bendSemis: 0
    });
  }
  this.egTimer = 0;
  this.amCounter = 0;
  this.vibCounter = 0;
}

Ym3812Chip.prototype.reset = function () {
  for (var i = 0; i < 9; i++) {
    var c = this.channels[i];
    c.mod = createOperatorState();
    c.car = createOperatorState();
    c.feedback = 0;
    c.fm = 1;
    c.slotVol = 127;
    c.keyOn = false;
    c.note = 0;
    c.block = 0;
    c.fnum = 0;
    c.keyCode = 0;
    c.bendSemis = 0;
  }
  this.egTimer = 0;
  this.amCounter = 0;
  this.vibCounter = 0;
};

Ym3812Chip.prototype._applyPitch = function (ch) {
  var c = this.channels[ch];
  if (!c) return;
  // AdLib driver v.2.0: n = clamp(note - 12, 0, 95), pitchBendRange +/- bendSemis
  var adj = c.note - 12 + c.bendSemis;
  if (adj < 0) adj = 0;
  if (adj > 95.999) adj = 95.999;
  var baseNote = Math.floor(adj);
  var frac = adj - baseNote;
  var block = Math.floor(baseNote / 12);
  if (block > 7) block = 7;
  var semi = baseNote % 12;
  var fnum = FNUM_TABLE[semi];
  if (frac > 0.0001) {
    fnum = Math.round(fnum * Math.pow(2, frac / 12));
  }
  c.block = block;
  c.fnum = fnum;
  // NOTE-SEL=0 in AdLib v2.0 (reg 0x08 = 0x00) -> bit 9 of fnum
  c.keyCode = ((block & 7) << 1) | ((fnum >> 9) & 1);
  updateOpKslAtt(c.mod, block, fnum);
  updateOpKslAtt(c.car, block, fnum);
};

Ym3812Chip.prototype._updateCarrierTl = function (c) {
  var gain = 63 - (c.car.tl & 0x3f);
  var effGain = Math.floor((c.slotVol * gain * 2 + 0x7f) / 0xfe);
  if (effGain < 0) effGain = 0;
  if (effGain > 63) effGain = 63;
  c.car.effTl = 63 - effGain;
};

function copyOpParams(op, p, wave) {
  op.ksl = p.ksl & 3;
  op.multi = p.multi & 15;
  op.attack = p.attack & 15;
  op.decay = p.decay & 15;
  op.sustain = p.sustain & 15;
  op.release = p.release & 15;
  op.egType = p.eg ? 1 : 0;
  op.am = p.am ? 1 : 0;
  op.vib = p.vib ? 1 : 0;
  op.ksr = p.ksr ? 1 : 0;
  op.tl = Math.max(0, Math.min(63, p.totalLevel | 0));
  op.effTl = op.tl;
  op.wave = (wave | 0) & 3;
}

Ym3812Chip.prototype.setChannelInstrument = function (ch, ins) {
  var c = this.channels[ch];
  if (!c || !ins) return;
  copyOpParams(c.mod, ins.mod, ins.modWave || 0);
  copyOpParams(c.car, ins.car, ins.carWave || 0);
  c.feedback = ins.mod.feedback & 7;
  // In NINE.EXE seg1c40:0b5e, op[12]==1 leaves 0xC0 bit0=0 (FM); op[12]==0 sets bit0=1 (Additive)
  c.fm = ins.mod.fm ? 1 : 0;
  this._updateCarrierTl(c);
  updateOpKslAtt(c.mod, c.block, c.fnum);
  updateOpKslAtt(c.car, c.block, c.fnum);
};

Ym3812Chip.prototype.setChannelVolume = function (ch, vol) {
  var c = this.channels[ch];
  if (!c) return;
  var clamped = vol < 0 ? 0 : (vol > 127 ? 127 : vol | 0);
  c.slotVol = clamped;
  this._updateCarrierTl(c);
};

Ym3812Chip.prototype.noteOn = function (ch, note, bendSemis) {
  var c = this.channels[ch];
  if (!c) return;
  c.note = note;
  if (typeof bendSemis === 'number') c.bendSemis = bendSemis;
  this._applyPitch(ch);
  c.keyOn = true;
  c.mod.phase = 0;
  c.car.phase = 0;
  c.mod.state = 0;
  c.car.state = 0;
  if (c.mod.attack === 15) c.mod.eg = 0;
  if (c.car.attack === 15) c.car.eg = 0;
};

Ym3812Chip.prototype.noteOff = function (ch) {
  var c = this.channels[ch];
  if (!c) return;
  c.keyOn = false;
  c.mod.state = 3;
  c.car.state = 3;
};

Ym3812Chip.prototype.setChannelPitchBend = function (ch, bendSemis) {
  var c = this.channels[ch];
  if (!c) return;
  c.bendSemis = bendSemis;
  if (c.note > 0) this._applyPitch(ch);
};

Ym3812Chip.prototype._stepOperatorEg = function (op, keyCode, egTimer) {
  if (op.state === 3 && op.eg >= 511) {
    op.eg = 511;
    return;
  }
  var ksrShift = op.ksr ? keyCode : (keyCode >> 2);
  if (op.state === 0) {
    if (op.attack === 0) return;
    var rAtk = op.attack * 4 + ksrShift;
    if (rAtk > 63) rAtk = 63;
    if (rAtk >= 60) {
      op.eg = 0;
      op.state = 1;
      return;
    }
    var incA = stepEnvelope(op, rAtk, egTimer);
    if (incA > 0) {
      op.eg += (~op.eg * incA) >> 3;
      if (op.eg <= 0) {
        op.eg = 0;
        op.state = 1;
      }
    }
  } else if (op.state === 1) {
    var sustainTarget = op.sustain === 15 ? 511 : (op.sustain << 4);
    if (op.decay > 0) {
      var rDec = op.decay * 4 + ksrShift;
      if (rDec > 63) rDec = 63;
      op.eg += stepEnvelope(op, rDec, egTimer);
    }
    if (op.eg >= sustainTarget) {
      op.eg = sustainTarget;
      op.state = op.egType ? 2 : 3;
    }
  } else if (op.state === 2) {
    if (!op.egType) op.state = 3;
  } else {
    if (op.release > 0) {
      var rRel = op.release * 4 + ksrShift;
      if (rRel > 63) rRel = 63;
      op.eg += stepEnvelope(op, rRel, egTimer);
      if (op.eg >= 511) op.eg = 511;
    }
  }
};

Ym3812Chip.prototype.step = function () {
  this.egTimer++;
  this.amCounter = (this.amCounter + 1) % 13440;
  this.vibCounter = (this.vibCounter + 1) % 8192;

  // Triangle AM 0..6 in 0.1875dB units (~1.0dB, DAM=0 default in AdLib driver v2.0)
  var amPhase = (this.amCounter * 12) / 13440;
  var amVal = Math.floor(amPhase <= 6 ? amPhase : 12 - amPhase);
  var vibSign = VIB_DEPTH_TABLE[(this.vibCounter >> 10) & 3];

  var sum = 0;
  for (var ch = 0; ch < 9; ch++) {
    var c = this.channels[ch];
    if (c.car.eg >= 511 && c.car.state === 3 && !c.fm && c.mod.eg >= 511 && c.mod.state === 3) {
      continue;
    }
    if (c.fm && c.car.eg >= 511 && c.car.state === 3) {
      continue;
    }

    this._stepOperatorEg(c.mod, c.keyCode, this.egTimer);
    this._stepOperatorEg(c.car, c.keyCode, this.egTimer);

    var baseFnum = c.fnum;
    var vibDelta = ((baseFnum >> 7) * vibSign) >> 1;

    var modFnum = baseFnum + (c.mod.vib ? vibDelta : 0);
    var modInc = ((modFnum << c.block) * MULTI_X2[c.mod.multi]) >> 2;
    c.mod.phase = (c.mod.phase + modInc) & 524287;

    var fbPhase = c.feedback > 0 ? ((c.mod.fb0 + c.mod.fb1) >> (9 - c.feedback)) : 0;
    var modAtt = (c.mod.effTl << 5) + ((c.mod.eg + c.mod.kslAtt + (c.mod.am ? amVal : 0)) << 3);
    var modOut = oplEvalWave((c.mod.phase >> 9) + fbPhase, modAtt, c.mod.wave);
    c.mod.fb1 = c.mod.fb0;
    c.mod.fb0 = modOut;

    var carFnum = baseFnum + (c.car.vib ? vibDelta : 0);
    var carInc = ((carFnum << c.block) * MULTI_X2[c.car.multi]) >> 2;
    c.car.phase = (c.car.phase + carInc) & 524287;

    var carAtt = (c.car.effTl << 5) + ((c.car.eg + c.car.kslAtt + (c.car.am ? amVal : 0)) << 3);
    if (c.fm) {
      var carOut = oplEvalWave((c.car.phase >> 9) + modOut, carAtt, c.car.wave);
      sum += carOut;
    } else {
      var addCar = oplEvalWave(c.car.phase >> 9, carAtt, c.car.wave);
      sum += modOut + addCar;
    }
  }

  return sum;
};

function AdlibMusSequencer(hostSampleRate) {
  this.chip = new Ym3812Chip();
  this.hostSampleRate = hostSampleRate || 44100;
  this.playing = false;
  this.track = null;
  this.bpm = 120;
  this.tickBeat = 240;
  this.totalTicks = 0;
  this.pitchBendRange = 1;
  this.events = [];
  this.instruments = [];
  this.cursor = 0;
  this.currentTick = 0;
  this.oplSamplesPerTick = 1;
  this.tickAccum = 0;
  this.resampleAccum = 0;
  this.prevOpl = 0;
  this.currOpl = 0;
  this.prevVel = new Int16Array(16);
  this.chanBend = new Float32Array(16);
}

AdlibMusSequencer.prototype._updateTiming = function () {
  var ticksPerSec = (this.bpm * this.tickBeat) / 60;
  this.oplSamplesPerTick = ticksPerSec > 0 ? (OPL_CLOCK_HZ / ticksPerSec) : OPL_CLOCK_HZ;
};

AdlibMusSequencer.prototype._resetTrackState = function () {
  this.chip.reset();
  for (var ch = 0; ch < 16; ch++) {
    this.prevVel[ch] = 127;
    this.chanBend[ch] = 0;
  }
  if (this.instruments.length > 0) {
    var defIns = this.instruments[0];
    for (var oc = 0; oc < 9; oc++) {
      this.chip.setChannelInstrument(oc, defIns);
      this.chip.setChannelVolume(oc, 127);
    }
  }
};

AdlibMusSequencer.prototype.loadTrack = function (track) {
  this.track = track;
  this.bpm = track.bpm || 120;
  this.tickBeat = track.tickBeat || 240;
  this.totalTicks = track.totalTicks || 0;
  this.pitchBendRange = track.pitchBendRange || 1;
  this.instruments = track.instruments || [];
  this.events = track.events || [];
  this.cursor = 0;
  this.currentTick = 0;
  this.tickAccum = 0;
  this.resampleAccum = 0;
  this.prevOpl = 0;
  this.currOpl = 0;
  this._resetTrackState();
  this._updateTiming();
  this.playing = this.events.length > 0;
  if (this.playing) this._drainEventsAtCurrentTick();
};

AdlibMusSequencer.prototype.stop = function () {
  this.playing = false;
  this.chip.reset();
};

AdlibMusSequencer.prototype._handleEvent = function (ev) {
  if (ev.type === 'tempo') {
    if (ev.bpm > 0) {
      this.bpm = ev.bpm;
      this._updateTiming();
    }
    return;
  }
  var ch = ev.channel | 0;
  if (ch < 0 || ch >= 9) return;
  if (ev.type === 'program') {
    var ins = this.instruments[ev.program];
    if (ins) this.chip.setChannelInstrument(ch, ins);
  } else if (ev.type === 'volume') {
    var v = ev.volume < 0 ? 0 : (ev.volume > 127 ? 127 : ev.volume | 0);
    this.chip.setChannelVolume(ch, v);
  } else if (ev.type === 'pitchBend') {
    var norm = (ev.value - 8192) / 8192;
    var semis = norm * this.pitchBendRange;
    this.chanBend[ch] = semis;
    this.chip.setChannelPitchBend(ch, semis);
  } else if (ev.type === 'noteOff') {
    this.chip.noteOff(ch);
  } else if (ev.type === 'noteOn') {
    if (ev.velocity <= 0) {
      this.chip.noteOff(ch);
    } else {
      // AdLib driver v.2.0: 0x90 vel updates carrier slot volume if vel != prevVel[ch]
      if (this.prevVel[ch] !== ev.velocity) {
        this.prevVel[ch] = ev.velocity;
        this.chip.setChannelVolume(ch, ev.velocity);
      }
      this.chip.noteOn(ch, ev.note, this.chanBend[ch]);
    }
  }
};

AdlibMusSequencer.prototype._drainEventsAtCurrentTick = function () {
  while (this.cursor < this.events.length && this.events[this.cursor].tick <= this.currentTick) {
    this._handleEvent(this.events[this.cursor]);
    this.cursor++;
  }
};

AdlibMusSequencer.prototype._stepOplSample = function () {
  this.tickAccum += 1;
  while (this.tickAccum >= this.oplSamplesPerTick) {
    this.tickAccum -= this.oplSamplesPerTick;
    this.currentTick++;
    this._drainEventsAtCurrentTick();
    if (this.currentTick >= this.totalTicks || this.cursor >= this.events.length) {
      if (this.currentTick >= this.totalTicks) {
        this.currentTick = 0;
        this.cursor = 0;
        this._resetTrackState();
        this._drainEventsAtCurrentTick();
      }
    }
  }
  return this.chip.step();
};

AdlibMusSequencer.prototype.processBlock = function (output) {
  if (!this.playing) {
    output.fill(0);
    return;
  }
  var ratio = OPL_CLOCK_HZ / this.hostSampleRate;
  for (var i = 0; i < output.length; i++) {
    this.resampleAccum += ratio;
    while (this.resampleAccum >= 1) {
      this.prevOpl = this.currOpl;
      this.currOpl = this._stepOplSample();
      this.resampleAccum -= 1;
    }
    var raw = this.prevOpl + (this.currOpl - this.prevOpl) * this.resampleAccum;
    // Scale 13-bit per-channel YM3812 sum cleanly into [-0.98, 0.98] without squashing dynamics
    var scaled = raw * (1 / 12288);
    if (scaled > 0.98) scaled = 0.98;
    else if (scaled < -0.98) scaled = -0.98;
    output[i] = scaled;
  }
};
`;

const createFactory = new Function(
  `${YM3812_CORE_SOURCE}\nreturn { Ym3812Chip: Ym3812Chip, AdlibMusSequencer: AdlibMusSequencer };`,
) as () => {
  Ym3812Chip: new () => Ym3812ChipInstance;
  AdlibMusSequencer: new (hostSampleRate: number) => AdlibSequencerInstance;
};

const { Ym3812Chip: Ym3812ChipCtor, AdlibMusSequencer: AdlibMusSequencerCtor } = createFactory();

export function createYm3812Chip(): Ym3812ChipInstance {
  return new Ym3812ChipCtor();
}

export function createAdlibSequencer(hostSampleRate: number): AdlibSequencerInstance {
  return new AdlibMusSequencerCtor(hostSampleRate);
}

export type { TimInstrument };
