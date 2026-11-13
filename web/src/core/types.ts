/**
 * Core types for 1:1 restoration of "Девятка / Monte Carlo" (NINE.EXE, Gamos 1993).
 *
 * Verified directly from NINE_MAIN_CODE.asm and NineTypes.pas:
 * - Screen coordinate space: 640x350 EGA (16 colors)
 * - Deck: 36 cards (ranks 6..14, suits 1..4)
 * - Seats: 3 players (1 = Left Bot, 2 = Right Bot, 3 = Human), 12 cards each
 */

export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 350;

export const INITIAL_PLAYER_CASH = 200;
export const ANTE_AMOUNT = 20;
export const PASS_PENALTY = 20;

export const RES_TABLES_COUNT = 3;
export const RES_ROWS_PER_TABLE = 10;
export const RES_RECORD_SIZE = 20;
export const RES_TOTAL_SIZE = RES_TABLES_COUNT * RES_ROWS_PER_TABLE * RES_RECORD_SIZE; // 600 bytes

export enum Suit {
  Spades = 1,   // V_* (Пики)
  Clubs = 2,    // K_* (Трефы)
  Diamonds = 3, // B_* (Бубны)
  Hearts = 4,   // C_* (Червы)
}

export type Rank = 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

/** 1 = Left Bot, 2 = Right Bot, 3 = Human player at bottom */
export type SeatIndex = 1 | 2 | 3;

/** 1..3 club tables (also controls bot AI difficulty & active Nine.res table) */
export type ClubTableId = 1 | 2 | 3;

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface SuitBounds {
  /** Lowest rank placed on table in this suit (0 when suit not yet opened, 6..9 when open) */
  low: number;
  /** Highest rank placed on table in this suit (0 when suit not yet opened, 9..14 when open) */
  high: number;
}

export type TableBounds = Record<Suit, SuitBounds>;

export interface HighScoreRow {
  /** Player name, up to 8 chars (decoded from XOR 0xFF in NINE.RES) */
  name: string;
  /** Password/extra tag, up to 8 chars (decoded from XOR 0xFF in NINE.RES) */
  password: string;
  /** Cumulative score ($), 2-byte little-endian int16 */
  score: number;
}

export interface NineConfig {
  /** First byte of NINE.CFG (0x370C / 0x35DE): toggles AdLib music & SFX */
  soundMusicEnabled: boolean;
  /** Second byte of NINE.CFG (0x38BA / 0x35DF): active club table 1..3 */
  clubTable: ClubTableId;
}

export interface RoundState {
  hands: Record<SeatIndex, Card[]>;
  tableBounds: TableBounds;
  /** Played card sequence order on table (0x2fe7 / 0x3077) */
  playedCount: number;
  currentTurn: SeatIndex;
  /** True before the mandatory 9 of Diamonds opening move of the round */
  isFirstTurnOfRound: boolean;
  /** Bank pot in dollars ($) */
  bank: number;
  /** Number of consecutive or total passes if needed for diagnostics */
  roundOver: boolean;
  winner: SeatIndex | null;
}

export interface MatchState {
  playerName: string;
  playerPassword: string;
  /** Stored net carryover score bonus from Nine.res (row.score - 200) */
  clubCarryover: number;
  clubTable: ClubTableId;
  cash: Record<SeatIndex, number>;
  roundNumber: number;
  round: RoundState | null;
  matchOver: boolean;
}
