import type { Rng } from './rng.js';
import { getLegalMoves, SUITS } from './rules.js';
import {
  Suit,
  type Card,
  type ClubTableId,
  type RoundState,
  type SeatIndex,
  type TableBounds,
} from './types.js';

export interface SuitAnalysis {
  lowEdge: number;   // Rank next playable below (8..6, or 9 if unopened)
  highEdge: number;  // Rank next playable above (10..14, or 9 if unopened)
  missingBelow: number;
  missingAbove: number;
  tailGapBelow: number;
  tailGapAbove: number;
  leadGapBelow: number;
  leadGapAbove: number;
  scoreBelow: number;
  scoreAbove: number;
}

function hasCard(hand: readonly Card[], suit: Suit, rank: number): boolean {
  return hand.some((c) => c.suit === suit && c.rank === rank);
}

/**
 * Exact translation of AnalyzeSuitBranches (CS:606C..66B4) across all 4 suits.
 */
export function analyzeSuitBranches(
  hand: readonly Card[],
  tableBounds: TableBounds,
  difficulty: ClubTableId,
): Record<Suit, SuitAnalysis> {
  const result = {} as Record<Suit, SuitAnalysis>;

  for (const suit of SUITS) {
    const bounds = tableBounds[suit];
    const lowEdge = bounds.low === 0 ? 9 : bounds.low - 1;
    const highEdge = bounds.high === 0 ? 9 : bounds.high + 1;

    let missingBelow = 0;
    let tailGapBelow = 0;
    let leadGapBelow = 0;
    let seenOwnBelow = false;
    for (let r = lowEdge - 1; r >= 6; r--) {
      if (hasCard(hand, suit, r)) {
        seenOwnBelow = true;
        tailGapBelow = 0;
      } else {
        missingBelow++;
        if (!seenOwnBelow) leadGapBelow++;
        tailGapBelow++;
      }
    }

    let missingAbove = 0;
    let tailGapAbove = 0;
    let leadGapAbove = 0;
    let seenOwnAbove = false;
    for (let r = highEdge + 1; r <= 14; r++) {
      if (hasCard(hand, suit, r)) {
        seenOwnAbove = true;
        tailGapAbove = 0;
      } else {
        missingAbove++;
        if (!seenOwnAbove) leadGapAbove++;
        tailGapAbove++;
      }
    }

    // Score each branch (CS:62E0..66B0)
    let gapDiffBelow = missingBelow - tailGapBelow;
    let gapDiffAbove = missingAbove - tailGapAbove;

    let effTailBelow = tailGapBelow;
    let effTailAbove = tailGapAbove;
    let effLeadBelow = leadGapBelow;
    let effLeadAbove = leadGapAbove;

    if (difficulty === 3 && lowEdge === 9) {
      // Unopened suit evaluation on Difficulty 3 (CS:6358..64AD)
      const lowPen =
        missingBelow === 3
          ? missingAbove === leadGapAbove
            ? 0
            : 3
          : missingBelow - leadGapBelow;
      const highPen =
        missingAbove === 5
          ? missingBelow === leadGapBelow
            ? 0
            : 5
          : missingAbove - leadGapAbove;
      gapDiffBelow = lowPen + highPen;
      gapDiffAbove = gapDiffBelow;
      effTailBelow = tailGapBelow + tailGapAbove;
      effTailAbove = effTailBelow;
      effLeadBelow = leadGapBelow + leadGapAbove;
      effLeadAbove = effLeadBelow;
    } else if (difficulty !== 3 && lowEdge === 9) {
      // Unopened suit on Difficulty 1 & 2 (CS:65C1..664C)
      gapDiffBelow = gapDiffBelow + gapDiffAbove;
      gapDiffAbove = gapDiffBelow;
      effTailBelow = tailGapBelow + tailGapAbove;
      effTailAbove = effTailBelow;
      effLeadBelow = leadGapBelow + leadGapAbove;
      effLeadAbove = effLeadBelow;
    }

    const scoreBelow = lowEdge >= 6 ? (gapDiffBelow === 0 ? 0 : 8 - gapDiffBelow) : 0;
    const scoreAbove = highEdge <= 14 ? (gapDiffAbove === 0 ? 0 : 8 - gapDiffAbove) : 0;

    result[suit] = {
      lowEdge,
      highEdge,
      missingBelow,
      missingAbove,
      tailGapBelow: effTailBelow,
      tailGapAbove: effTailAbove,
      leadGapBelow: effLeadBelow,
      leadGapAbove: effLeadAbove,
      scoreBelow,
      scoreAbove,
    };
  }

  return result;
}

/**
 * Exact opponent lock-risk tie-breaker for Difficulty 3 (CS:66B5..6A36).
 * Lower value means safer for the bot (either stops opponents faster or locks more opponent cards).
 */
