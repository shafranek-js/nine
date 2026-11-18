import type { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import {
  EGA_BOT_BROKE_SHAKE_DURATION_MS,
  EGA_BOT_PURSE_COIN_RELEASE_MS,
  EGA_BOT_PURSE_TOSS_TOTAL_MS,
  EGA_BOT_TAP_DURATION_MS,
  EGA_BOT_THROW_FAR_MS,
  EGA_BOT_THROW_NEAR_MS,
  computeEgaDealCardPos,
  computeEgaParabolicCardPos,
  evaluateWaypointPath,
  getEgaBotBrokeShakeFrame,
  getEgaBotCardLaunchPos,
  getEgaBotCardThrowPose,
  getEgaBotPurseReceiveFrame,
  getEgaBotPurseTossFrame,
  getEgaBotTapFrame,
  getEgaBotYawnFrame,
  getEgaDealerDealPose,
  getEgaDealerGlanceWagFrame,
  getEgaHatCoinTrajectory,
  getEgaPayoutCoinTrajectory,
  type EgaBotArmSprites,
  type EgaSpriteBank,
} from '../src/engine/egaAnimations';
import { getEgaIntroTrumpetFrame } from '../src/scenes/IntroScene';

function makeArmMock(prefix: string, tex: (l: string) => Texture): EgaBotArmSprites {
  return {
    prepTex: tex(`${prefix}_prep`),
    waveTex: tex(`${prefix}_wave`),
    pickNearFrames: [tex(`${prefix}_near0`), tex(`${prefix}_near1`), tex(`${prefix}_near2`)],
    pickFarFrames: [tex(`${prefix}_far0`), tex(`${prefix}_far1`), tex(`${prefix}_far2`)],
    aimLeftSeatTex: tex(`${prefix}_aimL`),
    throwLeftSeatTex: tex(`${prefix}_throwL`),
    aimRightSeatTex: tex(`${prefix}_aimR`),
    throwRightSeatTex: tex(`${prefix}_throwR`),
  };
}

function makeMockBank(): EgaSpriteBank {
  const tex = (label: string) => ({ label } as unknown as Texture);
  return {
    dealerIdleTex: tex('dealerIdle'),
    dealerBlinkTex: tex('dealerBlink'),
    dealerLookLeftTex: tex('dealerLookLeft'),
    dealerLookRightTex: tex('dealerLookRight'),
    dealerBellFrames: [tex('bell0')],
    dealerWagFrames: [tex('wag0'), tex('wag1'), tex('wag2')],
    dealerDealFrames: Array.from({ length: 9 }, (_, i) => tex(`deal${i}`)),
    dealerHatOpenFrames: [tex('hat0'), tex('hat1'), tex('hat2'), tex('hat3'), tex('hat4')],
    dealerPourLeftFrames: [tex('pourL0')],
    dealerPourRightFrames: [tex('pourR0')],
    dealerPourDownFrames: [tex('pourD0')],
    botFrames: [tex('bot0'), tex('bot1'), tex('bot2'), tex('bot3'), tex('bot4'), tex('bot5'), tex('bot6')],
    botTossLeftFrames: [tex('tossL0')],
    botTossRightFrames: [tex('tossR0')],
    botShrugLeftTex: tex('shrugL'),
    botShrugRightTex: tex('shrugR'),
    botPurseReachFrames: [tex('pr0'), tex('pr1'), tex('pr2')],
    botPurseOpenLeftFrames: Array.from({ length: 7 }, (_, i) => tex(`poL${i}`)),
    botPurseOpenRightFrames: Array.from({ length: 7 }, (_, i) => tex(`poR${i}`)),
    botPurseCloseFrames: [tex('pc0'), tex('pc1'), tex('pc2')],
    botPurseEmptyFrames: [tex('pe0'), tex('pe1'), tex('pe2'), tex('pe3')],
    botArmReachLeft: makeArmMock('armL', tex),
    botArmReachRight: makeArmMock('armR', tex),
    botYawnFrames: [tex('yawn0'), tex('yawn1'), tex('yawn2'), tex('yawn3'), tex('yawn4')],
    flyingCardFrames: [tex('card0')],
    coinFrames: [tex('coin0')],
    smallCoinTex: tex('smallCoin'),
    humanCoinFrames: [tex('hc0'), tex('hc1'), tex('hc2'), tex('hc3'), tex('hc4'), tex('hc5')],
    payoutClusterFrames: [tex('pc0'), tex('pc1')],
    payoutStackFrames: [tex('ps0'), tex('ps1'), tex('ps2')],
    flameFrames: [tex('flame0')],
    thermoTextures: [tex('thermo0')],
    miniBackTex: tex('miniBack'),
  };
}

describe('egaAnimations', () => {
  it('evaluates 3-point quadratic paths passing cleanly through the midpoint at t=0.5', () => {
    const pts = [
      { x: 87, y: 105 },
      { x: 191, y: 61 },
      { x: 308, y: 60 },
    ];
    expect(evaluateWaypointPath(pts, 0)).toEqual({ x: 87, y: 105 });
    expect(evaluateWaypointPath(pts, 1)).toEqual({ x: 308, y: 60 });
    const mid = evaluateWaypointPath(pts, 0.5);
    expect(mid.x).toBeCloseTo(191, 5);
    expect(mid.y).toBeCloseTo(61, 5);
  });

  it('produces DOS hat-toss trajectories landing inside the upside-down top hat', () => {
    const bank = makeMockBank();
    const t1 = getEgaHatCoinTrajectory(bank, 1);
    const t2 = getEgaHatCoinTrajectory(bank, 2);
    const t3 = getEgaHatCoinTrajectory(bank, 3);

    expect(evaluateWaypointPath(t1.waypoints, 1)).toEqual({ x: 312, y: 65 });
    expect(evaluateWaypointPath(t2.waypoints, 1)).toEqual({ x: 325, y: 65 });
    expect(evaluateWaypointPath(t3.waypoints, 1)).toEqual({ x: 312, y: 66 });
    expect(t3.getTexture(0, 0)).toBe(bank.humanCoinFrames[0]);
    expect(t3.getTexture(0.95, 320)).toBe(bank.humanCoinFrames[5]);
  });

  it('produces payout coin trajectories toward each winning seat', () => {
    const bank = makeMockBank();
    const p1 = getEgaPayoutCoinTrajectory(bank, 1, 1);
    const p2 = getEgaPayoutCoinTrajectory(bank, 2, 1);
    const p3 = getEgaPayoutCoinTrajectory(bank, 3, 1);

    expect(evaluateWaypointPath(p1.waypoints, 1).x).toBe(57);
    expect(evaluateWaypointPath(p2.waypoints, 1).x).toBe(564);
    expect(p3.getTexture(0.1, 40)).toBe(bank.payoutStackFrames[0]);
    expect(p3.getTexture(0.9, 410)).toBe(bank.payoutStackFrames[2]);
  });

  it('lifts EGA flying cards along a smooth parabolic arc', () => {
    const start = computeEgaParabolicCardPos(104, 156, 300, 156, 0);
    const mid = computeEgaParabolicCardPos(104, 156, 300, 156, 0.5);
    const end = computeEgaParabolicCardPos(104, 156, 300, 156, 1);

    expect(start).toEqual({ x: 104, y: 156 });
    expect(end).toEqual({ x: 300, y: 156 });
    expect(mid.x).toBe(202);
    expect(mid.y).toBeLessThan(130);
  });

  it('reaches exact near/far row-column card slots and steps DOS prep -> wave -> pick -> aim -> throw -> settle', () => {
    const bank = makeMockBank();
    expect(EGA_BOT_THROW_NEAR_MS).toBe(1160);
    expect(EGA_BOT_THROW_FAR_MS).toBe(1280);

    // Near row outer-left slot 0 (seat 1, X=10, reach-left arm): 110ms prep, 150ms wave, 160ms pick, 220ms aim, 20ms+460ms throw+fly
    const prepNear = getEgaBotCardThrowPose(bank, 1, 0, 6, 50 / 1160);
    const waveNear = getEgaBotCardThrowPose(bank, 1, 0, 6, 180 / 1160);
    const pickNear = getEgaBotCardThrowPose(bank, 1, 0, 6, 340 / 1160);
    expect(prepNear.overlayTex).toBe(bank.botArmReachLeft.prepTex);
    expect(prepNear.overlayX).toBe(10);
    expect(waveNear.overlayTex).toBe(bank.botArmReachLeft.waveTex);
    expect(pickNear.overlayTex).toBe(bank.botArmReachLeft.pickNearFrames[0]);
    expect(getEgaBotCardLaunchPos(1, 0, 6)).toEqual({ x: 64, y: 138 });

    // Far row outer-right slot 11 (seat 1, col 5, row 1 -> X=33, 260ms far pick)
    const pickFar = getEgaBotCardThrowPose(bank, 1, 11, 6, 380 / 1280);
    const aim = getEgaBotCardThrowPose(bank, 1, 11, 6, 620 / 1280);
    const thr = getEgaBotCardThrowPose(bank, 1, 11, 6, 860 / 1280);
    const settle = getEgaBotCardThrowPose(bank, 1, 11, 6, 1080 / 1280);
    const idle = getEgaBotCardThrowPose(bank, 1, 11, 6, 1260 / 1280);

    expect(pickFar.overlayTex).toBe(bank.botArmReachRight.pickFarFrames[2]);
    expect(pickFar.overlayX).toBe(33);
    expect(pickFar.cardReleased).toBe(false);
    expect(pickFar.flyProgress).toBe(0);

    expect(aim.overlayTex).toBe(bank.botArmReachRight.aimLeftSeatTex);
    expect(aim.cardPickedFromStack).toBe(true);
    expect(aim.cardReleased).toBe(false);

    expect(thr.overlayTex).toBe(bank.botArmReachRight.throwLeftSeatTex);
    expect(thr.cardReleased).toBe(true);
    expect(thr.flyProgress).toBeGreaterThan(0);

    expect(settle.overlayTex).toBe(bank.botArmReachRight.prepTex);
    expect(idle.overlayTex).toBeNull();
    expect(idle.flyProgress).toBeCloseTo((1260 - 760) / (1280 - 760), 5);
    expect(getEgaBotCardLaunchPos(1, 11, 6)).toEqual({ x: 102, y: 137 });

    // Right bot reaches X=522 for col <= 2, X=545 for col >= 3
    expect(getEgaBotCardThrowPose(bank, 2, 7, 6, 380 / 1280).overlayTex).toBe(bank.botArmReachLeft.pickFarFrames[1]);
    expect(getEgaBotCardThrowPose(bank, 2, 7, 6, 380 / 1280).overlayX).toBe(522);
    expect(getEgaBotCardThrowPose(bank, 2, 5, 6, 340 / 1160).overlayX).toBe(545);
    expect(getEgaBotCardLaunchPos(2, 7, 6)).toEqual({ x: 509, y: 137 });
    expect(getEgaBotCardLaunchPos(2, 5, 6)).toEqual({ x: 544, y: 138 });
  });

  it('cycles through the 21-step finger-tapping and side-glance frames when EGA bot thinks', () => {
    const bank = makeMockBank();
    expect(EGA_BOT_TAP_DURATION_MS).toBe(2100);
    expect(getEgaBotTapFrame(bank, 0)).toBe(bank.botFrames[0]);
    expect(getEgaBotTapFrame(bank, 350)).toBe(bank.botFrames[3]);
    expect(getEgaBotTapFrame(bank, 450)).toBe(bank.botFrames[4]);
    expect(getEgaBotTapFrame(bank, 550)).toBe(bank.botFrames[5]);
    expect(getEgaBotTapFrame(bank, 1850)).toBe(bank.botFrames[2]);
    expect(getEgaBotTapFrame(bank, 1950)).toBe(bank.botFrames[6]);
    expect(getEgaBotTapFrame(bank, 2050)).toBe(bank.botFrames[0]);
  });

  it('aligns dealer dealing strokes by seat and shifts left-reach frames 6..8 to x=256', () => {
    const bank = makeMockBank();
    const leftPeak = getEgaDealerDealPose(bank, 1, 0.55);
    expect(leftPeak.frameIdx).toBe(7);
    expect(leftPeak.x).toBe(256);
    expect(leftPeak.coverRestingElbow).toBe(false);

    const rightPeak = getEgaDealerDealPose(bank, 2, 0.55);
    expect(rightPeak.frameIdx).toBe(2);
    expect(rightPeak.x).toBe(293);
    expect(rightPeak.coverRestingElbow).toBe(true);

    const humanMid = getEgaDealerDealPose(bank, 3, 0.5);
    expect(humanMid.frameIdx).toBe(4);
    expect(humanMid.x).toBe(293);
    expect(humanMid.coverRestingElbow).toBe(true);
  });

  it('plays DOS coin-purse toss (single pull-and-toss pass), empty-purse broke shake (200ms/step), yawn, payout, and dealer glance', () => {
    const bank = makeMockBank();
    expect(EGA_BOT_PURSE_COIN_RELEASE_MS).toBe(1380);
    expect(EGA_BOT_PURSE_TOSS_TOTAL_MS).toBe(2500);
    expect(EGA_BOT_BROKE_SHAKE_DURATION_MS).toBe(4000);

    expect(getEgaBotPurseTossFrame(bank, 1, -10)).toBeNull();
    expect(getEgaBotPurseTossFrame(bank, 1, 0)).toBe(bank.botPurseReachFrames[0]);
    expect(getEgaBotPurseTossFrame(bank, 1, 180)).toBe(bank.botPurseOpenLeftFrames[0]);
    expect(getEgaBotPurseTossFrame(bank, 1, 1300)).toBe(bank.botPurseOpenLeftFrames[6]);
    expect(getEgaBotPurseTossFrame(bank, 2, 1300)).toBe(bank.botPurseOpenRightFrames[6]);
    expect(getEgaBotPurseTossFrame(bank, 1, 2490)).toBe(bank.botPurseCloseFrames[2]);
    expect(getEgaBotPurseTossFrame(bank, 1, 2500)).toBeNull();

    expect(getEgaBotBrokeShakeFrame(bank, 0)).toBe(bank.botPurseReachFrames[0]);
    expect(getEgaBotBrokeShakeFrame(bank, 1900)).toBe(bank.botPurseEmptyFrames[2]);
    expect(getEgaBotBrokeShakeFrame(bank, 3200)).toBe(bank.botPurseEmptyFrames[3]);
    expect(getEgaBotBrokeShakeFrame(bank, 3700)).toBe(bank.botPurseReachFrames[0]);

    expect(getEgaBotPurseReceiveFrame(bank, 30, 120)).toBe(bank.botPurseReachFrames[1]);
    expect(getEgaBotPurseReceiveFrame(bank, 90, 120)).toBe(bank.botPurseReachFrames[0]);

    expect(getEgaBotYawnFrame(bank, 200, true)).toBe(bank.botYawnFrames[1]);
    expect(getEgaBotYawnFrame(bank, 800, true)).toBe(bank.botYawnFrames[2]);
    expect(getEgaBotYawnFrame(bank, 1400, true)).toBeNull();
    expect(getEgaBotYawnFrame(bank, 200, false)).toBe(bank.botYawnFrames[4]);

    expect(getEgaDealerGlanceWagFrame(bank, 50)).toBe(bank.dealerLookLeftTex);
    expect(getEgaDealerGlanceWagFrame(bank, 250)).toBe(bank.dealerLookRightTex);
    expect(getEgaDealerGlanceWagFrame(bank, 450)).toBe(bank.dealerWagFrames[0]);
    expect(getEgaDealerGlanceWagFrame(bank, 1950)).toBe(bank.dealerIdleTex);
  });

  it('arcs dealt cards from dealer hands to player slots and sequences intro trumpeters', () => {
    const mid = computeEgaDealCardPos(308, 66, 100, 145, 0.5);
    expect(mid.x).toBe(204);
    expect(mid.y).toBeLessThan(105.5);
    expect(computeEgaDealCardPos(308, 66, 100, 145, 1)).toEqual({ x: 100, y: 145 });

    // Intro: raise 0..3 -> sustain 3<->4 -> lower 3..0
    expect(getEgaIntroTrumpetFrame(0)).toBe(0);
    expect(getEgaIntroTrumpetFrame(420)).toBe(3);
    expect(getEgaIntroTrumpetFrame(520)).toBe(3);
    expect(getEgaIntroTrumpetFrame(650)).toBe(4);
    expect(getEgaIntroTrumpetFrame(15700)).toBe(0);
  });
});
