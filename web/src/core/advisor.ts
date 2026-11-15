import { analyzeSuitBranches, selectBotMove } from './ai.js';
import { DEFAULT_LANGUAGE, getTranslations, type Language } from './i18n.js';
import { createDefaultRng, type Rng } from './rng.js';
import {
  cardKey,
  getDeckRanks,
  getLegalMoves,
  nextSeat,
  resolveRoundRules,
  sortHand,
  SUITS,
} from './rules.js';
import {
  PASS_PENALTY,
  Suit,
  type Card,
  type ClubTableId,
  type GameRulesConfig,
  type Rank,
  type ResolvedRoundRules,
  type RoundState,
  type SeatIndex,
  type TableBounds,
} from './types.js';

export type PassExclusions = Record<1 | 2, ReadonlySet<string>>;

export interface CandidateAdvice {
  card: Card;
  winRate: number;
  expectedNetCash: number;
  avgOppPasses: number;
  avgHumanPasses: number;
  isExact: boolean;
  reasons: string[];
}

export interface AdvisorDeductionSummary {
  unseenTotal: number;
  certainLeft: Card[];
  certainRight: Card[];
  excludedLeftCount: number;
  excludedRightCount: number;
}

export interface AdvisorRecommendation {
  action: 'play' | 'pass';
  bestCard: Card | null;
  forced: boolean;
  xrayMode: boolean;
  headline: string;
  reasons: string[];
  candidates: CandidateAdvice[];
  deduction: AdvisorDeductionSummary;
  sampleCount: number;
  isExact: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Spades]: '♠',
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
};

export function formatCardLabel(card: Card): string {
  const rank =
    card.rank === 1 || card.rank === 14
      ? 'A'
      : card.rank === 11
        ? 'J'
        : card.rank === 12
          ? 'Q'
          : card.rank === 13
            ? 'K'
            : String(card.rank);
  return `${rank}${SUIT_SYMBOLS[card.suit]}`;
}

/** Returns all cards from the active deck that are currently legal to play under `bounds`. */
export function getAllCurrentlyLegalCards(
  bounds: TableBounds,
  isFirstTurnOfRound: boolean,
  rulesInput?: Partial<GameRulesConfig> | ResolvedRoundRules,
): Card[] {
  const rules = resolveRoundRules(rulesInput);
  if (isFirstTurnOfRound) {
    if (rules.openingMode === 'nineDiamonds') {
      return [{ suit: Suit.Diamonds, rank: 9 }];
    }
    if (rules.openingMode === 'sevenDiamonds') {
      return [{ suit: Suit.Diamonds, rank: rules.centerRank as Rank }];
    }
    return SUITS.map((suit) => ({ suit, rank: rules.centerRank as Rank }));
  }
  const legal: Card[] = [];
  for (const suit of SUITS) {
    const b = bounds[suit];
    if (b.low === 0) {
      legal.push({ suit, rank: rules.centerRank as Rank });
    } else {
      if (b.low > rules.minRank) legal.push({ suit, rank: (b.low - 1) as Rank });
      if (b.high < rules.maxRank) legal.push({ suit, rank: (b.high + 1) as Rank });
    }
  }
  return legal;
}

function nChooseK(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= kk; i++) {
    res = Math.round((res * (n - kk + i)) / i);
  }
  return res;
}

function enumerateCombinations(pool: readonly Card[], take: number): { left: Card[]; right: Card[] }[] {
  const out: { left: Card[]; right: Card[] }[] = [];
  const rec = (idx: number, leftCards: Card[], rightCards: Card[]) => {
    if (leftCards.length === take) {
      out.push({
        left: [...leftCards],
        right: [...rightCards, ...pool.slice(idx)],
      });
      return;
    }
    if (idx >= pool.length || leftCards.length + (pool.length - idx) < take) {
      return;
    }
    // Option A: give pool[idx] to left
    leftCards.push(pool[idx]);
    rec(idx + 1, leftCards, rightCards);
    leftCards.pop();
    // Option B: give pool[idx] to right
    rightCards.push(pool[idx]);
    rec(idx + 1, leftCards, rightCards);
    rightCards.pop();
  };
  rec(0, [], []);
  return out;
}

