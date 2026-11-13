import { Assets, Texture } from 'pixi.js';
import { cardKey } from '../core/rules';
import type { Rank, Suit } from '../core/types';

export type GraphicsMode = 'hd' | 'ega';

/** All 12 court cards (J, Q, K across all 4 suits) loaded from public/assets/hd/cards/. */
export const HD_COURT_ART_ENTRIES: readonly { suit: Suit; rank: Rank }[] = [
  { suit: 1, rank: 11 },
  { suit: 1, rank: 12 },
  { suit: 1, rank: 13 },
  { suit: 2, rank: 11 },
  { suit: 2, rank: 12 },
  { suit: 2, rank: 13 },
  { suit: 3, rank: 11 },
  { suit: 3, rank: 12 },
  { suit: 3, rank: 13 },
  { suit: 4, rank: 11 },
  { suit: 4, rank: 12 },
  { suit: 4, rank: 13 },
];

export const HD_RIVAL_ART_ENTRIES: readonly { key: string; file: string }[] = [
  { key: 'left_body', file: 'rival_left_body.png' },
  { key: 'right_body', file: 'rival_right_body.png' },
  { key: 'left_hat', file: 'rival_left_hat.png' },
  { key: 'right_hat', file: 'rival_right_hat.png' },
];

export interface AssetManifest {
  screen: { width: number; height: number };
  backgrounds: Record<'ZF_NINE' | 'TF_NINE' | 'GF_NINE', string>;
  sheets: Record<'ZR_NINE' | 'TR_NINE' | 'GR_NINE' | 'VR_NINE', string>;
  cards: Record<string, { suit: Suit; rank: Rank; w: number; h: number; path: string }>;
  miniCards: Record<string, { suit: Suit; rank: Rank; srcX: number; srcY: number; w: number; h: number; path: string }>;
  data: { msc: string; res: string; cfg: string };
}

export interface LoadedAssets {
  manifest: AssetManifest;
  backgrounds: Record<'ZF_NINE' | 'TF_NINE' | 'GF_NINE', Texture>;
  hdBackgrounds: Record<'intro' | 'menu' | 'table', Texture>;
  hdCourtArt: Map<string, HTMLImageElement>;
  hdRivalArt: Map<string, HTMLImageElement>;
  sheets: Record<'ZR_NINE' | 'TR_NINE' | 'GR_NINE' | 'VR_NINE', Texture>;
  cards: Map<string, Texture>;
  miniCards: Map<string, Texture>;
  mscBytes: Uint8Array;
  resBytes: Uint8Array;
  cfgBytes: Uint8Array;
}

async function fetchBinary(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function loadNearestTexture(url: string): Promise<Texture> {
  const tex = await Assets.load<Texture>(url);
  tex.source.scaleMode = 'nearest';
  return tex;
}

async function loadLinearTexture(url: string): Promise<Texture> {
  const tex = await Assets.load<Texture>(url);
  tex.source.scaleMode = 'linear';
  return tex;
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load HD image ${url}`));
    img.src = url;
  });
}

export async function loadGameAssets(basePath = `${import.meta.env.BASE_URL}assets`): Promise<LoadedAssets> {
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const manifestRes = await fetch(`${normalizedBase}/manifest.json`);
  if (!manifestRes.ok) {
    throw new Error(`Failed to load assets manifest (${manifestRes.status})`);
  }
  const manifest = (await manifestRes.json()) as AssetManifest;

  const [zf, tf, gf, hdIntro, hdMenu, hdTable, zr, tr, gr, vr, mscBytes, resBytes, cfgBytes] = await Promise.all([
    loadNearestTexture(`${normalizedBase}/${manifest.backgrounds.ZF_NINE}`),
    loadNearestTexture(`${normalizedBase}/${manifest.backgrounds.TF_NINE}`),
    loadNearestTexture(`${normalizedBase}/${manifest.backgrounds.GF_NINE}`),
    loadLinearTexture(`${normalizedBase}/hd/intro_bg_hd.jpg`),
    loadLinearTexture(`${normalizedBase}/hd/menu_bg_hd.jpg`),
    loadLinearTexture(`${normalizedBase}/hd/table_bg_hd.jpg`),
    loadNearestTexture(`${normalizedBase}/${manifest.sheets.ZR_NINE}`),
    loadNearestTexture(`${normalizedBase}/${manifest.sheets.TR_NINE}`),
    loadNearestTexture(`${normalizedBase}/${manifest.sheets.GR_NINE}`),
    loadNearestTexture(`${normalizedBase}/${manifest.sheets.VR_NINE}`),
    fetchBinary(`${normalizedBase}/${manifest.data.msc}`),
    fetchBinary(`${normalizedBase}/${manifest.data.res}`),
    fetchBinary(`${normalizedBase}/${manifest.data.cfg}`),
  ]);

  const cardEntries = await Promise.all(
    Object.values(manifest.cards).map(async (entry) => {
      const tex = await loadNearestTexture(`${normalizedBase}/${entry.path}`);
      return [cardKey({ suit: entry.suit, rank: entry.rank }), tex] as const;
    }),
  );

  const miniEntries = await Promise.all(
    Object.values(manifest.miniCards).map(async (entry) => {
      const tex = await loadNearestTexture(`${normalizedBase}/${entry.path}`);
      return [cardKey({ suit: entry.suit, rank: entry.rank }), tex] as const;
    }),
  );

  const hdCourtEntries = await Promise.all(
    HD_COURT_ART_ENTRIES.map(async ({ suit, rank }) => {
      const key = cardKey({ suit, rank });
      const img = await loadHtmlImage(`${normalizedBase}/hd/cards/s${suit}_${rank}.png`);
      return [key, img] as const;
    }),
  );

  const hdRivalEntries = await Promise.all(
    HD_RIVAL_ART_ENTRIES.map(async ({ key, file }) => {
      const img = await loadHtmlImage(`${normalizedBase}/hd/characters/${file}`);
      return [key, img] as const;
    }),
  );

  return {
    manifest,
    backgrounds: { ZF_NINE: zf, TF_NINE: tf, GF_NINE: gf },
    hdBackgrounds: { intro: hdIntro, menu: hdMenu, table: hdTable },
    hdCourtArt: new Map(hdCourtEntries),
    hdRivalArt: new Map(hdRivalEntries),
    sheets: { ZR_NINE: zr, TR_NINE: tr, GR_NINE: gr, VR_NINE: vr },
    cards: new Map(cardEntries),
    miniCards: new Map(miniEntries),
    mscBytes,
    resBytes,
    cfgBytes,
  };
}
