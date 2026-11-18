import type { Texture } from 'pixi.js';
import type { SeatIndex } from '../core/types';
import { sliceMaskedTexture, sliceTexture } from './BitmapFont';

export interface Waypoint {
  readonly x: number;
  readonly y: number;
}

export interface EgaBotArmSprites {
  /** `84×47` hand touching green rail (`k=1`: prep / settle) */
  readonly prepTex: Texture;
  /** `84×47` hand lifted to start reach (`k=2`) */
  readonly waveTex: Texture;
  /** `84×69` reaching near row (`row === 0`, `3` columns) */
  readonly pickNearFrames: readonly Texture[];
  /** `84×69` leaning forward with gray hat crown to reach far row (`row === 1`, `3` columns) */
  readonly pickFarFrames: readonly Texture[];
  readonly aimLeftSeatTex: Texture;
  readonly throwLeftSeatTex: Texture;
  readonly aimRightSeatTex: Texture;
  readonly throwRightSeatTex: Texture;
}

export interface EgaSpriteBank {
  readonly dealerIdleTex: Texture;
  readonly dealerBlinkTex: Texture;
  readonly dealerLookLeftTex: Texture;
  readonly dealerLookRightTex: Texture;
  readonly dealerBellFrames: readonly Texture[];
  readonly dealerWagFrames: readonly Texture[];
  /**
   * `GR_NINE` dealer dealing frames:
   * - `0..5`: `(580, 1+i*36, 59, 35)` drawn at `(293, 37)`
   * - `6..8`: `(543, 1+i*36, 96, 35)` drawn at `(256, 37)` for outstretched left reach
   */
  readonly dealerDealFrames: readonly Texture[];
  /** `VR_NINE` `(570, 1+i*63, 69, 61)` drawn masked at `(274, 20)` */
  readonly dealerHatOpenFrames: readonly Texture[];
  /** `VR_NINE` `(500, 1+i*94, 69, 93)` drawn masked at `(274, 3)` */
  readonly dealerPourLeftFrames: readonly Texture[];
  /** `VR_NINE` `(430, 64+i*77, 69, 76)` drawn masked at `(274, 20)` */
  readonly dealerPourRightFrames: readonly Texture[];
  /** `[dealerHatOpenFrames[3], VR_NINE(430, 1, 69, 61)]` drawn masked at `(274, 20)` */
  readonly dealerPourDownFrames: readonly Texture[];
  readonly botFrames: readonly Texture[];
  /** `VR_NINE` `(341, 1/49/97, 84, 47)` masked at `(33, 101)` */
  readonly botTossLeftFrames: readonly Texture[];
  /** `VR_NINE` `(341, 145/193/241, 84, 47)` masked at `(522, 101)` */
  readonly botTossRightFrames: readonly Texture[];
  readonly botShrugLeftTex: Texture;
  readonly botShrugRightTex: Texture;
  /** `GR_NINE` `(359/418, y, 58, 55)` red coin purse reach/open/close (`proc_037d`, drawn at `x=33`/`545, y=101`) */
  readonly botPurseReachFrames: readonly Texture[];
  readonly botPurseOpenLeftFrames: readonly Texture[];
  readonly botPurseOpenRightFrames: readonly Texture[];
  readonly botPurseCloseFrames: readonly Texture[];
  /** `GR_NINE` `(300, 1/57/113/169, 58, 55)` empty upside-down purse shake & empty-hand shrug (`proc_05cb`) */
  readonly botPurseEmptyFrames: readonly Texture[];
  /** Screen-left reaching arm (`cols 0..2`) drawn at `x=10` (left bot) or `x=522` (right bot) */
  readonly botArmReachLeft: EgaBotArmSprites;
  /** Screen-right reaching arm (`cols 3..5`) drawn at `x=33` (left bot) or `x=545` (right bot) */
  readonly botArmReachRight: EgaBotArmSprites;
  /** `GR_NINE` `(538, 37/70/103/136/169, 41, 32)` opaque at `(42, 101)` / `(554, 101)` */
  readonly botYawnFrames: readonly Texture[];
  readonly flyingCardFrames: readonly Texture[];
  readonly coinFrames: readonly Texture[];
  readonly smallCoinTex: Texture;
  readonly humanCoinFrames: readonly Texture[];
  readonly payoutClusterFrames: readonly Texture[];
  readonly payoutStackFrames: readonly Texture[];
  readonly flameFrames: readonly Texture[];
  readonly thermoTextures: readonly Texture[];
  readonly miniBackTex: Texture;
}

