import { describe, expect, it } from 'vitest';
import { selectBotMove } from '../src/core/ai.js';
import { createSeededRng } from '../src/core/rng.js';
import { createEmptyTableBounds } from '../src/core/rules.js';
import { Suit, type RoundState } from '../src/core/types.js';

describe('AI move selection (CS:6020..6DE3)', () => {
  it('always opens with 9♦ on the first turn of a round', () => {
    const round: RoundState = {
      hands: {
        1: [
          { suit: Suit.Spades, rank: 9 },
          { suit: Suit.Diamonds, rank: 9 },
          { suit: Suit.Hearts, rank: 9 },
        ],
        2: [],
        3: [],
      },
      tableBounds: createEmptyTableBounds(),
      playedCount: 0,
      currentTurn: 1,
      isFirstTurnOfRound: true,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    const chosen = selectBotMove(round, 3, createSeededRng(1));
    expect(chosen).toEqual({ suit: Suit.Diamonds, rank: 9 });
  });

  it('returns null when bot has no legal moves', () => {
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 9, high: 9 };
    const round: RoundState = {
      hands: {
        1: [
          { suit: Suit.Diamonds, rank: 6 },
          { suit: Suit.Hearts, rank: 14 },
        ],
        2: [],
        3: [],
      },
      tableBounds: bounds,
      playedCount: 1,
      currentTurn: 1,
      isFirstTurnOfRound: false,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    expect(selectBotMove(round, 2, createSeededRng(7))).toBeNull();
  });

  it('prefers advancing own safe suit branch instead of opening opponent-locked branches on difficulty 3', () => {
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 9, high: 9 };
    bounds[Suit.Clubs] = { low: 9, high: 9 };

    // Bot 1 holds Clubs 8 & 7 & 6 (self-sufficient low branch, tailGap=0)
    // and Diamonds 10 (with Diamonds J,Q,K,A held by opponents -> tailGap=4, danger!)
    const round: RoundState = {
      hands: {
        1: [
          { suit: Suit.Clubs, rank: 8 },
          { suit: Suit.Clubs, rank: 7 },
          { suit: Suit.Clubs, rank: 6 },
          { suit: Suit.Diamonds, rank: 10 },
        ],
        2: [
          { suit: Suit.Diamonds, rank: 13 },
          { suit: Suit.Diamonds, rank: 14 },
        ],
        3: [
          { suit: Suit.Diamonds, rank: 11 },
          { suit: Suit.Diamonds, rank: 12 },
        ],
      },
      tableBounds: bounds,
      playedCount: 2,
      currentTurn: 1,
      isFirstTurnOfRound: false,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    const chosen = selectBotMove(round, 3, createSeededRng(1));
    expect(chosen).toEqual({ suit: Suit.Clubs, rank: 8 });
  });
});