function cloneBounds(b: TableBounds): TableBounds {
  return {
    [Suit.Spades]: { ...b[Suit.Spades] },
    [Suit.Clubs]: { ...b[Suit.Clubs] },
    [Suit.Diamonds]: { ...b[Suit.Diamonds] },
    [Suit.Hearts]: { ...b[Suit.Hearts] },
  };
}

function applyCardToBounds(bounds: TableBounds, card: Card): void {
  const b = bounds[card.suit];
  if (b.low === 0) {
    b.low = card.rank;
    b.high = card.rank;
  } else {
    if (card.rank < b.low) b.low = card.rank;
    if (card.rank > b.high) b.high = card.rank;
  }
}

interface RolloutOutcome {
  winner: SeatIndex;
  humanPasses: number;
  oppPasses: number;
  finalPot: number;
  wonHandBonus: number;
  humanHandPenalty: number;
}

/** Computes actual hand-card penalty owed by `seat`, capped by available cash when known. */
function computeSeatHandPenalty(
  seat: SeatIndex,
  remainingCards: number,
  handCardPenalty: number,
  cash?: Readonly<Record<SeatIndex, number>>,
): number {
  if (handCardPenalty <= 0 || remainingCards <= 0) return 0;
  const due = remainingCards * handCardPenalty;
  if (!cash) return due;
  return Math.min(Math.max(0, cash[seat]), due);
}

/**
 * Lightweight tight rollout simulator starting directly after human plays `candidate`.
 * Mutates local copies only so Monte Carlo rollouts stay within a few milliseconds.
 */
function simulateAfterHumanCard(
  baseRound: RoundState,
  candidate: Card,
  leftHand: readonly Card[],
  rightHand: readonly Card[],
  difficulty: ClubTableId,
  rng: Rng,
  rules: ResolvedRoundRules,
  cash?: Readonly<Record<SeatIndex, number>>,
): RolloutOutcome {
  const hands: Record<SeatIndex, Card[]> = {
    1: [...leftHand],
    2: [...rightHand],
    3: baseRound.hands[3].filter((c) => !(c.suit === candidate.suit && c.rank === candidate.rank)),
  };
  const simCash: Record<SeatIndex, number> | null = cash ? { ...cash } : null;
  const bounds = cloneBounds(baseRound.tableBounds);
  applyCardToBounds(bounds, candidate);

  let bank = baseRound.bank;
  let humanPasses = 0;
  let oppPasses = 0;

  if (hands[3].length === 0) {
    const wonHandBonus =
      computeSeatHandPenalty(1, hands[1].length, rules.handCardPenalty, simCash ?? undefined) +
      computeSeatHandPenalty(2, hands[2].length, rules.handCardPenalty, simCash ?? undefined);
    return { winner: 3, humanPasses: 0, oppPasses: 0, finalPot: bank, wonHandBonus, humanHandPenalty: 0 };
  }

  let turn: SeatIndex = nextSeat(3);
  let playedCount = baseRound.playedCount + 1;
  let isFirst = false;

  // Guard against degenerate cycles (up to 52 plays + passes)
  for (let step = 0; step < 128; step++) {
    const simRound: RoundState = {
      hands,
      tableBounds: bounds,
      playedCount,
      currentTurn: turn,
      isFirstTurnOfRound: isFirst,
      bank,
      rules,
      roundOver: false,
      winner: null,
    };

    const chosen = selectBotMove(simRound, turn === 3 ? 3 : difficulty, rng);
    if (chosen) {
      const h = hands[turn];
      const idx = h.findIndex((c) => c.suit === chosen.suit && c.rank === chosen.rank);
      if (idx !== -1) h.splice(idx, 1);
      applyCardToBounds(bounds, chosen);
      playedCount++;
      isFirst = false;
      if (h.length === 0) {
        const wonHandBonus =
          turn === 3
            ? computeSeatHandPenalty(1, hands[1].length, rules.handCardPenalty, simCash ?? undefined) +
              computeSeatHandPenalty(2, hands[2].length, rules.handCardPenalty, simCash ?? undefined)
            : 0;
        const humanHandPenalty =
          turn !== 3
            ? computeSeatHandPenalty(3, hands[3].length, rules.handCardPenalty, simCash ?? undefined)
            : 0;
        return { winner: turn, humanPasses, oppPasses, finalPot: bank, wonHandBonus, humanHandPenalty };
      }
    } else {
      bank += PASS_PENALTY;
      if (simCash) simCash[turn] -= PASS_PENALTY;
      if (turn === 3) humanPasses++;
      else oppPasses++;
    }
    turn = nextSeat(turn);
  }

  return {
    winner: 1,
    humanPasses,
    oppPasses,
    finalPot: bank,
    wonHandBonus: 0,
    humanHandPenalty: computeSeatHandPenalty(3, hands[3].length, rules.handCardPenalty, simCash ?? undefined),
  };
}