/** Slices every EGA animation sheet (`GR_NINE` and `VR_NINE`) matching `NINE.EXE` coordinates. */
export function createEgaSpriteBank(gr: Texture, vr: Texture): EgaSpriteBank {
  const dealerHatOpenFrames = [0, 1, 2, 3, 4].map((i) => sliceMaskedTexture(vr, 570, 1 + i * 63, 69, 61));
  const thermoTextures: Texture[] = [];
  for (let i = 0; i <= 32; i++) {
    let sx = 0;
    let sy = 332;
    if (i <= 6) {
      sx = 119 + i * 33;
      sy = 332;
    } else if (i <= 19) {
      sx = 119 + (i - 7) * 33;
      sy = 338;
    } else {
      sx = 119 + (i - 20) * 33;
      sy = 344;
    }
    thermoTextures.push(sliceTexture(gr, sx, sy, 32, 5));
  }

  // Keep rows 0..41 (torso above/on the green rail at py=40..41) opaque so resting
  // bow tie / clasped hands cannot bleed through, while clearing exterior black below
  // the rail (py=42..54) so coin purses hanging over the card rack stay transparent.
  const sliceBotPurse = (sx: number, sy: number): Texture =>
    sliceMaskedTexture(gr, sx, sy, 58, 55, { floodFillMinY: 42 });

  return {
    dealerIdleTex: sliceTexture(gr, 477, 237, 60, 39),
    dealerBlinkTex: sliceTexture(gr, 477, 277, 60, 39),
    dealerLookLeftTex: sliceTexture(gr, 477, 37, 60, 39),
    dealerLookRightTex: sliceTexture(gr, 477, 77, 60, 39),
    dealerBellFrames: [0, 1, 2, 3].map((i) => sliceTexture(gr, 192, 1 + i * 40, 60, 39)),
    dealerWagFrames: [0, 1, 2].map((i) => sliceTexture(gr, 477, 117 + i * 40, 60, 39)),
    dealerDealFrames: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
      i < 6
        ? sliceTexture(gr, 580, 1 + i * 36, 59, 35)
        : sliceTexture(gr, 543, 1 + i * 36, 96, 35),
    ),
    dealerHatOpenFrames,
    dealerPourLeftFrames: [0, 1, 2].map((i) => sliceMaskedTexture(vr, 500, 1 + i * 94, 69, 93)),
    dealerPourRightFrames: [0, 1].map((i) => sliceMaskedTexture(vr, 430, 64 + i * 77, 69, 76)),
    dealerPourDownFrames: [dealerHatOpenFrames[3], sliceMaskedTexture(vr, 430, 1, 69, 61)],
    botFrames: [0, 1, 2, 3, 4, 5, 6].map((i) => sliceTexture(gr, 118, 1 + i * 43, 73, 42)),
    botTossLeftFrames: [97, 49, 1].map((y) => sliceMaskedTexture(vr, 341, y, 84, 47)),
    botTossRightFrames: [241, 193, 145].map((y) => sliceMaskedTexture(vr, 341, y, 84, 47)),
    botShrugLeftTex: sliceMaskedTexture(vr, 256, 1, 84, 47),
    botShrugRightTex: sliceMaskedTexture(vr, 256, 145, 84, 47),
    botPurseReachFrames: [1, 57, 113].map((y) => sliceBotPurse(359, y)),
    botPurseOpenLeftFrames: [
      sliceBotPurse(359, 169),
      sliceBotPurse(359, 225),
      sliceBotPurse(359, 281),
      sliceBotPurse(418, 1),
      sliceBotPurse(418, 57),
      sliceBotPurse(418, 113),
      sliceBotPurse(418, 169),
    ],
    botPurseOpenRightFrames: [
      sliceBotPurse(359, 169),
      sliceBotPurse(359, 225),
      sliceBotPurse(359, 281),
      sliceBotPurse(418, 1),
      sliceBotPurse(418, 57),
      sliceBotPurse(418, 113),
      sliceBotPurse(418, 281),
    ],
    botPurseCloseFrames: [
      sliceBotPurse(418, 225),
      sliceBotPurse(359, 57),
      sliceBotPurse(359, 1),
    ],
    botPurseEmptyFrames: [1, 57, 113, 169].map((y) => sliceBotPurse(300, y)),
    botArmReachLeft: {
      prepTex: sliceMaskedTexture(vr, 256, 145, 84, 47),
      waveTex: sliceMaskedTexture(vr, 341, 145, 84, 47),
      pickNearFrames: [1, 86, 171].map((x) => sliceMaskedTexture(vr, x, 189, 84, 69)),
      pickFarFrames: [1, 86, 171].map((x) => sliceMaskedTexture(vr, x, 259, 84, 69)),
      aimLeftSeatTex: sliceMaskedTexture(vr, 256, 241, 84, 47),
      throwLeftSeatTex: sliceMaskedTexture(vr, 341, 241, 84, 47),
      aimRightSeatTex: sliceMaskedTexture(vr, 256, 193, 84, 47),
      throwRightSeatTex: sliceMaskedTexture(vr, 341, 193, 84, 47),
    },
    botArmReachRight: {
      prepTex: sliceMaskedTexture(vr, 256, 1, 84, 47),
      waveTex: sliceMaskedTexture(vr, 341, 1, 84, 47),
      pickNearFrames: [171, 86, 1].map((x) => sliceMaskedTexture(vr, x, 49, 84, 69)),
      pickFarFrames: [171, 86, 1].map((x) => sliceMaskedTexture(vr, x, 119, 84, 69)),
      aimLeftSeatTex: sliceMaskedTexture(vr, 256, 49, 84, 47),
      throwLeftSeatTex: sliceMaskedTexture(vr, 341, 49, 84, 47),
      aimRightSeatTex: sliceMaskedTexture(vr, 256, 97, 84, 47),
      throwRightSeatTex: sliceMaskedTexture(vr, 341, 97, 84, 47),
    },
    botYawnFrames: [37, 70, 103, 136, 169].map((y) => sliceTexture(gr, 538, y, 41, 32)),
    flyingCardFrames: [220, 232, 244].map((y) => sliceMaskedTexture(gr, 10, y, 28, 11)),
    coinFrames: [204, 230, 256].map((y) => sliceMaskedTexture(gr, 84, y, 24, 23)),
    smallCoinTex: sliceMaskedTexture(gr, 97, 334, 9, 7),
    humanCoinFrames: [0, 1, 2, 3, 4, 5].map((i) => sliceMaskedTexture(gr, 85, 206 + i * 24, 32, 23)),
    payoutClusterFrames: [176, 191].map((y) => sliceMaskedTexture(gr, 92, y, 16, 14)),
    payoutStackFrames: [187, 210, 233].map((y) => sliceMaskedTexture(gr, 47, y, 29, 22)),
    flameFrames: [0, 1, 2].map((i) => sliceTexture(gr, 39 + i * 8, 176, 7, 10)),
    thermoTextures,
    miniBackTex: sliceTexture(gr, 478, 318, 14, 16),
  };
}

