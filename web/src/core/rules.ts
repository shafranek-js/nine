import type { Rng } from './rng.js';
import {
  ANTE_AMOUNT,
  INITIAL_PLAYER_CASH,
  PASS_PENALTY,
  Suit,
  type Card,
  type ClubTableId,
  type MatchState,
  type Rank,
  type RoundState,
  type SeatIndex,
  type TableBounds,
} from './types.js';

export const CARDS_PER_SUIT = 9;
export const CARDS_PER_PLAYER = 12;
export const TOTAL_CARDS = 36;
export const SUITS: readonly Suit[] = [Suit.Spades, Suit.Clubs, Suit.Diamonds, Suit.Hearts];
export const HAND_CARD_WIDTH = 88;
export const HAND_CARD_HEIGHT = 89;
export const HAND_CARD_HIT_WIDTH = 83; // DS:3A9Eh (0x53) from CS:519E
export const HAND_OVERLAP_STEP = 16;   // +0x10 within same suit
export const HAND_TOP_Y = 262;         // DS:3A80h (0x106)
export const HAND_AREA_WIDTH = 464;    // 0x01D0 from CS:8784

export interface HandCardLayout {
  card: Card;
  x: number;
  y: number;
  hitWidth: number;
  width: number;
  height: number;
}

export function createEmptyTableBounds(): TableBounds {
  return {
    [Suit.Spades]: { low: 0, high: 0 },
    [Suit.Clubs]: { low: 0, high: 0 },
    [Suit.Diamonds]: { low: 0, high: 0 },
    [Suit.Hearts]: { low: 0, high: 0 },
  };
}

export function cardKey(card: Card): string {
  return `s${card.suit}_${card.rank}`;
}

/** Sort key matching CS:8639..8748: (Suit - 1) * 9 + (Rank - 6). */
export function sortKey(card: Card): number {
  return (card.suit - 1) * CARDS_PER_SUIT + (card.rank - 6);
}

export function sortHand(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => sortKey(a) - sortKey(b));
}

export function nextSeat(seat: SeatIndex): SeatIndex {
  return seat === 1 ? 2 : seat === 2 ? 3 : 1;
}

/**
 * Deals 36 cards across 3 seats × 12 slots matching ShuffleAndDeal36Cards (CS:825C..842D).
 * Holder of 9♦ takes the opening turn of the round.
 */
export function shuffleAndDeal(rng: Rng): {
  hands: Record<SeatIndex, Card[]>;
  firstTurn: SeatIndex;
} {
  const used = new Array<boolean>(TOTAL_CARDS).fill(false);
  let remaining = TOTAL_CARDS;
  const hands: Record<SeatIndex, Card[]> = { 1: [], 2: [], 3: [] };
  let firstTurn: SeatIndex = 1;

  for (let slot = 0; slot < CARDS_PER_PLAYER; slot++) {
    for (const seat of [1, 2, 3] as const) {
      const rndPick = rng.nextInt(remaining);
      let code = -1;
      let countFree = -1;
      while (countFree < rndPick) {
        code++;
        if (!used[code]) {
          countFree++;
        }
      }
      used[code] = true;
      remaining--;

      const suit = (Math.floor(code / CARDS_PER_SUIT) + 1) as Suit;
      const rank = ((code % CARDS_PER_SUIT) + 6) as Rank;
      hands[seat].push({ suit, rank });

      if (suit === Suit.Diamonds && rank === 9) {
        firstTurn = seat;
      }
    }
  }

  return { hands, firstTurn };
}

export function isLegalMove(
  card: Card,
  tableBounds: TableBounds,
  isFirstTurnOfRound: boolean,
): boolean {
  if (isFirstTurnOfRound) {
    return card.suit === Suit.Diamonds && card.rank === 9;
  }
  const bounds = tableBounds[card.suit];
  if (bounds.low === 0) {
    return card.rank === 9;
  }
  return card.rank === bounds.low - 1 || card.rank === bounds.high + 1;
}

export function getLegalMoves(
  hand: readonly Card[],
  tableBounds: TableBounds,
  isFirstTurnOfRound: boolean,
): Card[] {
  return hand.filter((c) => isLegalMove(c, tableBounds, isFirstTurnOfRound));
}

export function createMatch(
  playerName: string,
  playerPassword: string,
  clubCarryover: number,
  clubTable: ClubTableId,
  rng: Rng,
): MatchState {
  const base: MatchState = {
    playerName,
    playerPassword,
    clubCarryover,
    clubTable,
    cash: {
      1: INITIAL_PLAYER_CASH,
      2: INITIAL_PLAYER_CASH,
      3: INITIAL_PLAYER_CASH,
    },
    roundNumber: 0,
    round: null,
    matchOver: false,
  };
  return startNextRound(base, rng);
}

/**
 * Starts a round: collects $20 ante from each player into BANK ($60),
 * shuffles 36 cards across 3 seats, and assigns first turn to 9♦ holder.
 */
export function startNextRound(match: MatchState, rng: Rng): MatchState {
  const { hands, firstTurn } = shuffleAndDeal(rng);
  const cash: Record<SeatIndex, number> = {
    1: match.cash[1] - ANTE_AMOUNT,
    2: match.cash[2] - ANTE_AMOUNT,
    3: match.cash[3] - ANTE_AMOUNT,
  };
  const round: RoundState = {
    hands: {
      1: sortHand(hands[1]),
      2: sortHand(hands[2]),
      3: sortHand(hands[3]),
    },
    tableBounds: createEmptyTableBounds(),
    playedCount: 0,
    currentTurn: firstTurn,
    isFirstTurnOfRound: true,
    bank: ANTE_AMOUNT * 3,
    roundOver: false,
    winner: null,
  };
  return {
    ...match,
    cash,
    roundNumber: match.roundNumber + 1,
    round,
  };
}