function buildSplits(
  freePool: readonly Card[],
  needLeft: number,
  certainLeft: readonly Card[],
  certainRight: readonly Card[],
  maxSamples: number,
  rng: Rng,
): { splits: { left: Card[]; right: Card[] }[]; isExact: boolean } {
  const totalComb = nChooseK(freePool.length, needLeft);
  if (totalComb <= 84) {
    const raw = enumerateCombinations(freePool, needLeft);
    return {
      isExact: true,
      splits: raw.map((s) => ({
        left: [...certainLeft, ...s.left],
        right: [...certainRight, ...s.right],
      })),
    };
  }

  const splits: { left: Card[]; right: Card[] }[] = [];
  const work = [...freePool];
  for (let s = 0; s < maxSamples; s++) {
    for (let i = 0; i < needLeft; i++) {
      const j = i + rng.nextInt(work.length - i);
      const tmp = work[i];
      work[i] = work[j];
      work[j] = tmp;
    }
    splits.push({
      left: [...certainLeft, ...work.slice(0, needLeft)],
      right: [...certainRight, ...work.slice(needLeft)],
    });
  }
  return { splits, isExact: false };
}

/** Lists player cards on the same suit branch unlocked further out from `card`. */
function getUnlockedChainCards(
  hand: readonly Card[],
  card: Card,
  bounds: TableBounds,
  rules: ResolvedRoundRules,
): Card[] {
  const unlocked: Card[] = [];
  if (card.rank <= rules.centerRank) {
    for (let r = card.rank - 1; r >= rules.minRank; r--) {
      const found = hand.find((c) => c.suit === card.suit && c.rank === r);
      if (found) unlocked.push(found);
      else break;
    }
  }
  if (card.rank >= rules.centerRank) {
    for (let r = card.rank + 1; r <= rules.maxRank; r++) {
      const found = hand.find((c) => c.suit === card.suit && c.rank === r);
      if (found) unlocked.push(found);
      else break;
    }
  }
  // If playing a center card on unopened suit, also collect non-contiguous deeper cards of this suit
  if (bounds[card.suit].low === 0 && card.rank === rules.centerRank) {
    return hand.filter((c) => c.suit === card.suit && c.rank !== rules.centerRank);
  }
  return unlocked;
}

/** Counts missing ranks between `card` and our deepest card in that branch (holes rivals could block). */
function getMissingGapTowardsAnchor(
  hand: readonly Card[],
  card: Card,
  rules: ResolvedRoundRules,
): number {
  let missing = 0;
  if (card.rank < rules.centerRank) {
    let minRank = card.rank;
    for (const c of hand) if (c.suit === card.suit && c.rank < minRank) minRank = c.rank;
    for (let r = minRank + 1; r < card.rank; r++) {
      if (!hand.some((c) => c.suit === card.suit && c.rank === r)) missing++;
    }
  } else if (card.rank > rules.centerRank) {
    let maxRank = card.rank;
    for (const c of hand) if (c.suit === card.suit && c.rank > maxRank) maxRank = c.rank;
    for (let r = card.rank + 1; r < maxRank; r++) {
      if (!hand.some((c) => c.suit === card.suit && c.rank === r)) missing++;
    }
  }
  return missing;
}

function detectImmediateForcedPass(
  bounds: TableBounds,
  candidate: Card,
  leftHand: readonly Card[],
  rightHand: readonly Card[],
  rules: ResolvedRoundRules,
): 'left' | 'right' | 'both' | null {
  const afterHuman = cloneBounds(bounds);
  applyCardToBounds(afterHuman, candidate);

  const leftLegal = getLegalMoves(leftHand, afterHuman, false, rules);
  const leftPasses = leftLegal.length === 0;

  let rightPasses = getLegalMoves(rightHand, afterHuman, false, rules).length === 0;
  if (rightPasses && leftLegal.length > 0) {
    for (const lc of leftLegal) {
      const afterLeft = cloneBounds(afterHuman);
      applyCardToBounds(afterLeft, lc);
      if (getLegalMoves(rightHand, afterLeft, false, rules).length > 0) {
        rightPasses = false;
        break;
      }
    }
  }

  if (leftPasses && rightPasses) return 'both';
  if (leftPasses) return 'left';
  if (rightPasses) return 'right';
  return null;
}