/** Evaluates a piecewise-linear or 3-point quadratic Bezier path at normalized progress `t in [0, 1]`. */
export function evaluateWaypointPath(points: readonly Waypoint[], t: number): Waypoint {
  const u = Math.max(0, Math.min(1, t));
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  if (points.length === 2) {
    return {
      x: points[0].x + (points[1].x - points[0].x) * u,
      y: points[0].y + (points[1].y - points[0].y) * u,
    };
  }
  if (points.length === 3) {
    // Pass near middle control point via weighted quadratic curve so the coin arcs smoothly through DOS apex.
    const omt = 1 - u;
    const ctrlX = 2 * points[1].x - 0.5 * (points[0].x + points[2].x);
    const ctrlY = 2 * points[1].y - 0.5 * (points[0].y + points[2].y);
    return {
      x: omt * omt * points[0].x + 2 * omt * u * ctrlX + u * u * points[2].x,
      y: omt * omt * points[0].y + 2 * omt * u * ctrlY + u * u * points[2].y,
    };
  }
  const scaled = u * (points.length - 1);
  const idx = Math.min(points.length - 2, Math.floor(scaled));
  const localT = scaled - idx;
  return {
    x: points[idx].x + (points[idx + 1].x - points[idx].x) * localT,
    y: points[idx].y + (points[idx + 1].y - points[idx].y) * localT,
  };
}

