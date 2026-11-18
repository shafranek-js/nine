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

export type HdRivalArtKey =
  | 'left_idle_pose'
  | 'left_blink_sheet'
  | 'left_body'
  | 'right_body'
  | 'left_hat'
  | 'right_hat'
  | 'left_impatient_sheet'
  | 'right_impatient_sheet'
  | 'left_play_left_base_sheet'
  | 'left_play_right_base_sheet'
  | 'left_pick_near_sheet'
  | 'left_pick_far_sheet'
  | 'left_play_sheet'
  | 'right_play_sheet'
  | 'left_purse_sheet'
  | 'right_purse_sheet'
  | 'left_broke_sheet'
  | 'right_broke_sheet'
  | 'left_yawn_sheet'
  | 'right_yawn_sheet'
  | 'left_win_sheet'
  | 'left_lose_sheet';

export const HD_RIVAL_ART_ENTRIES: readonly { key: HdRivalArtKey; file: string }[] = [
  { key: 'left_idle_pose', file: 'rival_left_starting_pose.png' },
  { key: 'left_blink_sheet', file: 'rival_left_blink_sheet.png' },
  { key: 'left_impatient_sheet', file: 'rival_left_impatient_sheet.png' },
  { key: 'left_play_left_base_sheet', file: 'rival_left_play_left_base_sheet.png' },
  { key: 'left_play_right_base_sheet', file: 'rival_left_play_right_base_sheet.png' },
  { key: 'left_pick_near_sheet', file: 'rival_left_pick_near_sheet.png' },
  { key: 'left_pick_far_sheet', file: 'rival_left_pick_far_sheet.png' },
  { key: 'left_purse_sheet', file: 'rival_left_purse_sheet.png' },
  { key: 'left_broke_sheet', file: 'rival_left_broke_sheet.png' },
  { key: 'left_yawn_sheet', file: 'rival_left_yawn_sheet.png' },
  { key: 'left_win_sheet', file: 'rival_left_win_sheet.png' },
  { key: 'left_lose_sheet', file: 'rival_left_lose_sheet.png' },
];

export type HdDealerArtKey =
  | 'idle_pose'
  | 'blink_sheet'
  | 'body'
  | 'hat'
  | 'wag_sheet'
  | 'bell_sheet'
  | 'hat_tip_sheet'
  | 'shuffle_sheet'
  // Future swappable 4x4 PNG sheets (currently rendered via temporary vector overlays in hdCharacters.ts):
  | 'deal_sheet'
  | 'hat_collect_sheet'
  | 'pour_left_sheet'
  | 'pour_right_sheet'
  | 'pour_down_sheet';

export const HD_DEALER_ART_ENTRIES: readonly { key: HdDealerArtKey; file: string }[] = [
  { key: 'idle_pose', file: 'dealer_starting_pose.png' },
  { key: 'blink_sheet', file: 'dealer_blink_sheet.png' },
  { key: 'body', file: 'dealer_body.png' },
  { key: 'hat', file: 'dealer_hat.png' },
  { key: 'wag_sheet', file: 'dealer_wag_sheet.png' },
  { key: 'bell_sheet', file: 'dealer_bell_sheet.png' },
  { key: 'hat_tip_sheet', file: 'dealer_hat_tip_sheet.png' },
  { key: 'shuffle_sheet', file: 'dealer_shuffle_sheet.png' },
  { key: 'deal_sheet', file: 'dealer_deal_sheet.png' },
  { key: 'hat_collect_sheet', file: 'dealer_hat_collect_sheet.png' },
  { key: 'pour_left_sheet', file: 'dealer_pour_left_sheet.png' },
  { key: 'pour_right_sheet', file: 'dealer_pour_right_sheet.png' },
  { key: 'pour_down_sheet', file: 'dealer_pour_down_sheet.png' },
];

export const HD_TRUMPETER_ART_FILE = 'trumpeter_sheet.png';
export const HD_CANDELABRA_ART_FILE = 'candelabra_sheet.png';

export const HD_MENU_ART_FILES: Readonly<Record<'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'keys', string>> = {
  f1: 'menu_f1_chair.png',
  f2: 'menu_f2_sheet.png',
  f3: 'menu_f3_sheet.png',
  f4: 'menu_f4_sheet.png',
  f5: 'menu_f5_sheet.png',
  keys: 'menu_keys_sheet.png',
};

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
  hdBanners: Record<'nine' | 'club' | 'monteCarlo', Texture>;
  hdMenu: Record<'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'keys', Texture>;
  hdCourtArt: Map<string, HTMLImageElement>;
  hdRivalArt: Map<string, HTMLImageElement>;
  hdDealerArt: Map<string, HTMLImageElement>;
  hdTrumpeterArt: HTMLImageElement | null;
  hdCandelabraArt: HTMLImageElement | null;
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

function loadOptionalHtmlImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function loadOptionalLinearTexture(url: string): Promise<Texture> {
  return Assets.load<Texture>(url)
    .then((tex) => {
      tex.source.scaleMode = 'linear';
      return tex;
    })
    .catch(() => Texture.EMPTY);
}

let hdAssetsLoadPromise: Promise<void> | null = null;

/**
 * Starts (or returns the in-flight) non-blocking load of optional HD character, court-card, and menu
 * art so the core game boots immediately without waiting on multi-megabyte HD PNG sheets.
 */
