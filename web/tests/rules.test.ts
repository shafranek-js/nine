import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../src/core/rng.js';
import {
  applyMove,
  applyPass,
  computeHandLayout,
  createEmptyTableBounds,
  createMatch,
  getFinalClubScore,
  getLegalMoves,
  isLegalMove,
  nextSeat,
  shuffleAndDeal,
  sortHand,
} from '../src/core/rules.js';
import { Suit, type MatchState } from '../src/core/types.js';

describe('rules engine (1:1 DOS NINE.EXE)', () => {
  it('deals 36 unique cards (12 each across 3 seats) and starts with 9♦ holder', () => {
    const rng = createSeededRng(1993);
    const { hands, firstTurn } = shuffleAndDeal(rng);

    expect(hands[1]).toHaveLength(12);
    expect(hands[2]).toHaveLength(12);
    expect(hands[3]).toHaveLength(12);

    const seen = new Set<string>();
    let nineDiamondsOwner = 0;
    for (const seat of [1, 2, 3] as const) {
      for (const c of hands[seat]) {
        const key = `${c.suit}-${c.rank}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        if (c.suit === Suit.Diamonds && c.rank === 9) {
          nineDiamondsOwner = seat;
        }
      }
    }
    expect(seen.size).toBe(36);
    expect(firstTurn).toBe(nineDiamondsOwner);
  });

  it('collects $20 ante per seat ($180 cash each, $60 BANK) on round start', () => {
    const match = createMatch('Alice', 'pw', 50, 2, createSeededRng(42));
    expect(match.cash[1]).toBe(180);
    expect(match.cash[2]).toBe(180);
    expect(match.cash[3]).toBe(180);
    expect(match.round?.bank).toBe(60);
    expect(match.round?.isFirstTurnOfRound).toBe(true);
  });

  it('allows only 9♦ on first turn, then any 9 or adjacent rank', () => {
    const bounds = createEmptyTableBounds();
    expect(isLegalMove({ suit: Suit.Diamonds, rank: 9 }, bounds, true)).toBe(true);
    expect(isLegalMove({ suit: Suit.Spades, rank: 9 }, bounds, true)).toBe(false);
    expect(isLegalMove({ suit: Suit.Diamonds, rank: 8 }, bounds, true)).toBe(false);

    bounds[Suit.Diamonds] = { low: 9, high: 9 };
    expect(isLegalMove({ suit: Suit.Diamonds, rank: 8 }, bounds, false)).toBe(true);
    expect(isLegalMove({ suit: Suit.Diamonds, rank: 10 }, bounds, false)).toBe(true);
    expect(isLegalMove({ suit: Suit.Diamonds, rank: 7 }, bounds, false)).toBe(false);
    expect(isLegalMove({ suit: Suit.Hearts, rank: 9 }, bounds, false)).toBe(true);
    expect(isLegalMove({ suit: Suit.Hearts, rank: 8 }, bounds, false)).toBe(false);
  });

  it('deducts $20 into BANK on pass and triggers round win + bankruptcy', () => {
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 9, high: 9 };

    const scripted: MatchState = {
      playerName: 'Tester',
      playerPassword: '123',
      clubCarryover: 100,
      clubTable: 1,
      cash: { 1: 20, 2: 180, 3: 180 },
      roundNumber: 1,
      matchOver: false,
      round: {
        hands: {
          1: [{ suit: Suit.Hearts, rank: 6 }],
          2: [{ suit: Suit.Diamonds, rank: 8 }],
          3: [{ suit: Suit.Diamonds, rank: 10 }],
        },
        tableBounds: bounds,
        playedCount: 1,
        currentTurn: 1,
        isFirstTurnOfRound: false,
        bank: 60,
        roundOver: false,
        winner: null,
      },
    };

    expect(getLegalMoves(scripted.round!.hands[1], scripted.round!.tableBounds, false)).toEqual([]);
    const afterPass = applyPass(scripted);
    expect(afterPass.cash[1]).toBe(0);
    expect(afterPass.round!.bank).toBe(80);
    expect(afterPass.round!.currentTurn).toBe(nextSeat(1));

    const afterWin = applyMove(afterPass, { suit: Suit.Diamonds, rank: 8 });
    expect(afterWin.round!.roundOver).toBe(true);
    expect(afterWin.round!.winner).toBe(2);
    expect(afterWin.cash[2]).toBe(260);
    expect(afterWin.round!.bank).toBe(0);
    // Seat 1 ended the round at $0 <= 0 -> match ends
    expect(afterWin.matchOver).toBe(true);
    expect(getFinalClubScore(afterWin)).toBe(280);
  });

  it('sorts hand and computes exact ASM overlap layout coordinates', () => {
    const hand = sortHand([
      { suit: Suit.Hearts, rank: 14 },
      { suit: Suit.Spades, rank: 9 },
      { suit: Suit.Spades, rank: 6 },
      { suit: Suit.Diamonds, rank: 10 },
      { suit: Suit.Clubs, rank: 8 },
    ]);
    expect(hand.map((c) => `${c.suit}:${c.rank}`)).toEqual(['1:6', '1:9', '2:8', '3:10', '4:14']);

    const layout = computeHandLayout(hand);
    expect(layout).toHaveLength(5);
    // 4 suits present -> baseX = floor((464 - 4*83)/2) = 66
    expect(layout[0].x).toBe(66);
    expect(layout[0].y).toBe(262);
    expect(layout[0].hitWidth).toBe(16);
    expect(layout[1].x).toBe(66 + 16);
    expect(layout[1].hitWidth).toBe(83);
    expect(layout[2].x).toBe(66 + 16 + 83 + 16);
  });
});