export interface EgaCoinTrajectory {
  readonly waypoints: readonly Waypoint[];
  readonly durationMs: number;
  readonly getTexture: (t: number, elapsedMs: number) => Texture;
}

/** Coin trajectory into the dealer's upside-down hat (`NINE.EXE` `proc_0b16`). */
export function getEgaHatCoinTrajectory(bank: EgaSpriteBank, seat: SeatIndex): EgaCoinTrajectory {
  if (seat === 1) {
    return {
      waypoints: [
        { x: 92, y: 112 },
        { x: 202, y: 56 },
        { x: 312, y: 65 },
      ],
      durationMs: 560,
      getTexture: () => bank.smallCoinTex,
    };
  }
  if (seat === 2) {
    return {
      waypoints: [
        { x: 546, y: 120 },
        { x: 444, y: 58 },
        { x: 325, y: 65 },
      ],
      durationMs: 560,
      getTexture: () => bank.smallCoinTex,
    };
  }
  return {
    waypoints: [
      { x: 324, y: 315 },
      { x: 324, y: 230 },
      { x: 324, y: 145 },
      { x: 324, y: 60 },
      { x: 318, y: 44 },
      { x: 312, y: 66 },
    ],
    durationMs: 740,
    getTexture: (t) => {
      const idx = Math.min(
        bank.humanCoinFrames.length - 1,
        Math.floor(Math.min(1, t / 0.62) * (bank.humanCoinFrames.length - 1)),
      );
      return bank.humanCoinFrames[idx];
    },
  };
}

/** Pot payout coin cluster trajectory out of the dealer's hat (`NINE.EXE` `proc_0ce8`). */
export function getEgaPayoutCoinTrajectory(
  bank: EgaSpriteBank,
  winner: SeatIndex,
  clusterIdx = 0,
): EgaCoinTrajectory {
  const jitterX = (clusterIdx - 1) * 5;
  const jitterY = (clusterIdx % 2) * 3;
  if (winner === 1) {
    return {
      waypoints: [
        { x: 266 + jitterX, y: 24 + jitterY },
        { x: 149, y: 43 },
        { x: 57 + jitterX, y: 117 + jitterY },
      ],
      durationMs: 680,
      getTexture: (_t, elapsedMs) =>
        bank.payoutClusterFrames[Math.floor(elapsedMs / 95) % bank.payoutClusterFrames.length],
    };
  }
  if (winner === 2) {
    return {
      waypoints: [
        { x: 331 + jitterX, y: 50 + jitterY },
        { x: 422, y: 28 },
        { x: 564 + jitterX, y: 117 + jitterY },
      ],
      durationMs: 680,
      getTexture: (_t, elapsedMs) =>
        bank.payoutClusterFrames[Math.floor(elapsedMs / 95) % bank.payoutClusterFrames.length],
    };
  }
  return {
    waypoints: [
      { x: 306 + jitterX, y: 74 },
      { x: 306 + jitterX, y: 188 },
      { x: 306 + jitterX, y: 292 + jitterY },
    ],
    durationMs: 760,
    getTexture: (t) => {
      const idx = Math.min(bank.payoutStackFrames.length - 1, Math.floor(t * bank.payoutStackFrames.length));
      return bank.payoutStackFrames[idx];
    },
  };
}