function buildStrategicReasons(params: {
  best: CandidateAdvice;
  runnerUp: CandidateAdvice | null;
  hand: readonly Card[];
  leftHand: readonly Card[];
  rightHand: readonly Card[];
  bounds: TableBounds;
  isFirstTurn: boolean;
  forced: boolean;
  difficulty: ClubTableId;
  deduction: AdvisorDeductionSummary;
  leftCount: number;
  rightCount: number;
  xrayMode: boolean;
  language: Language;
  rules: ResolvedRoundRules;
}): string[] {
  const {
    best,
    runnerUp,
    hand,
    leftHand,
    rightHand,
    bounds,
    isFirstTurn,
    forced,
    difficulty,
    deduction,
    leftCount,
    rightCount,
    xrayMode,
    language,
    rules,
  } = params;
  const tr = getTranslations(language).advisor;
  const c = best.card;
  const reasons: string[] = [];

  if (isFirstTurn && forced) {
    reasons.push(tr.forcedNineReason.replace(/9♦/g, formatCardLabel(c)));
    return reasons;
  }

  if (hand.length === 1) {
    reasons.push(tr.lastCardWinReason(Math.round(best.expectedNetCash)));
    return reasons;
  }

  // 1. Direct quantitative comparison vs next best alternative
  if (runnerUp) {
    const evDiff = Math.round(best.expectedNetCash - runnerUp.expectedNetCash);
    const winPct = Math.round(best.winRate * 100);
    const altPct = Math.round(runnerUp.winRate * 100);
    if (evDiff >= 3) {
      reasons.push(tr.evAheadReason(formatCardLabel(runnerUp.card), evDiff, winPct, altPct));
    } else if (winPct > altPct + 2) {
      reasons.push(tr.higherWinReason(formatCardLabel(runnerUp.card), winPct, altPct));
    }
  }

  // 1b. Immediate X-Ray forced-pass insight (high-signal tactical payoff)
  const passTarget = xrayMode ? detectImmediateForcedPass(bounds, c, leftHand, rightHand, rules) : null;
  if (passTarget) {
    reasons.push(tr.xrayForceImmediatePassReason(passTarget, PASS_PENALTY));
  }

  // 2. Hand chain / gap structure
  const unlocked = getUnlockedChainCards(hand, c, bounds, rules);
  const analysis = analyzeSuitBranches(hand, bounds, difficulty, rules);
  const suitInfo = analysis[c.suit];

  if (c.rank === rules.centerRank) {
    if (unlocked.length >= 2) {
      reasons.push(tr.openSuitMultipleReason(unlocked.map(formatCardLabel).join(', ')));
    } else if (unlocked.length === 1) {
      reasons.push(tr.openSuitSingleReason(formatCardLabel(unlocked[0])));
    } else if (runnerUp && runnerUp.card.rank !== rules.centerRank) {
      reasons.push(tr.closedSuitRiskyReason);
    }
  } else {
    if (unlocked.length > 0) {
      reasons.push(tr.chainExtendReason(unlocked.map(formatCardLabel).join(', ')));
    } else if (c.rank === rules.minRank || c.rank === rules.maxRank) {
      reasons.push(tr.closeEndReason);
    }
    const branchGap = c.rank < rules.centerRank ? suitInfo.leadGapBelow : suitInfo.leadGapAbove;
    const hole = getMissingGapTowardsAnchor(hand, c, rules);
    if (hole === 0 && branchGap === 0 && unlocked.length === 0) {
      reasons.push(tr.safeDiscardReason);
    }
  }

  // 3. Rival restraint when holding another center card or deep cards
  const altCenter = runnerUp && runnerUp.card.rank === rules.centerRank ? runnerUp.card : null;
  if (altCenter && c.rank !== rules.centerRank) {
    const oppCenterCards = getUnlockedChainCards(hand, altCenter, bounds, rules);
    if (oppCenterCards.length <= 1) {
      reasons.push(tr.holdNineReason(formatCardLabel(altCenter)));
    }
  }

  // 4. Opponent pressure & pass deduction (when X-Ray didn't already report an immediate pass)
  if (!passTarget && runnerUp && best.avgOppPasses - runnerUp.avgOppPasses >= 0.22) {
    reasons.push(tr.pressureOppPassesReason(best.avgOppPasses.toFixed(1)));
  }

  const minOppCards = Math.min(leftCount, rightCount);
  if (minOppCards <= 3) {
    reasons.push(tr.lowOppCardsReason(rightCount <= leftCount, minOppCards));
  }

  if (!xrayMode && (deduction.certainLeft.length > 0 || deduction.certainRight.length > 0)) {
    const parts: string[] = [];
    if (deduction.certainLeft.length > 0) {
      parts.push(tr.deductionPart(false, deduction.certainLeft.slice(0, 3).map(formatCardLabel).join(', ')));
    }
    if (deduction.certainRight.length > 0) {
      parts.push(tr.deductionPart(true, deduction.certainRight.slice(0, 3).map(formatCardLabel).join(', ')));
    }
    reasons.push(tr.deducedCardsReason(parts));
  }

  // Fallback general summary if no specific tactical trigger fired
  if (reasons.length === 0) {
    reasons.push(tr.balancedTempoReason);
  }

  return reasons.slice(0, 3);
}

