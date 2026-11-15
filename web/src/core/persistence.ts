import {
  RES_RECORD_SIZE,
  RES_ROWS_PER_TABLE,
  RES_TABLES_COUNT,
  RES_TOTAL_SIZE,
  type ClubTableId,
  type HighScoreRow,
  type NineConfig,
} from './types.js';

const STORAGE_RES_KEY = 'nine_club_res_b64_v1';
const STORAGE_CFG_KEY = 'nine_club_cfg_v2';
const STORAGE_LAST_PLAYER_KEY = 'nine_last_player_v1';

export interface StoredLastPlayer {
  name: string;
  password: string;
}

export type HighScoreTables = Record<ClubTableId, HighScoreRow[]>;

/**
 * Returns true if a Unicode character code maps cleanly to CP866 without
 * falling back to '?'. Matches the exact set handled by `unicodeToCp866Byte`.
 */
export function isEncodableProfileCharCode(code: number): boolean {
  return (
    (code >= 0x20 && code <= 0x7e) ||
    (code >= 0x0410 && code <= 0x044f) ||
    code === 0x0401 ||
    code === 0x0451 ||
    code === 0x2116
  );
}

/**
 * Returns true if `ch` is a single character that can be stored losslessly
 * in NINE.RES CP866 name/password fields.
 */
export function isEncodableProfileChar(ch: string): boolean {
  return ch.length === 1 && isEncodableProfileCharCode(ch.charCodeAt(0));
}

function unicodeToCp866Byte(code: number): number {
  if (code >= 0x20 && code <= 0x7e) return code;
  if (code >= 0x0410 && code <= 0x042f) return 0x80 + (code - 0x0410); // А..Я
  if (code >= 0x0430 && code <= 0x043f) return 0xa0 + (code - 0x0430); // а..п
  if (code >= 0x0440 && code <= 0x044f) return 0xe0 + (code - 0x0440); // р..я
  if (code === 0x0401) return 0xf0; // Ё
  if (code === 0x0451) return 0xf1; // ё
  if (code === 0x2116) return 0xfc; // №
  return 0x3f; // '?'
}

function cp866ByteToChar(byte: number): string {
  if (byte >= 0x20 && byte <= 0x7e) return String.fromCharCode(byte);
  if (byte >= 0x80 && byte <= 0x9f) return String.fromCharCode(0x0410 + (byte - 0x80)); // А..Я
  if (byte >= 0xa0 && byte <= 0xaf) return String.fromCharCode(0x0430 + (byte - 0xa0)); // а..п
  if (byte >= 0xe0 && byte <= 0xef) return String.fromCharCode(0x0440 + (byte - 0xe0)); // р..я
  if (byte === 0xf0) return 'Ё';
  if (byte === 0xf1) return 'ё';
  if (byte === 0xfc) return '№';
  return '';
}

/** Encode printable ASCII + Cyrillic (CP866) up to 8 bytes with XOR 0xFF obfuscation (CS:6E10). */
function encodePascalString8XorFF(text: string, out: Uint8Array, offset: number): void {
  const clean = text.slice(0, 8);
  out[offset] = clean.length;
  for (let i = 0; i < 8; i++) {
    const ch = i < clean.length ? unicodeToCp866Byte(clean.charCodeAt(i)) : 0x20;
    out[offset + 1 + i] = ch ^ 0xff;
  }
}

function decodePascalString8XorFF(bytes: Uint8Array, offset: number): string {
  const len = Math.min(8, bytes[offset] ?? 0);
  let out = '';
  for (let i = 0; i < len; i++) {
    const code = (bytes[offset + 1 + i] ?? 0xff) ^ 0xff;
    out += cp866ByteToChar(code);
  }
  return out;
}

export function createDefaultHighScoreTables(): HighScoreTables {
  const makeRows = (): HighScoreRow[] =>
    Array.from({ length: RES_ROWS_PER_TABLE }, () => ({
      name: 'Noname',
      password: '',
      score: 0,
    }));
  return { 1: makeRows(), 2: makeRows(), 3: makeRows() };
}

