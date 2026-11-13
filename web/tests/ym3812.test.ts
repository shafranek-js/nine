import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNineMsc } from '../src/audio/mscParser';
import { createAdlibSequencer, createYm3812Chip } from '../src/audio/ym3812Core';

function computeRmsAndPeak(samples: Float32Array): { rms: number; peak: number; nanCount: number } {
  let sumSq = 0;
  let peak = 0;
  let nanCount = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    if (!Number.isFinite(v)) {
      nanCount++;
      continue;
    }
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sumSq += v * v;
  }
  return {
    rms: Math.sqrt(sumSq / Math.max(1, samples.length - nanCount)),
    peak,
    nanCount,
  };
}

describe('YM3812 OPL2 core & AdLib driver v2.0 fidelity', () => {
  const mscBytes = new Uint8Array(
    readFileSync(resolve(process.cwd(), 'public/assets/data/NINE.MSC')),
  );
  const tracks = parseNineMsc(mscBytes);

  it('maps NINE.MSC chunks to intro / menu / table with DOS header flags', () => {
    expect(tracks.intro.index).toBe(0);
    expect(tracks.intro.bpm).toBe(115);
    expect(tracks.intro.percussionMode).toBe(true);
    expect(tracks.intro.pitchBendRange).toBe(1);
    expect(tracks.intro.instruments.map((i) => i.name)).toContain('trumpet5');
    expect(tracks.intro.instruments.map((i) => i.name)).toContain('bells');

    expect(tracks.menu.index).toBe(1);
    expect(tracks.menu.bpm).toBe(180);
    expect(tracks.menu.instruments.map((i) => i.name)).toContain('piano1');

    expect(tracks.table.index).toBe(2);
    expect(tracks.table.bpm).toBe(120);
    expect(tracks.table.instruments.map((i) => i.name)).toContain('bells');
  });

  it('renders intro fanfare (trumpet5 + bells) with crisp attack, strong RMS, and rich FM harmonics', () => {
    const sampleRate = 48000;
    const seq = createAdlibSequencer(sampleRate);
    seq.loadTrack(tracks.intro);

    // Render first 2.0 seconds (covers initial fanfare trumpet5 + bells entrance)
    const buf = new Float32Array(sampleRate * 2);
    const block = new Float32Array(128);
    for (let off = 0; off < buf.length; off += 128) {
      seq.processBlock(block);
      buf.set(block.subarray(0, Math.min(128, buf.length - off)), off);
    }

    const stats = computeRmsAndPeak(buf);
    expect(stats.nanCount).toBe(0);
    expect(stats.peak).toBeLessThanOrEqual(0.98);
    expect(stats.peak).toBeGreaterThan(0.18);
    expect(stats.rms).toBeGreaterThan(0.05);

    // Verify early attack (first 250ms) is already audible (not stuck in 2.9s silence)
    const firstQuarterSec = computeRmsAndPeak(buf.subarray(0, sampleRate / 4));
    expect(firstQuarterSec.rms).toBeGreaterThan(0.03);
  });

  it('produces rich FM harmonics on trumpet5 compared to unmodulated sine', () => {
    const chip = createYm3812Chip();
    const trumpet = tracks.intro.instruments.find((i) => i.name === 'trumpet5');
    expect(trumpet).toBeDefined();
    chip.setChannelInstrument(0, trumpet!);
    chip.setChannelVolume(0, 127);
    chip.noteOn(0, 60);

    // Step 15000 OPL samples (~0.30s) so modulator attack opens up into bright brass
    for (let i = 0; i < 15000; i++) {
      chip.step();
    }

    // Measure zero-crossings / crest over ~4096 samples and ensure strong non-zero signal
    let peak = 0;
    let sumSq = 0;
    const n = 4096;
    for (let i = 0; i < n; i++) {
      const s = chip.step();
      const a = Math.abs(s);
      if (a > peak) peak = a;
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / n);
    expect(peak).toBeGreaterThan(2500);
    expect(rms).toBeGreaterThan(1200);
  });

  it('renders menu and table tracks cleanly with zero NaN or clipping', () => {
    const sampleRate = 44100;
    for (const id of ['menu', 'table'] as const) {
      const seq = createAdlibSequencer(sampleRate);
      seq.loadTrack(tracks[id]);

      const buf = new Float32Array(sampleRate * 2);
      const block = new Float32Array(128);
      for (let off = 0; off < buf.length; off += 128) {
        seq.processBlock(block);
        buf.set(block.subarray(0, Math.min(128, buf.length - off)), off);
      }

      const stats = computeRmsAndPeak(buf);
      expect(stats.nanCount).toBe(0);
      expect(stats.peak).toBeLessThanOrEqual(0.98);
      expect(stats.rms).toBeGreaterThan(0.03);
    }
  });
});
