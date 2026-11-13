import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseNineMsc } from '../src/audio/mscParser';

describe('NINE.MSC AdLib music & TIM instrument parser', () => {
  it('parses all 3 tracks cleanly to 0xFC with exact ticks and instruments', () => {
    const raw = new Uint8Array(readFileSync(resolve(process.cwd(), 'public/assets/data/NINE.MSC')));
    expect(raw.length).toBe(10825);

    const tracks = parseNineMsc(raw);

    expect(tracks.intro.bpm).toBe(115);
    expect(tracks.intro.tickBeat).toBe(240);
    expect(tracks.intro.totalTicks).toBe(7200);
    expect(tracks.intro.instruments.length).toBe(9);
    expect(tracks.intro.instruments.map((ins) => ins.name)).toContain('trumpet5');

    expect(tracks.menu.bpm).toBe(180);
    expect(tracks.menu.tickBeat).toBe(240);
    expect(tracks.menu.totalTicks).toBe(32640);
    expect(tracks.menu.instruments.length).toBe(6);
    expect(tracks.menu.instruments[0].name).toBe('piano1');

    expect(tracks.table.bpm).toBe(120);
    expect(tracks.table.tickBeat).toBe(240);
    expect(tracks.table.totalTicks).toBe(34800);
    expect(tracks.table.instruments.length).toBe(12);
    expect(tracks.table.instruments.map((ins) => ins.name)).toContain('love30');

    for (const key of ['intro', 'menu', 'table'] as const) {
      const noteOns = tracks[key].events.filter((e) => e.type === 'noteOn');
      const noteOffs = tracks[key].events.filter((e) => e.type === 'noteOff');
      expect(noteOns.length).toBeGreaterThan(50);
      expect(noteOffs.length).toBeGreaterThan(50);
    }
  });
});