export function decodeNineRes(bytes: Uint8Array): HighScoreTables {
  if (bytes.length !== RES_TOTAL_SIZE) {
    throw new Error(`Invalid NINE.RES size ${bytes.length}, expected ${RES_TOTAL_SIZE}`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tables: HighScoreTables = { 1: [], 2: [], 3: [] };

  for (let t = 1; t <= RES_TABLES_COUNT; t++) {
    const tableId = t as ClubTableId;
    for (let r = 0; r < RES_ROWS_PER_TABLE; r++) {
      const base = ((t - 1) * RES_ROWS_PER_TABLE + r) * RES_RECORD_SIZE;
      const name = decodePascalString8XorFF(bytes, base);
      const score = view.getInt16(base + 9, true);
      const password = decodePascalString8XorFF(bytes, base + 11);
      tables[tableId].push({ name, password, score });
    }
  }

  return tables;
}

export function encodeNineRes(tables: HighScoreTables): Uint8Array {
  const out = new Uint8Array(RES_TOTAL_SIZE);
  const view = new DataView(out.buffer);

  for (let t = 1; t <= RES_TABLES_COUNT; t++) {
    const rows = tables[t as ClubTableId];
    for (let r = 0; r < RES_ROWS_PER_TABLE; r++) {
      const row = rows[r] ?? { name: 'Noname', password: '', score: 0 };
      const base = ((t - 1) * RES_ROWS_PER_TABLE + r) * RES_RECORD_SIZE;
      encodePascalString8XorFF(row.name, out, base);
      view.setInt16(base + 9, Math.max(-32768, Math.min(32767, row.score | 0)), true);
      encodePascalString8XorFF(row.password, out, base + 11);
    }
  }
  return out;
}

export function decodeNineCfg(bytes: Uint8Array): NineConfig {
  const soundByte = bytes[0] ?? 1;
  const tableByte = bytes[1] ?? 1;
  const clubTable: ClubTableId =
    tableByte === 2 ? 2 : tableByte === 3 ? 3 : 1;
  return {
    soundMusicEnabled: soundByte !== 0,
    clubTable,
  };
}

export function encodeNineCfg(cfg: NineConfig): Uint8Array {
  return new Uint8Array([cfg.soundMusicEnabled ? 1 : 0, cfg.clubTable]);
}

export function lookupPlayer(
  tables: HighScoreTables,
  clubTable: ClubTableId,
  playerName: string,
): HighScoreRow | null {
  const rows = tables[clubTable];
  const trimmed = playerName.trim();
  if (!trimmed || trimmed.toLowerCase() === 'noname') return null;
  const exact = rows.find((r) => r.name === trimmed && r.name !== 'Noname');
  if (exact) return { ...exact };
  const lower = trimmed.toLowerCase();
  const ci = rows.find((r) => r.name.toLowerCase() === lower && r.name.toLowerCase() !== 'noname');
  return ci ? { ...ci } : null;
}

/**
 * Inserts/updates player score in the selected table and sorts top 10 descending (CS:6F40..70EF).
 */
export function upsertHighScore(
  tables: HighScoreTables,
  clubTable: ClubTableId,
  name: string,
  password: string,
  score: number,
): HighScoreTables {
  const cleanName = name.trim().slice(0, 8);
  if (!cleanName) return tables;

  const existingRows = tables[clubTable].map((r) => ({ ...r }));
  const idx = existingRows.findIndex((r) => r.name === cleanName && cleanName !== 'Noname');

  if (idx !== -1) {
    existingRows[idx] = { name: cleanName, password: password.slice(0, 8), score };
  } else {
    existingRows.push({ name: cleanName, password: password.slice(0, 8), score });
  }

  existingRows.sort((a, b) => {
    const aNoname = a.name === 'Noname' ? 1 : 0;
    const bNoname = b.name === 'Noname' ? 1 : 0;
    if (aNoname !== bNoname) return aNoname - bNoname;
    return b.score - a.score;
  });

  return {
    ...tables,
    [clubTable]: existingRows.slice(0, RES_ROWS_PER_TABLE),
  };
}

export function loadStoredConfig(): NineConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_CFG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NineConfig>;
    return {
      soundMusicEnabled: parsed.soundMusicEnabled !== false,
      clubTable: parsed.clubTable === 2 ? 2 : parsed.clubTable === 3 ? 3 : 1,
    };
  } catch {
    return null;
  }
}

export function saveStoredConfig(cfg: NineConfig): void {
  try {
    localStorage.setItem(STORAGE_CFG_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore storage quota errors in restricted contexts
  }
}

export function loadStoredHighScores(): HighScoreTables | null {
  try {
    const b64 = localStorage.getItem(STORAGE_RES_KEY);
    if (!b64) return null;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return decodeNineRes(bytes);
  } catch {
    return null;
  }
}

export function saveStoredHighScores(tables: HighScoreTables): void {
  try {
    const bytes = encodeNineRes(tables);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    localStorage.setItem(STORAGE_RES_KEY, btoa(bin));
  } catch {
    // Ignore storage errors
  }
}

export function loadStoredLastPlayer(): StoredLastPlayer | null {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_PLAYER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLastPlayer>;
    const name = typeof parsed.name === 'string' ? parsed.name.trim().slice(0, 8) : '';
    if (!name || name.toLowerCase() === 'noname') return null;
    const password = typeof parsed.password === 'string' ? parsed.password.slice(0, 8) : '';
    return { name, password };
  } catch {
    return null;
  }
}

export function saveStoredLastPlayer(player: StoredLastPlayer | null): void {
  try {
    if (!player || !player.name.trim()) {
      localStorage.removeItem(STORAGE_LAST_PLAYER_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_LAST_PLAYER_KEY,
      JSON.stringify({ name: player.name.trim().slice(0, 8), password: player.password.slice(0, 8) }),
    );
  } catch {
    // Ignore storage errors
  }
}