export function preloadHdAssetsInBackground(
  assets: LoadedAssets,
  basePath = `${import.meta.env.BASE_URL}assets`,
  onReady?: () => void,
): Promise<void> {
  if (hdAssetsLoadPromise) return hdAssetsLoadPromise;
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  hdAssetsLoadPromise = (async () => {
    const [hdCourtEntries, hdRivalEntries, hdDealerEntries, hdTrumpeterArt, hdCandelabraArt] = await Promise.all([
      Promise.all(
        HD_COURT_ART_ENTRIES.map(async ({ suit, rank }) => {
          const key = cardKey({ suit, rank });
          const img = await loadOptionalHtmlImage(`${normalizedBase}/hd/cards/s${suit}_${rank}.png`);
          return img ? ([key, img] as const) : null;
        }),
      ),
      Promise.all(
        HD_RIVAL_ART_ENTRIES.map(async ({ key, file }) => {
          const img = await loadOptionalHtmlImage(`${normalizedBase}/hd/characters/${file}`);
          return img ? ([key, img] as const) : null;
        }),
      ),
      Promise.all(
        HD_DEALER_ART_ENTRIES.map(async ({ key, file }) => {
          const img = await loadOptionalHtmlImage(`${normalizedBase}/hd/characters/${file}`);
          return img ? ([key, img] as const) : null;
        }),
      ),
      loadOptionalHtmlImage(`${normalizedBase}/hd/characters/${HD_TRUMPETER_ART_FILE}`),
      loadOptionalHtmlImage(`${normalizedBase}/hd/characters/${HD_CANDELABRA_ART_FILE}`),
    ]);

    for (const entry of hdCourtEntries) {
      if (entry) assets.hdCourtArt.set(entry[0], entry[1]);
    }
    for (const entry of hdRivalEntries) {
      if (entry) assets.hdRivalArt.set(entry[0], entry[1]);
    }
    for (const entry of hdDealerEntries) {
      if (entry) assets.hdDealerArt.set(entry[0], entry[1]);
    }
    if (hdTrumpeterArt) {
      assets.hdTrumpeterArt = hdTrumpeterArt;
    }
    if (hdCandelabraArt) {
      assets.hdCandelabraArt = hdCandelabraArt;
    }
    onReady?.();
  })();

  return hdAssetsLoadPromise;
}

export async function loadGameAssets(basePath = `${import.meta.env.BASE_URL}assets`): Promise<LoadedAssets> {
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const manifestRes = await fetch(`${normalizedBase}/manifest.json`);
  if (!manifestRes.ok) {
    throw new Error(`Failed to load assets manifest (${manifestRes.status})`);
  }
  const manifest = (await manifestRes.json()) as AssetManifest;

  const [
    zf,
    tf,
    gf,
    hdIntro,
    hdMenu,
    hdTable,
    hdBannerNine,
    hdBannerClub,
    hdBannerMonteCarlo,
    hdMenuF1,
    hdMenuF2,
    hdMenuF3,
    hdMenuF4,
    hdMenuF5,
    hdMenuKeys,
    zr,
    tr,
    gr,
    vr,
    mscBytes,
    resBytes,
    cfgBytes,
  ] = await Promise.all([
    loadNearestTexture(`${normalizedBase}/${manifest.backgrounds.ZF_NINE}`),
    loadNearestTexture(`${normalizedBase}/${manifest.backgrounds.TF_NINE}`),
    loadNearestTexture(`${normalizedBase}/${manifest.backgrounds.GF_NINE}`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/intro_bg_hd.jpg`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/menu_bg_hd.jpg`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/table_bg_hd.jpg`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/banner_nine_hd.png`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/banner_club_hd.png`),
    loadOptionalLinearTexture(encodeURI(`${normalizedBase}/hd/Glossy Gothic Monte Carlo Logo.png`)),
    loadOptionalLinearTexture(`${normalizedBase}/hd/menu/${HD_MENU_ART_FILES.f1}`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/menu/${HD_MENU_ART_FILES.f2}`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/menu/${HD_MENU_ART_FILES.f3}`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/menu/${HD_MENU_ART_FILES.f4}`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/menu/${HD_MENU_ART_FILES.f5}`),
    loadOptionalLinearTexture(`${normalizedBase}/hd/menu/${HD_MENU_ART_FILES.keys}`),
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

  // Start loading the lightweight Intro trumpeter & candelabra first alongside core assets,
  // while the 25MB+ rival/dealer/court sprite sheets stream in the background via preloadHdAssetsInBackground().
  const [hdTrumpeterArt, hdCandelabraArt] = await Promise.all([
    loadOptionalHtmlImage(`${normalizedBase}/hd/characters/${HD_TRUMPETER_ART_FILE}`),
    loadOptionalHtmlImage(`${normalizedBase}/hd/characters/${HD_CANDELABRA_ART_FILE}`),
  ]);

  const loadedAssets: LoadedAssets = {
    manifest,
    backgrounds: { ZF_NINE: zf, TF_NINE: tf, GF_NINE: gf },
    hdBackgrounds: { intro: hdIntro, menu: hdMenu, table: hdTable },
    hdBanners: { nine: hdBannerNine, club: hdBannerClub, monteCarlo: hdBannerMonteCarlo },
    hdMenu: {
      f1: hdMenuF1,
      f2: hdMenuF2,
      f3: hdMenuF3,
      f4: hdMenuF4,
      f5: hdMenuF5,
      keys: hdMenuKeys,
    },
    hdCourtArt: new Map(),
    hdRivalArt: new Map(),
    hdDealerArt: new Map(),
    hdTrumpeterArt,
    hdCandelabraArt,
    sheets: { ZR_NINE: zr, TR_NINE: tr, GR_NINE: gr, VR_NINE: vr },
    cards: new Map(cardEntries),
    miniCards: new Map(miniEntries),
    mscBytes,
    resBytes,
    cfgBytes,
  };

  // Kick off background loading of HD rival, dealer, and court card sheets without blocking startup
  void preloadHdAssetsInBackground(loadedAssets, normalizedBase);

  return loadedAssets;
}