export interface EgaBotThrowPose {
  /** Active `VR_NINE` overlay texture, or `null` once bot settles back to idle pose (`t >= 0.96`). */
  readonly overlayTex: Texture | null;
  /** Screen X coordinate for the `84px` `VR_NINE` overlay so the torso locks at `0px` shift (`10`/`33` or `522`/`545`). */
  readonly overlayX: number;
  /** Normalized card flight progress `0..1` (`0` while bot is reaching/aiming before release at `t = 0.60`). */
  readonly flyProgress: number;
  /** True once hand lifts the card off the stack (`t >= 0.40`). */
  readonly cardPickedFromStack: boolean;
  /** True once arm snaps forward to release the card (`t >= 0.60`). */
  readonly cardReleased: boolean;
}

function resolveBotSlotArm(
  seat: 1 | 2,
  slotIdx: number,
  cols: number,
): { row: 0 | 1; useRightArm: boolean; armStep: 0 | 1 | 2; overlayX: number } {
  const safeCols = Math.max(2, cols);
  const col = Math.max(0, Math.min(safeCols - 1, slotIdx % safeCols));
  const row: 0 | 1 = Math.floor(Math.max(0, slotIdx) / safeCols) >= 1 ? 1 : 0;
  const halfCols = Math.ceil(safeCols / 2);
  const useRightArm = col >= halfCols;
  const localCol = useRightArm ? col - halfCols : col;
  const armSpan = Math.max(1, useRightArm ? safeCols - halfCols : halfCols);
  const armStep = Math.max(0, Math.min(2, armSpan <= 3 ? localCol : Math.round((localCol / (armSpan - 1)) * 2))) as
    | 0
    | 1
    | 2;
  const overlayX = seat === 1 ? (useRightArm ? 33 : 10) : useRightArm ? 545 : 522;
  return { row, useRightArm, armStep, overlayX };
}

/** Exact DOS card release origin (`NINE_MAIN_CODE.asm` `CS:1A00..1A63`) matching which arm picked the slot. */
export function getEgaBotCardLaunchPos(seat: 1 | 2, slotIdx: number, cols: number): Waypoint {
  const { useRightArm } = resolveBotSlotArm(seat, slotIdx, cols);
  if (seat === 1) {
    return useRightArm ? { x: 102, y: 137 } : { x: 64, y: 138 };
  }
  return useRightArm ? { x: 544, y: 138 } : { x: 509, y: 137 };
}

/** DOS `proc_037d(1 -> 2 -> 3)` & `proc_0b16` single-pass coin-purse timings (`180ms` reach, `1200ms` single coin pull, `520ms` flight, `600ms` close). */
export const EGA_BOT_PURSE_REACH_MS = 180;
export const EGA_BOT_PURSE_OPEN_MS = 1200;
export const EGA_BOT_PURSE_COIN_RELEASE_MS = EGA_BOT_PURSE_REACH_MS + EGA_BOT_PURSE_OPEN_MS;
export const EGA_BOT_PURSE_COIN_FLIGHT_MS = 520;
export const EGA_BOT_PURSE_CLOSE_MS = 600;
export const EGA_BOT_PURSE_TOSS_TOTAL_MS =
  EGA_BOT_PURSE_COIN_RELEASE_MS + EGA_BOT_PURSE_COIN_FLIGHT_MS + EGA_BOT_PURSE_CLOSE_MS;

/** Exact DOS `proc_05cb` durations: `15 × 200ms` empty-purse shake + `500ms` shrug + `500ms` settle. */
export const EGA_BOT_BROKE_SHAKE_DURATION_MS = 4000;

/** DOS-paced card-pick/throw durations including BIOS tick dwell, flight, and `300ms` post-land settle. */
export const EGA_BOT_THROW_NEAR_MS = 1160;
export const EGA_BOT_THROW_FAR_MS = 1280;

/**
 * Evaluates original MS-DOS `NINE.EXE` `proc_13d4` (`CS:151A..1C1C`) card-pick and throw sequence
 * paced for crisp 60fps legibility matching DOS hardware tick quantization + `MoveImageSmooth`.
 */
