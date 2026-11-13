export type MscTrackId = 'intro' | 'menu' | 'table';

export interface OplOperatorParams {
  readonly ksl: number;
  readonly multi: number;
  readonly feedback: number;
  readonly attack: number;
  readonly sustain: number;
  readonly eg: number;
  readonly decay: number;
  readonly release: number;
  readonly totalLevel: number;
  readonly am: number;
  readonly vib: number;
  readonly ksr: number;
  readonly fm: number;
}

export interface TimInstrument {
  readonly name: string;
  readonly mod: OplOperatorParams;
  readonly car: OplOperatorParams;
  readonly modWave: number;
  readonly carWave: number;
}

export type MusEvent =
  | { readonly tick: number; readonly type: 'noteOn'; readonly channel: number; readonly note: number; readonly velocity: number }
  | { readonly tick: number; readonly type: 'noteOff'; readonly channel: number; readonly note: number }
  | { readonly tick: number; readonly type: 'program'; readonly channel: number; readonly program: number }
  | { readonly tick: number; readonly type: 'volume'; readonly channel: number; readonly volume: number }
  | { readonly tick: number; readonly type: 'pitchBend'; readonly channel: number; readonly value: number }
  | { readonly tick: number; readonly type: 'tempo'; readonly bpm: number };

export interface MscTrack {
  readonly id: MscTrackId;
  readonly index: number;
  readonly tickBeat: number;
  readonly bpm: number;
  readonly totalTicks: number;
  readonly percussionMode: boolean;
  readonly pitchBendRange: number;
  readonly instruments: readonly TimInstrument[];
  readonly events: readonly MusEvent[];
}

/**
 * Exact 6-chunk layout inside original DOS `NINE.MSC` (10,825 bytes, CS:53FC..5573):
 * - Track index 0 (CS:5569, ZF_Nine intro): 0x060D MUS + 0x024F TIM -> 'intro'
 * - Track index 1 (CS:5EFE / CS:3F57, TF_Nine club menu): 0x09E0 MUS + 0x018C TIM -> 'menu'
 * - Track index 2 (CS:351E, GR_Nine / GF_Nine card table): 0x136F MUS + 0x0312 TIM -> 'table'
 */
const TRACK_ORDER: readonly MscTrackId[] = ['intro', 'menu', 'table'];

const MUS_HEADER_SIZE = 0x46;

function readInt16LE(view: DataView, offset: number): number {
  return view.getInt16(offset, true);
}

