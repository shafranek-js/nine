import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  decodeNineCfg,
  decodeNineRes,
  encodeNineCfg,
  encodeNineRes,
  lookupPlayer,
  upsertHighScore,
} from '../src/core/persistence.js';

describe('NINE.RES & NINE.CFG binary persistence', () => {
  it('decodes the original DOS NINE.RES and round-trips byte-for-byte', () => {
    const rawPath = resolve(process.cwd(), 'public/assets/data/NINE.RES');
    const orig = new Uint8Array(readFileSync(rawPath));
    expect(orig.length).toBe(600);

    const tables = decodeNineRes(orig);
    expect(tables[1]).toHaveLength(10);
    expect(tables[2]).toHaveLength(10);
    expect(tables[3]).toHaveLength(10);
    expect(tables[1][0].name).toBe('Noname');

    const reEncoded = encodeNineRes(tables);
    expect(reEncoded.length).toBe(600);
    expect(decodeNineRes(reEncoded)).toEqual(tables);
    expect(encodeNineRes(decodeNineRes(reEncoded))).toEqual(reEncoded);
  });

  it('upserts and sorts scores descending, placing real players before Noname', () => {
    const orig = new Uint8Array(readFileSync(resolve(process.cwd(), 'public/assets/data/NINE.RES')));
    let tables = decodeNineRes(orig);
    tables = upsertHighScore(tables, 2, 'Alice', 'secret', 340);
    tables = upsertHighScore(tables, 2, 'Bob', 'pass2', 520);
    tables = upsertHighScore(tables, 2, 'Alice', 'secret', 610);

    expect(tables[2][0].name).toBe('Alice');
    expect(tables[2][0].score).toBe(610);
    expect(tables[2][1].name).toBe('Bob');
    expect(tables[2][1].score).toBe(520);
    expect(tables[2][2].name).toBe('Noname');
    expect(lookupPlayer(tables, 2, 'Bob')?.password).toBe('pass2');
    expect(lookupPlayer(tables, 1, 'Bob')).toBeNull();
  });

  it('decodes and encodes original DOS NINE.CFG (2 bytes)', () => {
    const orig = new Uint8Array(readFileSync(resolve(process.cwd(), 'public/assets/data/NINE.CFG')));
    expect(orig.length).toBe(2);
    const cfg = decodeNineCfg(orig);
    expect(cfg).toEqual({ soundMusicEnabled: true, clubTable: 1 });
    expect(encodeNineCfg(cfg)).toEqual(orig);
  });
});