export function getEgaBotCardThrowPose(
  bank: EgaSpriteBank,
  seat: 1 | 2,
  slotIdx: number,
  cols: number,
  t: number,
): EgaBotThrowPose {
  const u = Math.max(0, Math.min(1, t));
  const { row, useRightArm, armStep, overlayX } = resolveBotSlotArm(seat, slotIdx, cols);
  const arm = useRightArm ? bank.botArmReachRight : bank.botArmReachLeft;
  const pickTex = (row === 1 ? arm.pickFarFrames : arm.pickNearFrames)[armStep];
  const aimTex = seat === 1 ? arm.aimLeftSeatTex : arm.aimRightSeatTex;
  const throwTex = seat === 1 ? arm.throwLeftSeatTex : arm.throwRightSeatTex;

  const totalMs = row === 1 ? EGA_BOT_THROW_FAR_MS : EGA_BOT_THROW_NEAR_MS;
  const ms = u * totalMs;
  const waveAt = 110;
  const pickAt = 260;
  const aimAt = row === 1 ? 520 : 420;
  const releaseAt = aimAt + 220; // 640ms near / 740ms far -> launch after 20ms snap (660/760ms)
  const launchAt = releaseAt + 20;
  const settleAt = launchAt + 240;
  const idleAt = totalMs - 40;

  let overlayTex: Texture | null = null;
  if (ms < waveAt) {
    overlayTex = arm.prepTex;
  } else if (ms < pickAt) {
    overlayTex = arm.waveTex;
  } else if (ms < aimAt) {
    overlayTex = pickTex;
  } else if (ms < releaseAt) {
    overlayTex = aimTex;
  } else if (ms < settleAt) {
    overlayTex = throwTex;
  } else if (ms < idleAt) {
    overlayTex = arm.prepTex;
  }

  return {
    overlayTex,
    overlayX,
    flyProgress: ms < launchAt ? 0 : Math.min(1, (ms - launchAt) / Math.max(1, totalMs - launchAt)),
    cardPickedFromStack: ms >= aimAt,
    cardReleased: ms >= launchAt,
  };
}

/**
 * Original `GR_NINE (118, 1+i*43)` bot thinking & finger-tapping sequence (`AnimatePortraitAndCandles`, 100ms/step).
 * 21 steps (`2100ms`): chin-rest gaze (`0..5`), 4 finger-tap cycles (`4->5->3`), side-glance (`2->6` at `y=259`), idle `0`.
 */
export const EGA_BOT_TAP_SEQUENCE: readonly number[] = [
  0, 1, 2, 3, 4, 5, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 2, 6, 0,
];
export const EGA_BOT_TAP_DURATION_MS = EGA_BOT_TAP_SEQUENCE.length * 100;

export function getEgaBotTapFrame(bank: EgaSpriteBank, elapsedMs: number): Texture {
  const step = Math.floor(Math.max(0, elapsedMs) / 100);
  const idx = EGA_BOT_TAP_SEQUENCE[Math.min(EGA_BOT_TAP_SEQUENCE.length - 1, step)];
  return bank.botFrames[idx] ?? bank.botFrames[0];
}

export interface EgaDealerDealPose {
  readonly texture: Texture;
  readonly frameIdx: number;
  readonly x: number;
  readonly y: number;
  readonly coverRestingElbow: boolean;
}

/**
 * Selects the directional dealer dealing frame (`0..5` narrow `59×35` at `x=293`, `6..8` extended `96×35` at `x=256`)
 * matching the seat receiving the current card (`1` left, `2` right, `3` bottom/human).
 */
export function getEgaDealerDealPose(
  bank: EgaSpriteBank,
  seat: SeatIndex,
  cardProgress01: number,
): EgaDealerDealPose {
  const u = Math.max(0, Math.min(0.999, cardProgress01));
  const seq: readonly number[] =
    seat === 1 ? [5, 6, 7, 8] : seat === 2 ? [0, 1, 2, 1] : [3, 4, 5];
  const frameIdx = seq[Math.floor(u * seq.length)] ?? 0;
  return {
    texture: bank.dealerDealFrames[frameIdx] ?? bank.dealerDealFrames[0],
    frameIdx,
    x: frameIdx >= 6 ? 256 : 293,
    y: 37,
    coverRestingElbow: frameIdx < 6,
  };
}

