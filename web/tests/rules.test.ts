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
  resolveRoundRules,
  shuffleAndDeal,
  sortHand,
  startNextRound,
} from '../src/core/rules.js';
import { Suit, type GameRulesConfig, type MatchState } from '../src/core/types.js';

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

  it('deals 52 unique cards (17/17/18 rotating) in Fan Tan mode and fits hand within 640px', () => {
    const fanTanCfg: GameRulesConfig = {
      variant: 'fantan52',
      fanTanOpening: 'sevenDiamonds',
      fanTanHandPenalty: 5,
    };
    const r0 = shuffleAndDeal(createSeededRng(101), fanTanCfg, 0);
    expect(r0.hands[1]).toHaveLength(18);
    expect(r0.hands[2]).toHaveLength(17);
    expect(r0.hands[3]).toHaveLength(17);

    const seen = new Set<string>();
    let sevenDiamondsOwner = 0;
    for (const seat of [1, 2, 3] as const) {
      for (const c of r0.hands[seat]) {
        expect(c.rank).toBeGreaterThanOrEqual(2);
        expect(c.rank).toBeLessThanOrEqual(14);
        const key = `${c.suit}-${c.rank}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        if (c.suit === Suit.Diamonds && c.rank === 7) {
          sevenDiamondsOwner = seat;
        }
      }
    }
    expect(seen.size).toBe(52);
    expect(r0.firstTurn).toBe(sevenDiamondsOwner);

    const r1 = shuffleAndDeal(createSeededRng(101), fanTanCfg, 1);
    expect(r1.hands[2]).toHaveLength(18);
    const r2 = shuffleAndDeal(createSeededRng(101), fanTanCfg, 2);
    expect(r2.hands[3]).toHaveLength(18);

    const layout18 = computeHandLayout(sortHand(r0.hands[1]));
    expect(layout18).toHaveLength(18);
    const last = layout18[layout18.length - 1];
    expect(layout18[0].x).toBeGreaterThanOrEqual(14);
    expect(last.x + last.width).toBeLessThanOrEqual(630);
  });

  it('collects per-card hand penalty in Fan Tan and supports any-7 pass before opening', () => {
    const fanTanAny7: GameRulesConfig = {
      variant: 'fantan52',
      fanTanOpening: 'anySeven',
      fanTanHandPenalty: 5,
    };
    const rules = resolveRoundRules(fanTanAny7);
    const bounds = createEmptyTableBounds();

    // Opening with anySeven when seat 1 holds no 7 -> legal pass while keeping isFirstTurnOfRound
    const openingState: MatchState = {
      playerName: 'FanTan',
      playerPassword: '',
      clubCarryover: 0,
      clubTable: 2,
      ruleConfig: fanTanAny7,
      cash: { 1: 180, 2: 180, 3: 180 },
      roundNumber: 1,
      matchOver: false,
      round: {
        hands: {
          1: [{ suit: Suit.Spades, rank: 14 }], // High Ace (A♠), cannot open!
          2: [{ suit: Suit.Hearts, rank: 7 }],
          3: [{ suit: Suit.Clubs, rank: 7 }],
        },
        tableBounds: bounds,
        playedCount: 0,
        currentTurn: 1,
        isFirstTurnOfRound: true,
        bank: 60,
        rules,
        roundOver: false,
        winner: null,
      },
    };

    expect(getLegalMoves(openingState.round!.hands[1], bounds, true, rules)).toEqual([]);
    const afterFirstPass = applyPass(openingState);
    expect(afterFirstPass.round!.bank).toBe(80);
    expect(afterFirstPass.round!.currentTurn).toBe(2);
    expect(afterFirstPass.round!.isFirstTurnOfRound).toBe(true);

    // Seat 2 plays 7♥ (its last card!) -> wins $80 pot + $5 * (1 + 1) = $10 from seats 1 & 3
    const afterWin = applyMove(afterFirstPass, { suit: Suit.Hearts, rank: 7 });
    expect(afterWin.round!.roundOver).toBe(true);
    expect(afterWin.round!.winner).toBe(2);
    expect(afterWin.round!.lastHandPenaltyCollected).toBe(10);
    expect(afterWin.cash[1]).toBe(155);
    expect(afterWin.cash[3]).toBe(175);
    expect(afterWin.cash[2]).toBe(180 + 80 + 10);

    // Next round advances cleanly
    const r2 = startNextRound(afterWin, createSeededRng(99));
    expect(r2.roundNumber).toBe(2);
    expect(r2.round!.rules?.variant).toBe('fantan52');
  });

  it('supports scaled, lowered, horizontally centered hand layout for Fan Tan HD', () => {
    const single = computeHandLayout([{ suit: Suit.Diamonds, rank: 7 }], {
      cardWidth: 77,
      cardHeight: 78,
      cardHitWidth: 73,
      topY: 269,
      centerHorizontal: true,
    });
    expect(single).toHaveLength(1);
    expect(single[0].y).toBe(269);
    expect(single[0].y + single[0].height).toBeLessThanOrEqual(350);
    expect(single[0].width).toBe(77);
    expect(single[0].height).toBe(78);
    expect(single[0].x).toBe(Math.floor((640 - 77) / 2));

    // 18-card hand across 4 suits keeps full >=17px step so corner ranks/suits stay visible
    const eighteen = [
      ...[1, 2, 3, 4, 5].map((rank) => ({ suit: Suit.Spades, rank: rank as 1 | 2 | 3 | 4 | 5 })),
      ...[6, 7, 8, 9, 10].map((rank) => ({ suit: Suit.Clubs, rank: rank as 6 | 7 | 8 | 9 | 10 })),
      ...[2, 5, 9, 12].map((rank) => ({ suit: Suit.Diamonds, rank: rank as 2 | 5 | 9 | 12 })),
      ...[3, 7, 11, 13].map((rank) => ({ suit: Suit.Hearts, rank: rank as 3 | 7 | 11 | 13 })),
    ];
    const layout18 = computeHandLayout(eighteen, {
      cardWidth: 77,
      cardHeight: 78,
      cardHitWidth: 73,
      overlapStep: 18,
      topY: 269,
      centerHorizontal: true,
    });
    expect(layout18).toHaveLength(18);
    expect(layout18[1].x - layout18[0].x).toBe(18);
    expect(layout18[17].x + layout18[17].width).toBeLessThanOrEqual(628);

    // Enlarged 4:3 Fan Tan HD hand (0.96 scale -> 84x85, hit 80, topY 257) fits inside 640x350 canvas
    const layout18Wide = computeHandLayout(eighteen, {
      cardWidth: 84,
      cardHeight: 85,
      cardHitWidth: 80,
      overlapStep: 18,
      topY: 257,
      centerHorizontal: true,
    });
    expect(layout18Wide).toHaveLength(18);
    expect(layout18Wide[0].y).toBe(257);
    expect(layout18Wide[0].y + layout18Wide[0].height).toBeLessThanOrEqual(350);
    expect(layout18Wide[1].x - layout18Wide[0].x).toBeGreaterThanOrEqual(17);
    expect(layout18Wide[17].x + layout18Wide[17].width).toBeLessThanOrEqual(628);
  });
});