function readUint16LE(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUint32LE(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function parseOperator(view: DataView, base: number): OplOperatorParams {
  return {
    ksl: readInt16LE(view, base + 0) & 0x03,
    multi: readInt16LE(view, base + 2) & 0x0f,
    feedback: readInt16LE(view, base + 4) & 0x07,
    attack: readInt16LE(view, base + 6) & 0x0f,
    sustain: readInt16LE(view, base + 8) & 0x0f,
    eg: readInt16LE(view, base + 10) !== 0 ? 1 : 0,
    decay: readInt16LE(view, base + 12) & 0x0f,
    release: readInt16LE(view, base + 14) & 0x0f,
    totalLevel: Math.max(0, Math.min(63, readInt16LE(view, base + 16))),
    am: readInt16LE(view, base + 18) !== 0 ? 1 : 0,
    vib: readInt16LE(view, base + 20) !== 0 ? 1 : 0,
    ksr: readInt16LE(view, base + 22) !== 0 ? 1 : 0,
    fm: readInt16LE(view, base + 24) !== 0 ? 1 : 0,
  };
}

function readAsciiZ(bytes: Uint8Array, start: number, maxLen: number): string {
  let end = start;
  const limit = Math.min(bytes.length, start + maxLen);
  while (end < limit && bytes[end] !== 0) end++;
  let out = '';
  for (let i = start; i < end; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function parseTimBank(bytes: Uint8Array, view: DataView, offset: number): {
  instruments: TimInstrument[];
  nextOffset: number;
} {
  const numInstruments = readUint16LE(view, offset + 2);
  const listSize = readUint16LE(view, offset + 4);
  const namesStart = offset + 6;
  const dataStart = offset + listSize;

  const instruments: TimInstrument[] = [];
  for (let i = 0; i < numInstruments; i++) {
    const name = readAsciiZ(bytes, namesStart + i * 9, 9);
    const insBase = dataStart + i * 56;
    const mod = parseOperator(view, insBase);
    const car = parseOperator(view, insBase + 26);
    const modWave = readInt16LE(view, insBase + 52) & 0x03;
    const carWave = readInt16LE(view, insBase + 54) & 0x03;
    instruments.push({ name, mod, car, modWave, carWave });
  }

  return {
    instruments,
    nextOffset: dataStart + numInstruments * 56,
  };
}

function parseSingleTrack(
  bytes: Uint8Array,
  view: DataView,
  musOffset: number,
  id: MscTrackId,
  index: number,
): { track: MscTrack; nextOffset: number } {
  const tickBeat = bytes[musOffset + 0x24] || 240;
  const totalTicksHeader = readUint32LE(view, musOffset + 0x26);
  const streamLen = readUint32LE(view, musOffset + 0x2a);
  const percussionMode = (bytes[musOffset + 0x3a] ?? 0) !== 0;
  const pitchBendRange = Math.max(1, Math.min(12, bytes[musOffset + 0x3b] || 1));
  const bpm = readUint16LE(view, musOffset + 0x3c) || 120;

  const streamStart = musOffset + MUS_HEADER_SIZE;
  const streamEnd = streamStart + streamLen;
  if (streamEnd > bytes.length) {
    throw new Error(`MSC track ${id} overflows buffer (${streamEnd} > ${bytes.length})`);
  }

  let cursor = streamStart;
  const readDelta = (): number => {
    let acc = 0;
    while (cursor < streamEnd) {
      const b = bytes[cursor++];
      if (b === 0xf8) {
        acc += 240;
      } else {
        return acc + b;
      }
    }
    return acc;
  };

  const events: MusEvent[] = [];
  let tick = readDelta();
  let lastStatus = 0;

  while (cursor < streamEnd) {
    const peek = bytes[cursor];
    let status: number;
    if (peek >= 0x80) {
      status = peek;
      cursor++;
      if (status < 0xf0) {
        lastStatus = status;
      }
    } else {
      if (lastStatus === 0) {
        throw new Error(`MSC track ${id} running status missing at offset 0x${cursor.toString(16)}`);
      }
      status = lastStatus;
    }

    if (status === 0xfc) {
      break;
    }

    const hi = status & 0xf0;
    const channel = status & 0x0f;

    if (hi === 0x80) {
      const note = bytes[cursor++];
      cursor++; // release velocity
      events.push({ tick, type: 'noteOff', channel, note });
    } else if (hi === 0x90) {
      const note = bytes[cursor++];
      const velocity = bytes[cursor++];
      if (velocity === 0) {
        events.push({ tick, type: 'noteOff', channel, note });
      } else {
        events.push({ tick, type: 'noteOn', channel, note, velocity });
      }
    } else if (hi === 0xa0) {
      const volume = bytes[cursor++];
      events.push({ tick, type: 'volume', channel, volume });
    } else if (hi === 0xb0) {
      cursor += 2;
    } else if (hi === 0xc0) {
      const program = bytes[cursor++];
      events.push({ tick, type: 'program', channel, program });
    } else if (hi === 0xd0) {
      cursor += 1;
    } else if (hi === 0xe0) {
      const lsb = bytes[cursor++];
      const msb = bytes[cursor++];
      const value = ((msb & 0x7f) << 7) | (lsb & 0x7f);
      events.push({ tick, type: 'pitchBend', channel, value });
    } else if (status === 0xf0) {
      const sysexStart = cursor;
      while (cursor < streamEnd && bytes[cursor] !== 0xf7) {
        cursor++;
      }
      // AdLib SysEx tempo multiplier if 7f 00 02 ...
      if (
        cursor - sysexStart >= 6 &&
        bytes[sysexStart] === 0x7f &&
        bytes[sysexStart + 1] === 0x00 &&
        bytes[sysexStart + 2] === 0x02
      ) {
        const nextBpm = (bytes[sysexStart + 3] << 7) | bytes[sysexStart + 4];
        if (nextBpm > 0) events.push({ tick, type: 'tempo', bpm: nextBpm });
      }
      if (cursor < streamEnd && bytes[cursor] === 0xf7) {
        cursor++;
      }
    } else {
      throw new Error(`MSC track ${id} unsupported opcode 0x${status.toString(16)} at 0x${(cursor - 1).toString(16)}`);
    }

    if (cursor < streamEnd) {
      tick += readDelta();
    }
  }

  const { instruments, nextOffset } = parseTimBank(bytes, view, streamEnd);
  return {
    track: {
      id,
      index,
      tickBeat,
      bpm,
      totalTicks: Math.max(tick, totalTicksHeader),
      percussionMode,
      pitchBendRange,
      instruments,
      events,
    },
    nextOffset,
  };
}

export function parseNineMsc(bytes: Uint8Array): Record<MscTrackId, MscTrack> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  const result = {} as Record<MscTrackId, MscTrack>;

  for (let i = 0; i < TRACK_ORDER.length; i++) {
    const id = TRACK_ORDER[i];
    const parsed = parseSingleTrack(bytes, view, offset, id, i);
    result[id] = parsed.track;
    offset = parsed.nextOffset;
  }

  return result;
}
