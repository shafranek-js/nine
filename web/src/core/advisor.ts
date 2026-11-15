import { analyzeSuitBranches, selectBotMove } from './ai.js';
import { DEFAULT_LANGUAGE, getTranslations, type Language } from './i18n.js';
import { createDefaultRng, type Rng } from './rng.js';
import { cardKey, getLegalMoves, nextSeat, SUITS } from './rules.js';
import {
  PASS_PENALTY,
  Suit,
  type Card,
  type ClubTableId,
  type Rank,
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

const ALL_RANKS: readonly Rank[] = [6, 7, 8, 9, 10, 11, 12, 13, 14];

export function formatCardLabel(card: Card): string {
  const rank =
    card.rank === 11 ? 'J' : card.rank === 12 ? 'Q' : card.rank === 13 ? 'K' : card.rank === 14 ? 'A' : String(card.rank);
  return `${rank}${SUIT_SYMBOLS[card.suit]}`;
}

/** Returns all cards from the 36-card deck that are currently legal to play under `bounds`. */
export function getAllCurrentlyLegalCards(bounds: TableBounds, isFirstTurnOfRound: boolean): Card[] {
  if (isFirstTurnOfRound) {
    return [{ suit: Suit.Diamonds, rank: 9 }];
  }
  const legal: Card[] = [];
  for (const suit of SUITS) {
    const b = bounds[suit];
    if (b.low === 0) {
      legal.push({ suit, rank: 9 });
    } else {
      if (b.low > 6) legal.push({ suit, rank: (b.low - 1) as Rank });
      if (b.high < 14) legal.push({ suit, rank: (b.high + 1) as Rank });
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

interface RolloutOutcome {
  winner: SeatIndex;
  humanPasses: number;
  oppPasses: number;
  finalPot: number;
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
): RolloutOutcome {
  const hands: Record<SeatIndex, Card[]> = {
    1: [...leftHand],
    2: [...rightHand],
    3: baseRound.hands[3].filter((c) => !(c.suit === candidate.suit && c.rank === candidate.rank)),
  };
  const bounds = cloneBounds(baseRound.tableBounds);
  const b0 = bounds[candidate.suit];
  if (b0.low === 0) {
    b0.low = candidate.rank;
    b0.high = candidate.rank;
  } else {
    if (candidate.rank < b0.low) b0.low = candidate.rank;
    if (candidate.rank > b0.high) b0.high = candidate.rank;
  }

  let bank = baseRound.bank;
  let humanPasses = 0;
  let oppPasses = 0;

  if (hands[3].length === 0) {
    return { winner: 3, humanPasses: 0, oppPasses: 0, finalPot: bank };
  }

  let turn: SeatIndex = nextSeat(3);
  let playedCount = baseRound.playedCount + 1;
  let isFirst = false;

  // Guard against degenerate cycles (max 36 plays + passes)
  for (let step = 0; step < 96; step++) {
    const simRound: RoundState = {
      hands,
      tableBounds: bounds,
      playedCount,
      currentTurn: turn,
      isFirstTurnOfRound: isFirst,
      bank,
      roundOver: false,
      winner: null,
    };

    const chosen = selectBotMove(simRound, turn === 3 ? 3 : difficulty, rng);
    if (chosen) {
      const h = hands[turn];
      const idx = h.findIndex((c) => c.suit === chosen.suit && c.rank === chosen.rank);
      if (idx !== -1) h.splice(idx, 1);
      const tb = bounds[chosen.suit];
      if (tb.low === 0) {
        tb.low = chosen.rank;
        tb.high = chosen.rank;
      } else {
        if (chosen.rank < tb.low) tb.low = chosen.rank;
        if (chosen.rank > tb.high) tb.high = chosen.rank;
      }
      playedCount++;
      isFirst = false;
      if (h.length === 0) {
        return { winner: turn, humanPasses, oppPasses, finalPot: bank };
      }
    } else {
      bank += PASS_PENALTY;
      if (turn === 3) humanPasses++;
      else oppPasses++;
    }
    turn = nextSeat(turn);
  }

  return { winner: 1, humanPasses, oppPasses, finalPot: bank };
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
function getUnlockedChainCards(hand: readonly Card[], card: Card, bounds: TableBounds): Card[] {
  const unlocked: Card[] = [];
  if (card.rank <= 9) {
    for (let r = card.rank - 1; r >= 6; r--) {
      const found = hand.find((c) => c.suit === card.suit && c.rank === r);
      if (found) unlocked.push(found);
      else break;
    }
  }
  if (card.rank >= 9) {
    for (let r = card.rank + 1; r <= 14; r++) {
      const found = hand.find((c) => c.suit === card.suit && c.rank === r);
      if (found) unlocked.push(found);
      else break;
    }
  }
  // If playing a 9 on unopened suit, also collect non-contiguous deeper cards of this suit
  if (bounds[card.suit].low === 0 && card.rank === 9) {
    return hand.filter((c) => c.suit === card.suit && c.rank !== 9);
  }
  return unlocked;
}

/** Counts missing ranks between `card` and our deepest card in that branch (holes rivals could block). */
function getMissingGapTowardsAnchor(hand: readonly Card[], card: Card): number {
  let missing = 0;
  if (card.rank < 9) {
    let minRank = card.rank;
    for (const c of hand) if (c.suit === card.suit && c.rank < minRank) minRank = c.rank;
    for (let r = minRank + 1; r < card.rank; r++) {
      if (!hand.some((c) => c.suit === card.suit && c.rank === r)) missing++;
    }
  } else if (card.rank > 9) {
    let maxRank = card.rank;
    for (const c of hand) if (c.suit === card.suit && c.rank > maxRank) maxRank = c.rank;
    for (let r = card.rank + 1; r < maxRank; r++) {
      if (!hand.some((c) => c.suit === card.suit && c.rank === r)) missing++;
    }
  }
  return missing;
}

function buildStrategicReasons(params: {
  best: CandidateAdvice;
  runnerUp: CandidateAdvice | null;
  hand: readonly Card[];
  bounds: TableBounds;
  isFirstTurn: boolean;
  difficulty: ClubTableId;
  deduction: AdvisorDeductionSummary;
  leftCount: number;
  rightCount: number;
  bank: number;
  language: Language;
}): string[] {
  const { best, runnerUp, hand, bounds, isFirstTurn, difficulty, deduction, leftCount, rightCount, bank, language } = params;
  const tr = getTranslations(language).advisor;
  const c = best.card;
  const reasons: string[] = [];

  if (isFirstTurn) {
    reasons.push(tr.forcedNineReason);
    return reasons;
  }

  if (hand.length === 1) {
    reasons.push(tr.lastCardWinReason(bank));
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

  // 2. Hand chain / gap structure
  const unlocked = getUnlockedChainCards(hand, c, bounds);
  const analysis = analyzeSuitBranches(hand, bounds, difficulty);
  const suitInfo = analysis[c.suit];

  if (c.rank === 9) {
    if (unlocked.length >= 2) {
      reasons.push(tr.openSuitMultipleReason(unlocked.map(formatCardLabel).join(', ')));
    } else if (unlocked.length === 1) {
      reasons.push(tr.openSuitSingleReason(formatCardLabel(unlocked[0])));
    } else if (runnerUp && runnerUp.card.rank !== 9) {
      reasons.push(tr.closedSuitRiskyReason);
    }
  } else {
    if (unlocked.length > 0) {
      reasons.push(tr.chainExtendReason(unlocked.map(formatCardLabel).join(', ')));
    } else if (c.rank === 6 || c.rank === 14) {
      reasons.push(tr.closeEndReason);
    }
    const branchGap = c.rank < 9 ? suitInfo.leadGapBelow : suitInfo.leadGapAbove;
    const hole = getMissingGapTowardsAnchor(hand, c);
    if (hole === 0 && branchGap === 0 && unlocked.length === 0) {
      reasons.push(tr.safeDiscardReason);
    }
  }

  // 3. Rival restraint when holding another 9 or deep cards
  const altNine = runnerUp && runnerUp.card.rank === 9 ? runnerUp.card : null;
  if (altNine && c.rank !== 9) {
    const oppNineCards = getUnlockedChainCards(hand, altNine, bounds);
    if (oppNineCards.length <= 1) {
      reasons.push(tr.holdNineReason(formatCardLabel(altNine)));
    }
  }

  // 4. Opponent pressure, low card counts & pass deduction
  if (runnerUp && best.avgOppPasses - runnerUp.avgOppPasses >= 0.22) {
    reasons.push(tr.pressureOppPassesReason(best.avgOppPasses.toFixed(1)));
  }

  const minOppCards = Math.min(leftCount, rightCount);
  if (minOppCards <= 3) {
    reasons.push(tr.lowOppCardsReason(rightCount <= leftCount, minOppCards));
  }

  if (deduction.certainLeft.length > 0 || deduction.certainRight.length > 0) {
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
  maxSamples?: number;
  rng?: Rng;
  language?: Language;
}): AdvisorRecommendation {
  const {
    round,
    difficulty,
    passExclusions,
    maxSamples = 96,
    rng = createDefaultRng(),
    language = DEFAULT_LANGUAGE,
  } = params;
  const tr = getTranslations(language).advisor;
  const hand = round.hands[3];
  const leftCount = round.hands[1].length;
  const rightCount = round.hands[2].length;

  // Build unseen pool legally (everything not on table & not in player's hand)
  const unseenPool: Card[] = [];
  for (const suit of SUITS) {
    const b = round.tableBounds[suit];
    for (const rank of ALL_RANKS) {
      const onTable = b.low > 0 && rank >= b.low && rank <= b.high;
      const inHuman = hand.some((c) => c.suit === suit && c.rank === rank);
      if (!onTable && !inHuman) {
        unseenPool.push({ suit, rank });
      }
    }
  }

  // Deduct forced cards from pass exclusions (if card excluded from Left, Right must hold it, and vice versa)
  let certainLeft: Card[] = [];
  let certainRight: Card[] = [];
  let freePool: Card[] = [];
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

  const deduction: AdvisorDeductionSummary = {
    unseenTotal: unseenPool.length,
    certainLeft,
    certainRight,
    excludedLeftCount: passExclusions[1].size,
    excludedRightCount: passExclusions[2].size,
  };

  const legal = getLegalMoves(hand, round.tableBounds, round.isFirstTurnOfRound);

  if (legal.length === 0) {
    // Explain which blocked cards are waiting in player's hand
    const waitingCards = hand.slice(0, 4).map(formatCardLabel).join(', ');
    return {
      action: 'pass',
      bestCard: null,
      forced: true,
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

  const needLeft = leftCount - certainLeft.length;
  const { splits, isExact } = buildSplits(freePool, needLeft, certainLeft, certainRight, maxSamples, rng);

  const evaluations: CandidateAdvice[] = [];
  for (const card of legal) {
    if (hand.length === 1) {
      evaluations.push({
        card,
        winRate: 1,
        expectedNetCash: round.bank,
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
      const res = simulateAfterHumanCard(round, card, split.left, split.right, difficulty, rng);
      if (res.winner === 3) {
        wins++;
        totalNet += res.finalPot;
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

  const best = evaluations[0];
  const runnerUp = evaluations.length > 1 ? evaluations[1] : null;
  const reasons = buildStrategicReasons({
    best,
    runnerUp,
    hand,
    bounds: round.tableBounds,
    isFirstTurn: round.isFirstTurnOfRound,
    difficulty,
    deduction,
    leftCount,
    rightCount,
    bank: round.bank,
    language,
  });
  best.reasons = reasons;

  const forced = legal.length === 1;
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
    headline,
    reasons,
    candidates: evaluations,
    deduction,
    sampleCount: splits.length,
    isExact,
  };
}