/**
 * Computes optimal move advice using ONLY legal public information + player's own hand
 * + cards excluded from each rival's hand via prior passes.
 */
export function evaluatePlayerMoves(params: {
  round: RoundState;
  difficulty: ClubTableId;
  passExclusions: PassExclusions;
  cash?: Readonly<Record<SeatIndex, number>>;
  maxSamples?: number;
  rng?: Rng;
  xrayMode?: boolean;
  language?: Language;
}): AdvisorRecommendation {
  const {
    round,
    difficulty,
    passExclusions,
    cash,
    maxSamples = 96,
    rng = createDefaultRng(),
    xrayMode = false,
    language = DEFAULT_LANGUAGE,
  } = params;
  const tr = getTranslations(language).advisor;
  const rules = resolveRoundRules(round.rules);
  const deckRanks = getDeckRanks(rules);
  const hand = round.hands[3];
  const leftCount = round.hands[1].length;
  const rightCount = round.hands[2].length;

  let certainLeft: Card[] = [];
  let certainRight: Card[] = [];
  let freePool: Card[] = [];
  let unseenTotal = 0;

  if (xrayMode) {
    certainLeft = sortHand(round.hands[1]);
    certainRight = sortHand(round.hands[2]);
    unseenTotal = certainLeft.length + certainRight.length;
  } else {
    // Build unseen pool legally (everything not on table & not in player's hand)
    const unseenPool: Card[] = [];
    for (const suit of SUITS) {
      const b = round.tableBounds[suit];
      for (const rank of deckRanks) {
        const onTable = b.low > 0 && rank >= b.low && rank <= b.high;
        const inHuman = hand.some((c) => c.suit === suit && c.rank === rank);
        if (!onTable && !inHuman) {
          unseenPool.push({ suit, rank });
        }
      }
    }
    unseenTotal = unseenPool.length;

    // Deduct forced cards from pass exclusions (if card excluded from Left, Right must hold it, and vice versa)
    for (const card of unseenPool) {
      const k = cardKey(card);
      const exLeft = passExclusions[1].has(k);
      const exRight = passExclusions[2].has(k);
      if (exLeft && !exRight) {
        certainRight.push(card);
      } else if (exRight && !exLeft) {
        certainLeft.push(card);
      } else {
        freePool.push(card);
      }
    }

    // Guard if hand counts can't accommodate inferred certainties
    if (certainLeft.length > leftCount || certainRight.length > rightCount) {
      certainLeft = [];
      certainRight = [];
      freePool = [...unseenPool];
    } else if (certainRight.length === rightCount && freePool.length > 0) {
      certainLeft.push(...freePool);
      freePool = [];
    } else if (certainLeft.length === leftCount && freePool.length > 0) {
      certainRight.push(...freePool);
      freePool = [];
    }
  }

  const deduction: AdvisorDeductionSummary = {
    unseenTotal,
    certainLeft,
    certainRight,
    excludedLeftCount: passExclusions[1].size,
    excludedRightCount: passExclusions[2].size,
  };

  const legal = getLegalMoves(hand, round.tableBounds, round.isFirstTurnOfRound, rules);

  if (legal.length === 0) {
    // Explain which blocked cards are waiting in player's hand
    const waitingCards = hand.slice(0, 4).map(formatCardLabel).join(', ');
    return {
      action: 'pass',
      bestCard: null,
      forced: true,
      xrayMode,
      headline: tr.forcedPassHeadline(PASS_PENALTY),
      reasons: [
        tr.noLegalCardsReason,
        hand.length > 0
          ? tr.waitingCardsReason(waitingCards, hand.length > 4)
          : tr.handEmptyReason,
      ],
      candidates: [],
      deduction,
      sampleCount: 0,
      isExact: true,
    };
  }

  const XRAY_ROLLOUTS = 8;
  const needLeft = leftCount - certainLeft.length;
  const { splits, isExact } = xrayMode
    ? {
        splits: Array.from({ length: XRAY_ROLLOUTS }, () => ({
          left: certainLeft,
          right: certainRight,
        })),
        isExact: true,
      }
    : buildSplits(freePool, needLeft, certainLeft, certainRight, maxSamples, rng);
  const sampleCount = xrayMode ? 1 : splits.length;

  const evaluations: CandidateAdvice[] = [];
  for (const card of legal) {
    if (hand.length === 1) {
      const cappedBonus =
        computeSeatHandPenalty(1, leftCount, rules.handCardPenalty, cash) +
        computeSeatHandPenalty(2, rightCount, rules.handCardPenalty, cash);
      evaluations.push({
        card,
        winRate: 1,
        expectedNetCash: round.bank + cappedBonus,
        avgOppPasses: 0,
        avgHumanPasses: 0,
        isExact: true,
        reasons: [],
      });
      continue;
    }

    let wins = 0;
    let totalNet = 0;
    let totalOppPasses = 0;
    let totalHumanPasses = 0;

    for (const split of splits) {
      const res = simulateAfterHumanCard(round, card, split.left, split.right, difficulty, rng, rules, cash);
      if (res.winner === 3) {
        wins++;
        totalNet += res.finalPot + res.wonHandBonus;
      } else {
        totalNet -= res.humanHandPenalty;
      }
      totalNet -= res.humanPasses * PASS_PENALTY;
      totalOppPasses += res.oppPasses;
      totalHumanPasses += res.humanPasses;
    }

    const n = Math.max(1, splits.length);
    evaluations.push({
      card,
      winRate: wins / n,
      expectedNetCash: totalNet / n,
      avgOppPasses: totalOppPasses / n,
      avgHumanPasses: totalHumanPasses / n,
      isExact,
      reasons: [],
    });
  }

  evaluations.sort((a, b) => {
    const evDelta = b.expectedNetCash - a.expectedNetCash;
    if (Math.abs(evDelta) > 0.25) return evDelta;
    const winDelta = b.winRate - a.winRate;
    if (Math.abs(winDelta) > 0.005) return winDelta;
    return b.avgOppPasses - a.avgOppPasses;
  });

  const forced = legal.length === 1;
  const best = evaluations[0];
  const runnerUp = evaluations.length > 1 ? evaluations[1] : null;
  const reasons = buildStrategicReasons({
    best,
    runnerUp,
    hand,
    leftHand: certainLeft,
    rightHand: certainRight,
    bounds: round.tableBounds,
    isFirstTurn: round.isFirstTurnOfRound,
    forced,
    difficulty,
    deduction,
    leftCount,
    rightCount,
    xrayMode,
    language,
    rules,
  });
  best.reasons = reasons;

  const winPct = Math.round(best.winRate * 100);
  const evSign = best.expectedNetCash >= 0 ? '+' : '-';
  const evAbs = Math.abs(Math.round(best.expectedNetCash));
  const headline = forced
    ? tr.forcedPlayHeadline(formatCardLabel(best.card), winPct)
    : tr.bestPlayHeadline(formatCardLabel(best.card), winPct, `${evSign}$${evAbs}`);

  return {
    action: 'play',
    bestCard: best.card,
    forced,
    xrayMode,
    headline,
    reasons,
    candidates: evaluations,
    deduction,
    sampleCount,
    isExact,
  };
}
