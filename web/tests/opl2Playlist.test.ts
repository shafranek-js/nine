import { describe, expect, it } from 'vitest';
import {
  buildShuffledTableBag,
  Opl2MusicEngine,
  TABLE_MP3_TRACK_IDS,
  type TableMp3TrackId,
} from '../src/audio/opl2Engine';

describe('Table music playlist rotation', () => {
  it('contains all 10 card-table themes (03 through 12)', () => {
    expect(TABLE_MP3_TRACK_IDS).toEqual([
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
    ]);
  });

  it('cycles through every track in a bag before repeating and avoids back-to-back repeats across refills', () => {
    let prev: TableMp3TrackId | null = null;
    for (let cycle = 0; cycle < 5; cycle++) {
      const bag = buildShuffledTableBag(prev);
      expect(bag).toHaveLength(TABLE_MP3_TRACK_IDS.length);
      expect(new Set(bag).size).toBe(TABLE_MP3_TRACK_IDS.length);
      if (prev !== null) {
        expect(bag[bag.length - 1]).not.toBe(prev);
      }
      while (bag.length > 0) {
        const next = bag.pop()!;
        expect(next).not.toBe(prev);
        prev = next;
      }
    }
  });

  it('advances active table track on every round via playNextTableTrack()', () => {
    const engine = new Opl2MusicEngine();
    const seen = new Set<TableMp3TrackId>();
    let prev: TableMp3TrackId | null = null;
    for (let round = 0; round < TABLE_MP3_TRACK_IDS.length; round++) {
      engine.playNextTableTrack();
      expect(engine.getCurrentTrack()).toBe('table');
      const cur = engine.getActiveTableCue();
      expect(cur).not.toBeNull();
      expect(cur).not.toBe(prev);
      seen.add(cur!);
      prev = cur;
    }
    expect(seen.size).toBe(TABLE_MP3_TRACK_IDS.length);
  });
});