export function evaluateOpponentLockRisk(
  card: Card,
  round: RoundState,
  botSeat: SeatIndex,
): number {
  const opp1: SeatIndex = botSeat === 1 ? 2 : 1;
  const opp2: SeatIndex = botSeat === 3 ? 2 : 3;
  const botHand = round.hands[botSeat];
  const o1Hand = round.hands[opp1];
  const o2Hand = round.hands[opp2];

  let score = 0;

  if (card.rank >= 9) {
    // Upper branch risk: check ranks 9..card.rank-1 not held by bot vs opponents
    for (let r = 9; r < card.rank; r++) {
      if (!hasCard(botHand, card.suit, r) && r >= (round.tableBounds[card.suit].high || 9)) {
        if (hasCard(o1Hand, card.suit, r)) score -= Math.floor((r - 8) / 3) - 1;
        if (hasCard(o2Hand, card.suit, r)) score -= Math.floor((r - 8) / 3) - 1;
      }
    }
  }
  if (card.rank <= 9) {
    // Lower branch risk: check ranks card.rank+1..9
    for (let r = card.rank + 1; r <= 9; r++) {
      if (!hasCard(botHand, card.suit, r) && (round.tableBounds[card.suit].low === 0 || r <= round.tableBounds[card.suit].low)) {
        if (hasCard(o1Hand, card.suit, r)) score += Math.floor((10 - r) / 3) - 1;
        if (hasCard(o2Hand, card.suit, r)) score += Math.floor((10 - r) / 3) - 1;
      }
    }
  }
  return score;
}

interface CandidateEval {
  card: Card;
  primary: number;
  leadGap: number;
  tailGap: number;
  lockRisk: number;
}

/**
 * Selects a legal move for the current bot seat (CS:6A39..6DE3).
 * Returns null if no legal move exists (bot must pass and pay $20).
 */
export function selectBotMove(
  round: RoundState,
  difficulty: ClubTableId,
  rng: Rng,
): Card | null {
  const seat = round.currentTurn;
  const hand = round.hands[seat];
  const legal = getLegalMoves(hand, round.tableBounds, round.isFirstTurnOfRound);
  if (legal.length === 0) return null;

  // Mandatory 9♦ on opening turn (CS:6D84..6D9A -> score 1000)
  const nineD = legal.find((c) => c.suit === Suit.Diamonds && c.rank === 9);
  if (nineD && round.isFirstTurnOfRound) {
    return nineD;
  }

  const analysis = analyzeSuitBranches(hand, round.tableBounds, difficulty);
  let best: CandidateEval | null = null;
  let tieCount = 0;

  for (const card of legal) {
    const info = analysis[card.suit];
    let primary: number;
    let leadGap: number;
    let tailGap: number;

    if (card.rank < 9) {
      primary = info.scoreBelow;
      leadGap = info.leadGapBelow;
      tailGap = info.tailGapBelow;
    } else if (card.rank > 9) {
      primary = info.scoreAbove;
      leadGap = info.leadGapAbove;
      tailGap = info.tailGapAbove;
    } else {
      // Playing a 9 (opens both branches of the suit)
      primary = Math.max(info.scoreBelow, info.scoreAbove);
      leadGap = info.leadGapBelow;
      tailGap = info.tailGapBelow;
      if (difficulty === 3 && tailGap === 0) {
        primary = 500; // CS:6B2E: safe 9 with zero end gaps
      }
    }

    const lockRisk = difficulty === 3 ? evaluateOpponentLockRisk(card, round, seat) : 0;
    const cand: CandidateEval = { card, primary, leadGap, tailGap, lockRisk };

    if (!best) {
      best = cand;
      tieCount = 1;
      continue;
    }

    if (cand.primary > best.primary) {
      best = cand;
      tieCount = 1;
      continue;
    }
    if (cand.primary < best.primary) {
      continue;
    }

    // Equal primary score: compare difficulty-specific tie-breakers (CS:6B3B..6CA5)
    if (difficulty === 1 && best.leadGap === 0 && cand.leadGap !== 0) {
      continue;
    }
    if (cand.tailGap < best.tailGap) {
      best = cand;
      tieCount = 1;
      continue;
    }
    if (cand.tailGap > best.tailGap) {
      continue;
    }
    if (cand.leadGap < best.leadGap) {
      best = cand;
      tieCount = 1;
      continue;
    }
    if (cand.leadGap > best.leadGap) {
      continue;
    }
    if (difficulty === 3) {
      if (cand.lockRisk < best.lockRisk) {
        best = cand;
        tieCount = 1;
        continue;
      }
      if (cand.lockRisk > best.lockRisk) {
        continue;
      }
    }

    // Exact tie: uniform reservoir sampling (CS:6C23..6C39)
    tieCount++;
    if (rng.nextInt(tieCount) === 0) {
      best = cand;
    }
  }

  return best?.card ?? null;
}
