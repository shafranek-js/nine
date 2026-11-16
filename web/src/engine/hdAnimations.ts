import type { RivalAnimMode } from './hdCharacters';

export const HD_INTRO_RAISE_MS = 520;
export const HD_INTRO_BLOW_STEP_MS = 130;
export const HD_INTRO_LOWER_START_MS = 15280;
export const HD_INTRO_DURATION_MS = 15800;

export const HD_BOT_PURSE_REACH_MS = 180;
export const HD_BOT_PURSE_OPEN_MS = 420;
export const HD_BOT_PURSE_COIN_RELEASE_MS = HD_BOT_PURSE_REACH_MS + HD_BOT_PURSE_OPEN_MS;
export const HD_BOT_PURSE_COIN_FLIGHT_MS = 520;
export const HD_BOT_PURSE_CLOSE_MS = 180;
export const HD_BOT_PURSE_TOSS_TOTAL_MS =
  HD_BOT_PURSE_COIN_RELEASE_MS + HD_BOT_PURSE_COIN_FLIGHT_MS + HD_BOT_PURSE_CLOSE_MS;

export const HD_BOT_BROKE_SHAKE_DURATION_MS = 3800;
export const HD_DEAL_STEP_MS = 55;
export const HD_BOT_THROW_NEAR_MS = 760;
export const HD_BOT_THROW_FAR_MS = 820;

export interface HdAnteTimelineState {
  readonly leftMode: RivalAnimMode;
  readonly rightMode: RivalAnimMode;
  readonly dealerHatOpen: boolean;
  readonly dealerHatProgress: number;
  readonly leftStartMs: number;
  readonly rightStartMs: number;
  readonly humanStartMs: number;
  readonly endMs: number;
}

export interface HdBotThrowState {
  readonly cardPickedFromStack: boolean;
  readonly cardReleased: boolean;
  readonly flyProgress: number;
}

/** EGA-faithful Intro trumpeter progression: raise -> sustained cheek-puff fanfare -> lower. */
export function getHdIntroTrumpetProgress(elapsedMs: number): number {
  const t = Math.max(0, Math.min(HD_INTRO_DURATION_MS, elapsedMs));
  if (t < HD_INTRO_RAISE_MS) {
    return t / HD_INTRO_RAISE_MS;
  }
  const lowerDur = HD_INTRO_DURATION_MS - HD_INTRO_LOWER_START_MS;
  if (t >= HD_INTRO_LOWER_START_MS) {
    const u = Math.min(1, (t - HD_INTRO_LOWER_START_MS) / Math.max(1, lowerDur));
    return 1 - u;
  }
  // Alternate crisply through upper blowing frames (0.76 <-> 1.0) at DOS 130ms beat rate.
  const blowPhase = ((t - HD_INTRO_RAISE_MS) / HD_INTRO_BLOW_STEP_MS) * Math.PI;
  return 0.86 + 0.14 * Math.sin(blowPhase);
}

/** Resolves HD rival purse pose at `localMs` into a coin-toss-to-hat sequence. */
export function getHdBotPurseTossMode(localMs: number, totalMs = HD_BOT_PURSE_TOSS_TOTAL_MS): RivalAnimMode {
  if (localMs < 0 || localMs >= totalMs) return 'idle';
  if (localMs < HD_BOT_PURSE_REACH_MS) return 'purseReach';
  if (localMs < totalMs - HD_BOT_PURSE_CLOSE_MS) return 'purseOpen';
  return 'purseClose';
}