/**
 * DOS `proc_037d(1 -> 2 -> 3)` coin-purse animation (single clean coin extraction & toss):
 * `3 × 60ms` reach -> `1200ms` open & extract coin once -> hold while coin arcs (`520ms`) -> `600ms` close & tuck away.
 */
export function getEgaBotPurseTossFrame(
  bank: EgaSpriteBank,
  seat: 1 | 2,
  localMs: number,
  durationMs = EGA_BOT_PURSE_TOSS_TOTAL_MS,
): Texture | null {
  if (localMs < 0 || localMs >= durationMs) return null;
  const scaledMs = (localMs / Math.max(1, durationMs)) * EGA_BOT_PURSE_TOSS_TOTAL_MS;
  const openFrames = seat === 1 ? bank.botPurseOpenLeftFrames : bank.botPurseOpenRightFrames;
  if (scaledMs < EGA_BOT_PURSE_REACH_MS) {
    const idx = Math.min(bank.botPurseReachFrames.length - 1, Math.floor(scaledMs / 60));
    return bank.botPurseReachFrames[idx] ?? bank.botPurseReachFrames[0];
  }
  if (scaledMs < EGA_BOT_PURSE_COIN_RELEASE_MS) {
    const openElapsed = scaledMs - EGA_BOT_PURSE_REACH_MS;
    const idx = Math.min(
      openFrames.length - 1,
      Math.floor((openElapsed / Math.max(1, EGA_BOT_PURSE_OPEN_MS)) * openFrames.length),
    );
    return openFrames[idx] ?? openFrames[openFrames.length - 1];
  }
  const closeStartMs = EGA_BOT_PURSE_COIN_RELEASE_MS + EGA_BOT_PURSE_COIN_FLIGHT_MS;
  if (scaledMs < closeStartMs) {
    return openFrames[openFrames.length - 1] ?? null;
  }
  const closeElapsed = scaledMs - closeStartMs;
  const closeIdx = Math.min(
    bank.botPurseCloseFrames.length - 1,
    Math.floor((closeElapsed / Math.max(1, EGA_BOT_PURSE_CLOSE_MS)) * bank.botPurseCloseFrames.length),
  );
  return bank.botPurseCloseFrames[closeIdx] ?? bank.botPurseCloseFrames[0];
}

/**
 * Original `GR_NINE` `proc_05cb` 15-frame broke empty-purse shake (`200ms`/frame = `3000ms`)
 * + `500ms` empty-hand shrug `(300, 169)` + `500ms` settle `(359, 1)`.
 */
export function getEgaBotBrokeShakeFrame(
  bank: EgaSpriteBank,
  elapsedMs: number,
  durationMs = EGA_BOT_BROKE_SHAKE_DURATION_MS,
): Texture {
  const shakeFrames: readonly Texture[] = [
    bank.botPurseReachFrames[0],
    bank.botPurseReachFrames[1],
    bank.botPurseReachFrames[2],
    bank.botPurseOpenLeftFrames[0],
    bank.botPurseOpenLeftFrames[1],
    bank.botPurseOpenLeftFrames[2],
    bank.botPurseOpenLeftFrames[3],
    bank.botPurseEmptyFrames[0],
    bank.botPurseEmptyFrames[1],
    bank.botPurseEmptyFrames[2],
    bank.botPurseEmptyFrames[1],
    bank.botPurseEmptyFrames[2],
    bank.botPurseOpenLeftFrames[2],
    bank.botPurseCloseFrames[0],
    bank.botPurseReachFrames[0],
  ];
  const scaledMs = Math.max(0, (elapsedMs / Math.max(1, durationMs)) * EGA_BOT_BROKE_SHAKE_DURATION_MS);
  if (scaledMs < 3000) {
    const idx = Math.min(shakeFrames.length - 1, Math.floor(scaledMs / 200));
    return shakeFrames[idx] ?? shakeFrames[0];
  }
  if (scaledMs < 3500) {
    return bank.botPurseEmptyFrames[3];
  }
  return bank.botPurseReachFrames[0];
}

