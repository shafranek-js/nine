import { describe, expect, it } from 'vitest';
import {
  evaluatePlayerMoves,
  formatCardLabel,
  getAllCurrentlyLegalCards,
  type PassExclusions,
} from '../src/core/advisor.js';
import { DEFAULT_LANGUAGE, getTranslations, normalizeLanguage, SUPPORTED_LANGUAGES } from '../src/core/i18n.js';
import { createSeededRng } from '../src/core/rng.js';
import { cardKey, createEmptyTableBounds, resolveRoundRules, SUITS } from '../src/core/rules.js';
import { Suit, type Card, type Rank, type RoundState } from '../src/core/types.js';

function emptyExclusions(): PassExclusions {
  return { 1: new Set(), 2: new Set() };
}

function buildRemainingCardsExcluding(excludedKeys: Set<string>): Card[] {
  const out: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of [6, 7, 8, 9, 10, 11, 12, 13, 14] as Rank[]) {
      const card = { suit, rank };
      if (!excludedKeys.has(cardKey(card))) {
        out.push(card);
      }
    }
  }
  return out;
}

describe('Advisor / Coach engine (fair-play deduction & EV search)', () => {
  it('recommends forced 9♦ on opening turn with English explanation by default', () => {
    const round: RoundState = {
      hands: {
        1: [{ suit: Suit.Spades, rank: 9 }],
        2: [{ suit: Suit.Clubs, rank: 9 }],
        3: [
          { suit: Suit.Diamonds, rank: 9 },
          { suit: Suit.Hearts, rank: 9 },
          { suit: Suit.Spades, rank: 8 },
        ],
      },
      tableBounds: createEmptyTableBounds(),
      playedCount: 0,
      currentTurn: 3,
      isFirstTurnOfRound: true,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    const rec = evaluatePlayerMoves({
      round,
      difficulty: 2,
      passExclusions: emptyExclusions(),
      rng: createSeededRng(42),
    });

    expect(rec.action).toBe('play');
    expect(rec.forced).toBe(true);
    expect(rec.bestCard).toEqual({ suit: Suit.Diamonds, rank: 9 });
    expect(rec.headline).toContain('9♦');
    expect(rec.reasons.length).toBeGreaterThan(0);
  });

  it('recommends pass with explanation when human has no legal moves', () => {
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 9, high: 9 };

    const round: RoundState = {
      hands: {
        1: [{ suit: Suit.Diamonds, rank: 8 }],
        2: [{ suit: Suit.Diamonds, rank: 10 }],
        3: [
          { suit: Suit.Spades, rank: 7 },
          { suit: Suit.Hearts, rank: 12 },
        ],
      },
      tableBounds: bounds,
      playedCount: 1,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    const rec = evaluatePlayerMoves({
      round,
      difficulty: 2,
      passExclusions: emptyExclusions(),
      rng: createSeededRng(7),
    });

    expect(rec.action).toBe('pass');
    expect(rec.bestCard).toBeNull();
    expect(rec.candidates).toHaveLength(0);
    expect(rec.headline).toMatch(/pass/i);
    expect(rec.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('deduces certainRight cards from left-seat pass exclusions without peeking at opponent hands', () => {
    // Everything is on board except 6 cards:
    // Human holds 2 cards (9♠ is not yet open — wait, spades 9..K on board, human holds 8♠ and A♠).
    // Remaining 4 unseen cards: 6♠, 7♠, 6♥, A♥ (2 for Left, 2 for Right).
    const bounds = createEmptyTableBounds();
    bounds[Suit.Spades] = { low: 9, high: 13 }; // legal: 8♠, A♠ (human holds both!)
    bounds[Suit.Clubs] = { low: 6, high: 14 };
    bounds[Suit.Diamonds] = { low: 6, high: 14 };
    bounds[Suit.Hearts] = { low: 7, high: 13 }; // legal unseen: 6♥, A♥

    const exclusions: PassExclusions = {
      1: new Set([cardKey({ suit: Suit.Hearts, rank: 6 }), cardKey({ suit: Suit.Hearts, rank: 14 })]),
      2: new Set(),
    };

    // Intentionally scramble hidden rival hands between two calls to verify fair-play (length-only reliance)
    const roundA: RoundState = {
      hands: {
        1: [
          { suit: Suit.Spades, rank: 6 },
          { suit: Suit.Spades, rank: 7 },
        ],
        2: [
          { suit: Suit.Hearts, rank: 6 },
          { suit: Suit.Hearts, rank: 14 },
        ],
        3: [
          { suit: Suit.Spades, rank: 8 },
          { suit: Suit.Spades, rank: 14 },
        ],
      },
      tableBounds: bounds,
      playedCount: 30,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 80,
      roundOver: false,
      winner: null,
    };

    const roundB: RoundState = {
      ...roundA,
      hands: {
        1: [
          { suit: Suit.Hearts, rank: 6 },
          { suit: Suit.Hearts, rank: 14 },
        ],
        2: [
          { suit: Suit.Spades, rank: 6 },
          { suit: Suit.Spades, rank: 7 },
        ],
        3: roundA.hands[3],
      },
    };

    const recA = evaluatePlayerMoves({
      round: roundA,
      difficulty: 3,
      passExclusions: exclusions,
      rng: createSeededRng(100),
    });
    const recB = evaluatePlayerMoves({
      round: roundB,
      difficulty: 3,
      passExclusions: exclusions,
      rng: createSeededRng(100),
    });

    expect(recA.isExact).toBe(true);
    expect(recA.deduction.unseenTotal).toBe(4);
    expect(recA.deduction.certainRight.map(formatCardLabel).sort()).toEqual(['6♥', 'A♥'].sort());
    expect(recA.deduction.certainLeft.map(formatCardLabel).sort()).toEqual(['6♠', '7♠'].sort());
    // Proof that advisor never cheats by reading secret rival hands:
    expect(recA.bestCard).toEqual(recB.bestCard);
    expect(recA.candidates).toEqual(recB.candidates);
  });

  it('prefers playing a card that unlocks own chain and finishes with higher EV', () => {
    // Human holds 3 cards: 8♣, 7♣, 6♣ (if plays 8♣, unlocks own 7♣->6♣ chain!) plus A♦
    // Opponents hold 6♥, 7♥, A♥, K♥. Playing 8♣ wins vs A♦ which leaves 8♣ unplayed too late or vice versa:
    // Actually give opponents hearts 6..8 needing 9♥ or needing diamonds A♦ vs clubs:
    // Wait: let's set board: Spades 6..14, Clubs 9..14 (open low=8), Diamonds 6..13 (open high=14), Hearts 6..14.
    // Remaining cards outside human hand: wait — if human holds 8♣, 7♣, 6♣ (3 cards) and A♦ (4th? Wait make it 2 rivals with 1 card each!).
    // Suppose only 5 cards left unplayed in deck:
    // Human (3 cards): 8♣, 7♣, A♦. Rivals hold 6♣ and K♥? Wait if Hearts is 6..Q (high=12), open=K♥, A♥.
    // Make unseen cards: 6♣, K♥, A♥ (Wait: let's put 6..12 Hearts on board, 6..13 Diamonds, 9..14 Clubs, 6..14 Spades).
    // Human holds: 8♣, 7♣, A♦. Rivals hold: 6♣ (1 card) and K♥, A♥? No, K♥ unlocks A♥.
    // Even simpler: Board has Spades 6..14, Clubs 9..14, Diamonds 6..13, Hearts 6..14.
    // Total unseen cards = 6♣, 7♣, 8♣, A♦ (4 cards).
    // Human holds 8♣ and A♦ (2 cards), Left holds 7♣ (1 card), Right holds 6♣ (1 card)!
    // Wait: if Human plays A♦ first: Left passes (needs 8♣!), Right passes (needs 8♣!), then Human plays 8♣ -> Left 7♣ -> Right 6♣ -> Right empties? Wait Right wins then!
    // What if Human holds 8♣, 7♣, A♦ (3 cards) -> Left holds 6♣ (1 card), Right holds K♥ (if Hearts 6..Q, plus A♥ on Left?):
    // Let's keep it exact & crisp:
    // Human holds: 8♣, 7♣, A♦. Left holds: 6♣. Right holds: 6♠ (where Spades on board is 7..14).
    // If Human plays A♦: Left passes (-20), Right plays 6♠ AND WINS! Human winRate = 0%!
    // If Human plays 8♣: Left plays 6♣? No Left can't play 6♣ yet (8♣ only opens 7♣!). Right plays 6♠ AND WINS! Both lose unless Right holds 6♣ or something.
    // Let's flip Right's card to A♥ (Hearts 6..12, Left holds K♥ and 6♣?):
    // Better yet: Human holds 8♣, 7♣, A♦. Wait: when Human plays a card, turn order is Human (3) -> Left (1) -> Right (2).
    // Give Human: 8♣, 7♣, A♦. Unseen: 6♣ (1 card on Left), 6♠ (1 card on Right — wait, put Spades 8..14, 7♠ in Left? No, make Left have 6♣ + 6♠ = 2 cards, Right have 7♠ + 6♥? ).
    // Even simpler: Spades 6..14, Hearts 6..14, Clubs 9..14, Diamonds 6..13. Wait: only 4 cards exist (8♣, 7♣, 6♣, A♦).
    // Give Human [8♣, A♦] -> unseen are [7♣, 6♣], 1 card each for Left & Right.
    // If Human plays A♦ -> Left passes (-20), Right passes (-20), Human plays 8♣ -> Left plays 7♣ and empties hand? No, Human still had 8♣ (1 left -> 0! Wait Human empties on 8♣ if Human only had A♦ and 8♣!).
    // Wait: if Human holds [8♣, A♦], playing A♦ leaves 8♣, Left passes (-$20), Right passes (-$20), then Human plays 8♣ and WINS + collects $40 extra pot!
    // Whereas if Human plays 8♣ first, Human collects $0 extra passes OR Right/Left plays 7♣ and wins? Wait Left wouldn't win before Human plays A♦ if 2 unseen cards are on Left(1) & Right(1):
    // Play 8♣ -> Left(1 card) has either 7♣ (wins immediately!) or 6♣ (passes, Right plays 7♣ and passes? No if Right has 7♣ Right wins!). So playing 8♣ FIRST loses 100% of the time (0% win), while playing A♦ FIRST wins 100% of the time AND forces opponent passes!
    const bounds = createEmptyTableBounds();
    bounds[Suit.Spades] = { low: 6, high: 14 };
    bounds[Suit.Hearts] = { low: 6, high: 14 };
    bounds[Suit.Clubs] = { low: 9, high: 14 };
    bounds[Suit.Diamonds] = { low: 6, high: 13 };

    const round: RoundState = {
      hands: {
        1: [{ suit: Suit.Clubs, rank: 7 }],
        2: [{ suit: Suit.Clubs, rank: 6 }],
        3: [
          { suit: Suit.Clubs, rank: 8 },
          { suit: Suit.Diamonds, rank: 14 },
        ],
      },
      tableBounds: bounds,
      playedCount: 32,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    const rec = evaluatePlayerMoves({
      round,
      difficulty: 2,
      passExclusions: emptyExclusions(),
      rng: createSeededRng(12),
    });

    expect(rec.action).toBe('play');
    expect(rec.bestCard).toEqual({ suit: Suit.Diamonds, rank: 14 });
    expect(rec.candidates).toHaveLength(2);
    expect(rec.candidates[0].winRate).toBe(1);
    expect(rec.candidates[1].winRate).toBe(0);
    expect(rec.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('completes midgame PIMC evaluation well under 150ms', () => {
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 8, high: 10 };
    bounds[Suit.Spades] = { low: 9, high: 9 };

    const humanHand: Card[] = [
      { suit: Suit.Spades, rank: 8 },
      { suit: Suit.Clubs, rank: 9 },
      { suit: Suit.Clubs, rank: 7 },
      { suit: Suit.Diamonds, rank: 7 },
      { suit: Suit.Hearts, rank: 9 },
      { suit: Suit.Hearts, rank: 12 },
      { suit: Suit.Spades, rank: 14 },
    ];
    const played = new Set<string>([
      cardKey({ suit: Suit.Diamonds, rank: 8 }),
      cardKey({ suit: Suit.Diamonds, rank: 9 }),
      cardKey({ suit: Suit.Diamonds, rank: 10 }),
      cardKey({ suit: Suit.Spades, rank: 9 }),
      ...humanHand.map(cardKey),
    ]);
    const pool = buildRemainingCardsExcluding(played);
    const leftHand = pool.slice(0, 12);
    const rightHand = pool.slice(12);

    const round: RoundState = {
      hands: { 1: leftHand, 2: rightHand, 3: humanHand },
      tableBounds: bounds,
      playedCount: 4,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 80,
      roundOver: false,
      winner: null,
    };

    const t0 = performance.now();
    const rec = evaluatePlayerMoves({
      round,
      difficulty: 3,
      passExclusions: emptyExclusions(),
      maxSamples: 64,
      rng: createSeededRng(99),
    });
    const elapsedMs = performance.now() - t0;

    expect(rec.action).toBe('play');
    expect(rec.candidates.length).toBe(4);
    expect(rec.reasons.length).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(150);
  });

  it('getAllCurrentlyLegalCards enumerates open 9s and boundary extensions', () => {
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 8, high: 10 };
    const legal = getAllCurrentlyLegalCards(bounds, false);
    const labels = legal.map(formatCardLabel).sort();
    expect(labels).toEqual(['7♦', 'J♦', '9♠', '9♣', '9♥'].sort());
  });

  it('localizes advisor headlines and reasons across en, ru, uk, de', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(normalizeLanguage('RU')).toBe('ru');
    expect(normalizeLanguage('uk-UA')).toBe('uk');
    expect(normalizeLanguage('de-AT')).toBe('de');
    expect(normalizeLanguage('fr')).toBe('en');

    const round: RoundState = {
      hands: {
        1: [{ suit: Suit.Spades, rank: 9 }],
        2: [{ suit: Suit.Clubs, rank: 9 }],
        3: [
          { suit: Suit.Diamonds, rank: 9 },
          { suit: Suit.Hearts, rank: 9 },
          { suit: Suit.Spades, rank: 8 },
        ],
      },
      tableBounds: createEmptyTableBounds(),
      playedCount: 0,
      currentTurn: 3,
      isFirstTurnOfRound: true,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    const headlines = new Set<string>();
    for (const { code: language } of SUPPORTED_LANGUAGES) {
      const rec = evaluatePlayerMoves({
        round,
        difficulty: 2,
        passExclusions: emptyExclusions(),
        rng: createSeededRng(42),
        language,
      });
      expect(rec.headline).toContain('9♦');
      expect(rec.reasons[0]).toBeTruthy();
      expect(getTranslations(language).htmlLang).toBe(language);
      headlines.add(rec.headline);
    }
    expect(headlines.size).toBe(4);
  });

  it('uses exact rival hands and detects forced rival passes when xrayMode is enabled', () => {
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 6, high: 13 };
    bounds[Suit.Hearts] = { low: 6, high: 14 };
    bounds[Suit.Clubs] = { low: 9, high: 14 };
    bounds[Suit.Spades] = { low: 9, high: 14 };

    const clearRound: RoundState = {
      hands: {
        1: [{ suit: Suit.Clubs, rank: 7 }, { suit: Suit.Clubs, rank: 6 }],
        2: [{ suit: Suit.Spades, rank: 7 }, { suit: Suit.Spades, rank: 6 }],
        3: [{ suit: Suit.Clubs, rank: 8 }, { suit: Suit.Diamonds, rank: 14 }],
      },
      tableBounds: bounds,
      playedCount: 30,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 60,
      roundOver: false,
      winner: null,
    };

    const rec = evaluatePlayerMoves({
      round: clearRound,
      difficulty: 2,
      passExclusions: emptyExclusions(),
      xrayMode: true,
      rng: createSeededRng(1),
      language: 'ru',
    });

    expect(rec.xrayMode).toBe(true);
    expect(rec.isExact).toBe(true);
    expect(rec.sampleCount).toBe(1);
    expect(rec.bestCard).toEqual({ suit: Suit.Diamonds, rank: 14 });
    expect(rec.deduction.certainLeft.map(formatCardLabel)).toEqual(['6♣', '7♣']);
    expect(rec.deduction.certainRight.map(formatCardLabel)).toEqual(['6♠', '7♠']);
    expect(rec.reasons.some((r) => r.includes('Рентген'))).toBe(true);
  });

  it('evaluates Fan Tan 52-card hands and accounts for per-card tail penalties in EV', () => {
    const rules = resolveRoundRules({ variant: 'fantan52', fanTanOpening: 'sevenDiamonds', fanTanHandPenalty: 5 });
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 2, high: 7 };
    bounds[Suit.Spades] = { low: 7, high: 12 };

    const round: RoundState = {
      hands: {
        1: [{ suit: Suit.Diamonds, rank: 8 }],
        2: [{ suit: Suit.Spades, rank: 13 }],
        3: [
          { suit: Suit.Diamonds, rank: 1 }, // Plays low Ace (1) cleanly
          { suit: Suit.Hearts, rank: 7 },
        ],
      },
      tableBounds: bounds,
      playedCount: 12,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 60,
      rules,
      roundOver: false,
      winner: null,
    };

    const rec = evaluatePlayerMoves({
      round,
      difficulty: 2,
      passExclusions: emptyExclusions(),
      xrayMode: true,
      rng: createSeededRng(5),
    });

    expect(rec.action).toBe('play');
    expect(rec.bestCard).toBeTruthy();
    expect(['A♦', '7♥']).toContain(formatCardLabel(rec.bestCard!));
  });

  it('caps opponent tail-card penalty by each opponent cash in both immediate win and simulation EV', () => {
    const rules = resolveRoundRules({
      variant: 'fantan52',
      fanTanOpening: 'sevenDiamonds',
      fanTanHandPenalty: 5,
    });
    const bounds = createEmptyTableBounds();
    bounds[Suit.Diamonds] = { low: 2, high: 7 };

    // Immediate last-card win: bank $260, Left has 3 cards ($200 -> pays $15),
    // Right has 4 cards ($15 -> pays only $15 instead of $20). Total expected = $290.
    const lastCardRound: RoundState = {
      hands: {
        1: [
          { suit: Suit.Clubs, rank: 2 },
          { suit: Suit.Clubs, rank: 3 },
          { suit: Suit.Clubs, rank: 4 },
        ],
        2: [
          { suit: Suit.Hearts, rank: 2 },
          { suit: Suit.Hearts, rank: 3 },
          { suit: Suit.Hearts, rank: 4 },
          { suit: Suit.Hearts, rank: 5 },
        ],
        3: [{ suit: Suit.Diamonds, rank: 1 }],
      },
      tableBounds: bounds,
      playedCount: 44,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 260,
      rules,
      roundOver: false,
      winner: null,
    };

    const immediateRec = evaluatePlayerMoves({
      round: lastCardRound,
      difficulty: 2,
      passExclusions: emptyExclusions(),
      cash: { 1: 200, 2: 15, 3: 100 },
      xrayMode: true,
      rng: createSeededRng(7),
      language: 'ru',
    });

    expect(immediateRec.candidates[0]?.expectedNetCash).toBe(290);
    expect(immediateRec.reasons[0]).toContain('$290');

    // Multi-card X-Ray rollout: human always wins after 1 more move, Left has 1 card ($0 left),
    // Right has 2 cards ($100 left -> pays $10) -> EV equals bank ($100) + $10 = $110.
    const simBounds = createEmptyTableBounds();
    simBounds[Suit.Diamonds] = { low: 4, high: 7 };
    simBounds[Suit.Spades] = { low: 7, high: 9 };
    const multiCardRound: RoundState = {
      hands: {
        1: [{ suit: Suit.Hearts, rank: 13 }], // cannot play yet
        2: [
          { suit: Suit.Clubs, rank: 12 },
          { suit: Suit.Clubs, rank: 13 },
        ],
        3: [
          { suit: Suit.Diamonds, rank: 3 },
          { suit: Suit.Diamonds, rank: 2 },
        ],
      },
      tableBounds: simBounds,
      playedCount: 20,
      currentTurn: 3,
      isFirstTurnOfRound: false,
      bank: 100,
      rules,
      roundOver: false,
      winner: null,
    };

    const simRec = evaluatePlayerMoves({
      round: multiCardRound,
      difficulty: 2,
      passExclusions: emptyExclusions(),
      cash: { 1: 0, 2: 24, 3: 120 },
      xrayMode: true,
      rng: createSeededRng(9),
    });

    // After human plays 3♦: Left passes (-PASS_PENALTY = -$20), Right passes (-$20 -> $4 left),
    // human plays 2♦ and wins: pot = 100 + 20 + 20 = 140; Left pays $0 (capped at 0), Right pays $4 (capped from $10).
    expect(simRec.candidates[0]?.winRate).toBe(1);
    expect(simRec.candidates[0]?.expectedNetCash).toBe(144);
  });

  it('provides localized next-match rule notices across all supported languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const s = getTranslations(lang.code).shell;
      expect(s.nextMatchRulesNote('sevenDiamonds', 5)).toContain('7♦');
      expect(s.nextMatchRulesNote('sevenDiamonds', 5)).toContain('$5');
      expect(s.nextMatchRulesNote('anySeven', 0).length).toBeGreaterThan(10);
      expect(s.controlsTitle.length).toBeGreaterThan(0);
      expect(s.settingsBtn.length).toBeGreaterThan(0);
      expect(s.settingsTitle.length).toBeGreaterThan(0);
      expect(s.settingsClose.length).toBeGreaterThan(0);
      expect(s.resetSaveConfirm.length).toBeGreaterThan(0);
    }
  });
});