/** Sequential DOS-paced HD ante timeline: dealer opens hat, then seats 1 -> 2 -> 3 pay in turn. */
export function getHdAnteIntroState(elapsedMs: number): HdAnteTimelineState {
  const leftStartMs = 280;
  const rightStartMs = leftStartMs + HD_BOT_PURSE_TOSS_TOTAL_MS + 40;
  const humanStartMs = rightStartMs + HD_BOT_PURSE_TOSS_TOTAL_MS + 40;
  const closeStartMs = humanStartMs + 560;
  const endMs = closeStartMs + 520;

  let dealerHatProgress = 0;
  let dealerHatOpen = false;
  if (elapsedMs >= 0 && elapsedMs < leftStartMs) {
    dealerHatOpen = true;
    dealerHatProgress = elapsedMs / leftStartMs;
  } else if (elapsedMs >= leftStartMs && elapsedMs < closeStartMs) {
    dealerHatOpen = true;
    dealerHatProgress = 1;
  } else if (elapsedMs >= closeStartMs && elapsedMs < endMs) {
    dealerHatOpen = false;
    dealerHatProgress = 1 - (elapsedMs - closeStartMs) / (endMs - closeStartMs);
  }

  return {
    leftMode: getHdBotPurseTossMode(elapsedMs - leftStartMs),
    rightMode: getHdBotPurseTossMode(elapsedMs - rightStartMs),
    dealerHatOpen,
    dealerHatProgress: Math.max(0, Math.min(1, dealerHatProgress)),
    leftStartMs,
    rightStartMs,
    humanStartMs,
    endMs,
  };
}

/** Resolves broke rival upside-down empty purse shaking and shrug timeline (`3800ms`). */
export function getHdBotBrokeMode(elapsedMs: number, durationMs = HD_BOT_BROKE_SHAKE_DURATION_MS): RivalAnimMode {
  if (elapsedMs < 0 || elapsedMs >= durationMs) return 'idle';
  const shrugStart = Math.round(durationMs * 0.74);
  const settleStart = Math.round(durationMs * 0.88);
  if (elapsedMs < shrugStart) return 'brokeShake';
  if (elapsedMs < settleStart) return 'brokeShrug';
  return 'idle';
}

/** Matches EGA `CS:151A..1541` pickup-then-throw phasing onto the 16-frame HD `play_sheet`. */
export function getHdBotCardThrowState(progress01: number): HdBotThrowState {
  const t = Math.max(0, Math.min(1, progress01));
  const pickupT = 0.30;
  const releaseT = 0.45;
  const flyProgress = t <= releaseT ? 0 : Math.min(1, (t - releaseT) / (1 - releaseT));
  return {
    cardPickedFromStack: t >= pickupT,
    cardReleased: t >= releaseT,
    flyProgress,
  };
}

/** Computes progressive card-dealing counts and active dealer throw direction (`1 -> 2 -> 3`). */
export function getHdDealingStepState(
  elapsedMs: number,
  totalCards: number,
  stepMs = HD_DEAL_STEP_MS,
): {
  readonly currentStep: number;
  readonly dealtCounts: Record<1 | 2 | 3, number>;
  readonly dealerPose: 'dealLeft' | 'dealRight' | 'dealDown';
  readonly finished: boolean;
} {
  const rawStep = Math.floor(Math.max(0, elapsedMs) / Math.max(1, stepMs));
  const clampedCount = Math.min(totalCards, rawStep + 1);
  const dealtCounts: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (let i = 0; i < clampedCount; i++) {
    const target = ((i % 3) + 1) as 1 | 2 | 3;
    dealtCounts[target] += 1;
  }
  const activeSeat = ((Math.min(rawStep, Math.max(0, totalCards - 1)) % 3) + 1) as 1 | 2 | 3;
  const dealerPose = activeSeat === 1 ? 'dealLeft' : activeSeat === 2 ? 'dealRight' : 'dealDown';
  return {
    currentStep: rawStep,
    dealtCounts,
    dealerPose,
    finished: rawStep >= totalCards,
  };
}

/** Dealer glance cycle (`6500..8500ms` idle human wait) mirroring EGA glance timing. */
export function getHdDealerGlanceMode(localMs: number): 'glanceLeft' | 'glanceRight' | 'idle' {
  if (localMs >= 0 && localMs < 600) return 'glanceLeft';
  if (localMs >= 1000 && localMs < 1600) return 'glanceRight';
  return 'idle';
}