/** Original `proc_037d(4)` purse put-away (`(359, 57) -> (359, 1)` at `60ms`/step) after bot receives payout coins. */
export function getEgaBotPurseReceiveFrame(
  bank: EgaSpriteBank,
  localMs: number,
  durationMs = 120,
): Texture | null {
  if (localMs < 0 || localMs >= durationMs) return null;
  const idx = localMs < durationMs * 0.5 ? 1 : 0;
  return bank.botPurseReachFrames[idx] ?? null;
}

/**
 * Original DOS `proc_113b` bot yawn/reaction timings:
 * - `full === true`: `[0: 140ms, 1: 300ms, 2: 700ms, 3: 220ms]` (`1360ms`)
 * - `full === false`: `[4: 500ms, 0: 180ms]` (`680ms` wide-mouth yawn)
 */
export function getEgaBotYawnFrame(bank: EgaSpriteBank, elapsedMs: number, full = true): Texture | null {
  const steps: readonly { tex: Texture; ms: number }[] = full
    ? [
        { tex: bank.botYawnFrames[0], ms: 140 },
        { tex: bank.botYawnFrames[1], ms: 300 },
        { tex: bank.botYawnFrames[2], ms: 700 },
        { tex: bank.botYawnFrames[3], ms: 220 },
      ]
    : [
        { tex: bank.botYawnFrames[4] ?? bank.botYawnFrames[2], ms: 500 },
        { tex: bank.botYawnFrames[0], ms: 180 },
      ];
  if (elapsedMs < 0) return null;
  let acc = 0;
  for (const s of steps) {
    acc += s.ms;
    if (elapsedMs < acc) return s.tex;
  }
  return null;
}

/**
 * Original DOS `AnimatePortraitAndCandles(2)` (`CS:7460..7576`) 14-frame dealer glance/wag sequence (`2000ms`).
 */
export function getEgaDealerGlanceWagFrame(bank: EgaSpriteBank, elapsedMs: number): Texture {
  const steps: readonly { tex: Texture; ms: number }[] = [
    { tex: bank.dealerLookLeftTex, ms: 200 },
    { tex: bank.dealerLookRightTex, ms: 200 },
    { tex: bank.dealerWagFrames[0], ms: 100 },
    { tex: bank.dealerWagFrames[1], ms: 100 },
    { tex: bank.dealerWagFrames[2], ms: 100 },
    { tex: bank.dealerWagFrames[1], ms: 100 },
    { tex: bank.dealerWagFrames[0], ms: 100 },
    { tex: bank.dealerWagFrames[1], ms: 100 },
    { tex: bank.dealerWagFrames[2], ms: 100 },
    { tex: bank.dealerWagFrames[1], ms: 100 },
    { tex: bank.dealerWagFrames[0], ms: 200 },
    { tex: bank.dealerLookRightTex, ms: 200 },
    { tex: bank.dealerLookLeftTex, ms: 200 },
    { tex: bank.dealerIdleTex, ms: 200 },
  ];
  let acc = 0;
  for (const s of steps) {
    acc += s.ms;
    if (elapsedMs < acc) return s.tex;
  }
  return bank.dealerIdleTex;
}

/** Evaluates a quick low-arc trajectory for dealing a single card from dealer's hands to a seat. */
export function computeEgaDealCardPos(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  t: number,
): Waypoint {
  const u = Math.max(0, Math.min(1, t));
  const arc = Math.sin(u * Math.PI) * 10;
  return {
    x: startX + (endX - startX) * u,
    y: startY + (endY - startY) * u - arc,
  };
}

/** Parabolic flight position (`NINE.EXE` `proc_085d`) lifting above the straight segment between endpoints. */
export function computeEgaParabolicCardPos(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  t: number,
): Waypoint {
  const u = Math.max(0, Math.min(1, t));
  const arcLift = Math.sin(u * Math.PI) * 34;
  return {
    x: startX + (endX - startX) * u,
    y: startY + (endY - startY) * u - arcLift,
  };
}