export function applyMove(state: MatchState, card: Card): MatchState {
  const round = state.round;
  if (!round || round.roundOver || state.matchOver) {
    throw new Error('Cannot apply move when round or match is over');
  }
  const seat = round.currentTurn;
  const hand = round.hands[seat];
  const idx = hand.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
  if (idx === -1) {
    throw new Error(`Card s${card.suit}_${card.rank} is not in seat ${seat}'s hand`);
  }
  if (!isLegalMove(card, round.tableBounds, round.isFirstTurnOfRound)) {
    throw new Error(`Card s${card.suit}_${card.rank} is not a legal move`);
  }

  const nextBounds: TableBounds = {
    [Suit.Spades]: { ...round.tableBounds[Suit.Spades] },
    [Suit.Clubs]: { ...round.tableBounds[Suit.Clubs] },
    [Suit.Diamonds]: { ...round.tableBounds[Suit.Diamonds] },
    [Suit.Hearts]: { ...round.tableBounds[Suit.Hearts] },
  };
  const cur = nextBounds[card.suit];
  if (cur.low === 0) {
    cur.low = card.rank;
    cur.high = card.rank;
  } else if (card.rank < cur.low) {
    cur.low = card.rank;
  } else {
    cur.high = card.rank;
  }

  const nextSeatHand = hand.filter((_, i) => i !== idx);
  const nextHands: Record<SeatIndex, Card[]> = {
    ...round.hands,
    [seat]: nextSeatHand,
  };

  if (nextSeatHand.length === 0) {
    // Round won: winner collects entire bank (CS:3DBA..3E49)
    const nextCash: Record<SeatIndex, number> = {
      ...state.cash,
      [seat]: state.cash[seat] + round.bank,
    };
    const matchOver = nextCash[1] <= 0 || nextCash[2] <= 0 || nextCash[3] <= 0;
    return {
      ...state,
      cash: nextCash,
      matchOver,
      round: {
        ...round,
        hands: nextHands,
        tableBounds: nextBounds,
        playedCount: round.playedCount + 1,
        isFirstTurnOfRound: false,
        bank: 0,
        roundOver: true,
        winner: seat,
      },
    };
  }

  return {
    ...state,
    round: {
      ...round,
      hands: nextHands,
      tableBounds: nextBounds,
      playedCount: round.playedCount + 1,
      isFirstTurnOfRound: false,
      currentTurn: nextSeat(seat),
    },
  };
}

/**
 * Current seat has no legal moves: deducts $20 pass fee into BANK and advances turn.
 */
export function applyPass(state: MatchState): MatchState {
  const round = state.round;
  if (!round || round.roundOver || state.matchOver) {
    throw new Error('Cannot pass when round or match is over');
  }
  const seat = round.currentTurn;
  const legal = getLegalMoves(round.hands[seat], round.tableBounds, round.isFirstTurnOfRound);
  if (legal.length > 0) {
    throw new Error(`Seat ${seat} has ${legal.length} legal move(s) and cannot pass`);
  }

  return {
    ...state,
    cash: {
      ...state.cash,
      [seat]: state.cash[seat] - PASS_PENALTY,
    },
    round: {
      ...round,
      bank: round.bank + PASS_PENALTY,
      currentTurn: nextSeat(seat),
    },
  };
}

export interface HandLayoutOptions {
  readonly cardWidth?: number;
  readonly cardHitWidth?: number;
  readonly overlapStep?: number;
  readonly areaWidth?: number;
}

/**
 * Computes exact pixel coordinates & hitboxes for the human hand fan
 * matching SortAndRenderPlayerHand (CS:8752..8832).
 */
export function computeHandLayout(cards: readonly Card[], opts: HandLayoutOptions = {}): HandCardLayout[] {
  if (cards.length === 0) return [];
  const cardWidth = opts.cardWidth ?? HAND_CARD_WIDTH;
  const cardHitWidth = opts.cardHitWidth ?? HAND_CARD_HIT_WIDTH;
  const overlapStep = opts.overlapStep ?? HAND_OVERLAP_STEP;
  const areaWidth = opts.areaWidth ?? HAND_AREA_WIDTH;

  const sorted = sortHand(cards);
  const suitsPresent = new Set<Suit>();
  for (const c of sorted) suitsPresent.add(c.suit);

  const baseX = Math.floor((areaWidth - suitsPresent.size * cardHitWidth) / 2);
  const result: HandCardLayout[] = [];
  let curX = baseX;

  for (let i = 0; i < sorted.length; i++) {
    const card = sorted[i];
    const next = i + 1 < sorted.length ? sorted[i + 1] : null;
    const sameNextSuit = next !== null && next.suit === card.suit;
    const hitWidth = sameNextSuit ? overlapStep : cardHitWidth;

    result.push({
      card,
      x: curX,
      y: HAND_TOP_Y,
      hitWidth,
      width: cardWidth,
      height: HAND_CARD_HEIGHT,
    });

    if (next) {
      curX += next.suit === card.suit ? overlapStep : cardHitWidth + overlapStep;
    }
  }

  return result;
}

export function getFinalClubScore(state: MatchState): number {
  return state.clubCarryover + state.cash[3];
}
